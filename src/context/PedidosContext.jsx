import { createContext, useContext, useState, useEffect } from 'react';

const PedidosContext = createContext();

export const usePedidos = () => {
  const context = useContext(PedidosContext);
  if (!context) {
    throw new Error('usePedidos debe usarse dentro de PedidosProvider');
  }
  return context;
};

export const PedidosProvider = ({ children }) => {
  const [pedidos, setPedidos] = useState([]);

  // Cargar pedidos del localStorage al iniciar
  useEffect(() => {
    const savedPedidos = localStorage.getItem('pardos-pedidos');
    if (savedPedidos) {
      setPedidos(JSON.parse(savedPedidos));
    }
  }, []);

  // Guardar pedidos en localStorage cuando cambien
  useEffect(() => {
    if (pedidos.length > 0) {
      localStorage.setItem('pardos-pedidos', JSON.stringify(pedidos));
    }
  }, [pedidos]);

  // Agregar nuevo pedido
  const agregarPedido = (pedidoData) => {
    const nuevoPedido = {
      id: `PED${Date.now()}`,
      fecha: new Date().toISOString(),
      items: pedidoData.items,
      total: pedidoData.total,
      sede: pedidoData.sede,
      direccion: pedidoData.direccion || '',
      metodoPago: pedidoData.metodoPago || 'Efectivo',
      status: 'Pedido Creado',
      historialEstados: [
        {
          estado: 'Pedido Creado',
          timestamp: new Date().getTime(),
          fecha: new Date().toLocaleString('es-PE')
        }
      ],
      tiempoTotal: 0,
      createdAt: new Date().getTime()
    };

    setPedidos(prev => [nuevoPedido, ...prev]);
    return nuevoPedido;
  };

  // Actualizar estado de pedido (sincronizar con el sistema admin)
  const actualizarEstadoPedido = (pedidoId, nuevoEstado) => {
    setPedidos(prev =>
      prev.map(pedido => {
        if (pedido.id === pedidoId) {
          const ahora = new Date().getTime();
          return {
            ...pedido,
            status: nuevoEstado,
            historialEstados: [
              ...pedido.historialEstados,
              {
                estado: nuevoEstado,
                timestamp: ahora,
                fecha: new Date().toLocaleString('es-PE')
              }
            ],
            tiempoTotal: ahora - pedido.createdAt
          };
        }
        return pedido;
      })
    );
  };

  // Formatear tiempo
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

  const value = {
    pedidos,
    agregarPedido,
    actualizarEstadoPedido,
    formatearTiempo
  };

  return (
    <PedidosContext.Provider value={value}>
      {children}
    </PedidosContext.Provider>
  );
};
