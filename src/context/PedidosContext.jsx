/* @refresh reset */
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  crearPedidoAPI, 
  consultarPedidoAPI, 
  consultarPedidosAPI,
  PedidoPoller,
  mapearPedido,
  mapearEstadoPedido,
  getUserData,
  isAuthenticated
} from '../config/api';

const PedidosContext = createContext();

// Hook personalizado
const usePedidos = () => {
  const context = useContext(PedidosContext);
  if (!context) {
    throw new Error('usePedidos debe usarse dentro de PedidosProvider');
  }
  return context;
};

const PedidosProvider = ({ children }) => {
  const [pedidos, setPedidos] = useState([]);
  const [pollers, setPollers] = useState({}); // Map de pollers activos por pedido
  const [loading, setLoading] = useState(true); // Iniciar en true para mostrar carga inicial
  const [isLoadingPedidos, setIsLoadingPedidos] = useState(false); // Bandera para evitar llamadas duplicadas

  // Función para cargar pedidos del backend
  const cargarPedidosDelBackend = async () => {
    // Evitar llamadas duplicadas simultáneas
    if (isLoadingPedidos) {
      return;
    }

    try {
      // Verificar autenticación usando la función isAuthenticated
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      setIsLoadingPedidos(true);
      setLoading(true);
      
      // Consultar todos los pedidos del usuario desde el backend
      const response = await consultarPedidosAPI();
      
      const pedidosBackend = response.pedidos || response.data?.pedidos || [];
      
      // Mapear pedidos del backend al formato del frontend
      const pedidosMapeados = pedidosBackend.map(pedidoBackend => {
        const pedidoMapeado = mapearPedido(pedidoBackend);
        
        // Agregar información adicional
        return {
          ...pedidoMapeado,
          items: pedidoBackend.productos?.map(prod => ({
            id: prod.product_id || prod.producto_id,
            nombre: prod.nombre || prod.nombre_producto || 'Producto sin nombre',
            cantidad: prod.quantity || prod.cantidad || 1,
            precio: prod.price || prod.precio || 0,
            imagen: prod.imagen || 'https://via.placeholder.com/64'
          })) || [],
          historialEstados: pedidoBackend.historialEstados || [],
          createdAt: pedidoBackend.fecha_inicio ? new Date(pedidoBackend.fecha_inicio).getTime() : Date.now()
        };
      });
      
      setPedidos(pedidosMapeados);
    } catch (error) {
      console.error('Error cargando pedidos del backend:', error);
      
      // Fallback: cargar desde localStorage si falla el backend
      const savedPedidos = localStorage.getItem('pardos-pedidos');
      if (savedPedidos) {
        try {
          const pedidosGuardados = JSON.parse(savedPedidos);
          setPedidos(pedidosGuardados);
        } catch (parseError) {
          console.error('Error cargando pedidos guardados:', parseError);
        }
      }
    } finally {
      setLoading(false);
      setIsLoadingPedidos(false);
    }
  };

  // Cargar pedidos del backend al iniciar
  useEffect(() => {
    cargarPedidosDelBackend();
  }, []);

  // Ya no necesitamos el intervalo aquí, PedidosLoader maneja la detección de login

  // Guardar pedidos en localStorage cuando cambien
  useEffect(() => {
    if (pedidos.length > 0) {
      localStorage.setItem('pardos-pedidos', JSON.stringify(pedidos));
    }
  }, [pedidos]);

  // Limpiar pollers al desmontar
  useEffect(() => {
    return () => {
      Object.values(pollers).forEach(poller => poller.detener());
    };
  }, [pollers]);

  /**
   * Iniciar polling para un pedido específico
   */
  const iniciarPollingPedido = (pedidoId) => {
    // Si ya existe un poller para este pedido, no crear otro
    if (pollers[pedidoId]) {
      return;
    }

    const poller = new PedidoPoller(pedidoId, (pedidoActualizado) => {
      actualizarEstadoPedido(pedidoId, pedidoActualizado);
    });

    poller.iniciar();
    setPollers(prev => ({ ...prev, [pedidoId]: poller }));
  };

  /**
   * Detener polling para un pedido específico
   */
  const detenerPollingPedido = (pedidoId) => {
    if (pollers[pedidoId]) {
      pollers[pedidoId].detener();
      setPollers(prev => {
        const newPollers = { ...prev };
        delete newPollers[pedidoId];
        return newPollers;
      });
    }
  };

  /**
   * Crear un nuevo pedido en el backend
   */
  const agregarPedido = async (pedidoData) => {
    setLoading(true);
    try {
      // Preparar datos del pedido
      // crearPedidoAPI ya obtiene el user_id del JWT automáticamente
      const datosParaAPI = {
        productos: pedidoData.items.map(item => ({
          producto_id: item.id,
          cantidad: item.quantity || item.cantidad
        })),
        direccion_entrega: pedidoData.direccion,
        telefono: pedidoData.telefono || '999999999',
        medio_pago: pedidoData.metodoPago || 'efectivo',
        notas: pedidoData.notas || ''
      };

      // Llamar a la API (crearPedidoAPI obtiene user_id del JWT)
      const response = await crearPedidoAPI(datosParaAPI);
      const pedidoCreado = response.pedido || response.data?.pedido || response;

      // Mapear pedido del backend al formato del frontend
      const pedidoMapeado = mapearPedido(pedidoCreado);

      // Agregar información adicional del frontend
      const nuevoPedido = {
        ...pedidoMapeado,
        items: pedidoData.items, // Mantener items con toda la info para mostrar
        sede: pedidoData.sede || 'Pollería Principal',
        historialEstados: [
          {
            estado: pedidoMapeado.estado,
            estadoBackend: pedidoMapeado.estadoBackend,
            timestamp: new Date().getTime(),
            fecha: new Date().toLocaleString('es-PE')
          }
        ],
        tiempoTotal: 0,
        createdAt: new Date().getTime()
      };

      // Agregar a la lista
      setPedidos(prev => [nuevoPedido, ...prev]);

      setLoading(false);
      return nuevoPedido;
    } catch (error) {
      setLoading(false);
      console.error('Error creando pedido:', error);
      throw error;
    }
  };

  /**
   * Actualizar estado de un pedido cuando el backend lo actualiza
   */
  const actualizarEstadoPedido = (pedidoId, pedidoActualizado) => {
    setPedidos(prev =>
      prev.map(pedido => {
        if (pedido.id === pedidoId) {
          const nuevoEstado = mapearEstadoPedido(pedidoActualizado.estado);
          const ahora = new Date().getTime();

          // Solo actualizar si el estado realmente cambió
          if (pedido.estadoBackend === pedidoActualizado.estado) {
            return pedido;
          }

          const pedidoActualizadoLocal = {
            ...pedido,
            estado: nuevoEstado,
            estadoBackend: pedidoActualizado.estado,
            total: pedidoActualizado.monto_total || pedido.total,
            historialEstados: [
              ...pedido.historialEstados,
              {
                estado: nuevoEstado,
                estadoBackend: pedidoActualizado.estado,
                timestamp: ahora,
                fecha: new Date().toLocaleString('es-PE')
              }
            ],
            tiempoTotal: ahora - pedido.createdAt
          };

          // Si el pedido terminó, detener polling
          if (pedidoActualizado.estado === 'entregado' || pedidoActualizado.estado === 'cancelado') {
            detenerPollingPedido(pedidoId);
          }

          return pedidoActualizadoLocal;
        }
        return pedido;
      })
    );
  };

  /**
   * Consultar manualmente un pedido (útil para refrescar)
   */
  const consultarPedido = async (pedidoId) => {
    try {
      const response = await consultarPedidoAPI(pedidoId);
      const pedidoActualizado = response.pedido || response.data?.pedido || response;
      actualizarEstadoPedido(pedidoId, pedidoActualizado);
      return pedidoActualizado;
    } catch (error) {
      console.error('Error consultando pedido:', error);
      throw error;
    }
  };

  /**
   * Formatear tiempo en milisegundos a formato legible
   */
  const formatearTiempo = (milisegundos) => {
    const totalSegundos = Math.floor(milisegundos / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos}s`;
    } else {
      return `${segundos}s`;
    }
  };

  /**
   * Obtener progreso del pedido (0-100%)
   */
  const getProgresoPedido = (estadoBackend) => {
    const estados = ['pendiente', 'preparando', 'listo_despacho', 'recogiendo', 'en_camino', 'entregado'];
    const index = estados.indexOf(estadoBackend);
    if (index === -1) return 0;
    return ((index + 1) / estados.length) * 100;
  };

  /**
   * Refrescar todos los pedidos desde el backend (para botón manual)
   */
  const refrescarPedidos = async () => {
    setLoading(true);
    try {
      // Verificar si hay usuario autenticado
      const user = getUserData();
      if (!user || !user.user_id) {
        setLoading(false);
        return;
      }

      // Consultar todos los pedidos del usuario desde el backend
      const response = await consultarPedidosAPI();
      const pedidosBackend = response.pedidos || response.data?.pedidos || [];
      
      // Mapear pedidos del backend al formato del frontend
      const pedidosMapeados = pedidosBackend.map(pedidoBackend => {
        const pedidoMapeado = mapearPedido(pedidoBackend);
        
        // Buscar si ya existe este pedido en el estado local para preservar información adicional
        const pedidoExistente = pedidos.find(p => p.id === pedidoMapeado.id);
        
        return {
          ...pedidoMapeado,
          items: pedidoBackend.productos?.map(prod => ({
            id: prod.product_id || prod.producto_id,
            nombre: prod.nombre || prod.nombre_producto || 'Producto sin nombre',
            cantidad: prod.quantity || prod.cantidad || 1,
            precio: prod.price || prod.precio || 0,
            imagen: prod.imagen || 'https://via.placeholder.com/64'
          })) || pedidoExistente?.items || [],
          historialEstados: pedidoBackend.historialEstados || pedidoExistente?.historialEstados || [],
          createdAt: pedidoBackend.fecha_inicio ? new Date(pedidoBackend.fecha_inicio).getTime() : (pedidoExistente?.createdAt || Date.now())
        };
      });
      
      setPedidos(pedidosMapeados);
    } catch (error) {
      console.error('Error refrescando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    pedidos,
    loading,
    agregarPedido,
    consultarPedido,
    actualizarEstadoPedido,
    formatearTiempo,
    getProgresoPedido,
    iniciarPollingPedido,
    detenerPollingPedido,
    refrescarPedidos, // Nueva función para refrescar manualmente
    cargarPedidos: cargarPedidosDelBackend // Exponer función para cargar pedidos manualmente
  };

  return (
    <PedidosContext.Provider value={value}>
      {children}
    </PedidosContext.Provider>
  );
};

// Exportar al final
export { usePedidos, PedidosProvider };
