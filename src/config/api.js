// 🔌 Configuración de API - Sistema de Pedidos Pardo
// ============================================

// Configuración Base
export const API_CONFIG = {
  BASE_URL: 'https://tl5son9q35.execute-api.us-east-1.amazonaws.com/dev',
  TENANT_ID: 'pardo',
  POLLING_INTERVAL: 3000, // 3 segundos para actualizar estado de pedidos
};

// Headers requeridos para todas las peticiones
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-tenant-id': API_CONFIG.TENANT_ID,
});

// Función para limpiar objetos (eliminar undefined, null, '')
const limpiarObjeto = (obj) => {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ''
    )
  );
};

// Función genérica para hacer peticiones
const request = async (endpoint, method = 'GET', body = null) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: getHeaders(),
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(limpiarObjeto(body));
  }

  try {
    const response = await fetch(url, options);

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      // puede que no haya cuerpo JSON
      data = null;
    }

    if (!response.ok) {
      const msg =
        (data && (data.message || data.error || data.errorMessage)) ||
        `Error ${response.status}: ${response.statusText}`;
      throw new Error(msg);
    }

    // si no hay data, devolvemos objeto vacío para evitar undefined
    return data ?? {};
  } catch (error) {
    console.error(`Error en ${method} ${endpoint}:`, error);
    throw error;
  }
};

// ============================================
// 📦 PRODUCTOS
// ============================================

/**
 * Obtener lista de productos con paginación y filtros
 * @param {Object} filtros - { limit, cursor, tipo_producto, sort_by, sort_order }
 * @returns {Promise<Object>} { productos: [...], metadata?: {...} }
 */
export const obtenerProductosAPI = async (filtros = {}) => {
  const params = new URLSearchParams(
    limpiarObjeto({
      tenant_id: API_CONFIG.TENANT_ID,
      limit: filtros.limit || 100, // Obtener todos por defecto
      tipo_producto: filtros.tipo_producto,
      sort_by: filtros.sort_by,
      sort_order: filtros.sort_order,
      cursor: filtros.cursor,
    })
  );

  return request(`/producto/obtener?${params.toString()}`);
};

/**
 * Obtener todos los productos (maneja paginación automáticamente)
 * Funciona aunque la API NO devuelva metadata (caso actual).
 * @param {Object} filtros - { tipo_producto, sort_by, sort_order }
 * @returns {Promise<Array>} Array de productos
 */
export const obtenerTodosLosProductosAPI = async (filtros = {}) => {
  let todosLosProductos = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const data = await obtenerProductosAPI({
      ...filtros,
      cursor,
      limit: 100,
    });

    if (!data) break;

    const productos = Array.isArray(data.productos) ? data.productos : [];
    todosLosProductos = [...todosLosProductos, ...productos];

    // Si no hay metadata, asumimos que no hay más páginas
    if (!data.metadata) {
      hasMore = false;
    } else {
      hasMore = !!data.metadata.has_more;
      cursor = data.metadata.next_cursor;
    }
  }

  return todosLosProductos;
};

/**
 * Obtener un producto por ID
 * @param {string} productoId - UUID del producto
 * @returns {Promise<Object>} Datos del producto
 */
export const obtenerProductoAPI = async (productoId) => {
  return request(`/producto/${productoId}?tenant_id=${API_CONFIG.TENANT_ID}`);
};

// ============================================
// 🛒 PEDIDOS
// ============================================

/**
 * Crear un nuevo pedido
 * @param {Object} pedidoData - Datos del pedido
 * @returns {Promise<Object>} Pedido creado
 */
export const crearPedidoAPI = async (pedidoData) => {
  // Validar que todos los campos requeridos estén presentes
  if (!pedidoData.usuario_id) {
    throw new Error('usuario_id es requerido');
  }
  if (!pedidoData.productos || pedidoData.productos.length === 0) {
    throw new Error('productos es requerido y debe tener al menos un item');
  }
  if (!pedidoData.direccion_entrega) {
    throw new Error('direccion_entrega es requerida');
  }
  if (!pedidoData.telefono) {
    throw new Error('telefono es requerido');
  }

  const body = {
    tenant_id: API_CONFIG.TENANT_ID,
    usuario_id: pedidoData.usuario_id,
    productos: pedidoData.productos.map((p) => ({
      producto_id: p.producto_id || p.id, // Soportar ambos formatos
      cantidad: p.cantidad || p.quantity,
    })),
    direccion_entrega: pedidoData.direccion_entrega,
    telefono: pedidoData.telefono,
    medio_pago: pedidoData.medio_pago || 'efectivo',
    notas: pedidoData.notas || '',
  };

  return request('/pedido/crear', 'POST', body);
};

/**
 * Consultar estado de un pedido
 * @param {string} pedidoId - UUID del pedido
 * @returns {Promise<Object>} Estado del pedido
 */
export const consultarPedidoAPI = async (pedidoId) => {
  return request(
    `/pedido/consultar?pedido_id=${pedidoId}&tenant_id=${API_CONFIG.TENANT_ID}`
  );
};

/**
 * Actualizar pedido (rara vez necesario)
 * @param {string} pedidoId - UUID del pedido
 * @param {Object} datosActualizar - Datos a actualizar
 * @returns {Promise<Object>} Pedido actualizado
 */
export const actualizarPedidoAPI = async (pedidoId, datosActualizar) => {
  return request(`/pedido/${pedidoId}`, 'PUT', {
    tenant_id: API_CONFIG.TENANT_ID,
    ...datosActualizar,
  });
};

// ============================================
// 🔄 POLLING DE PEDIDOS
// ============================================

/**
 * Clase para hacer polling del estado de un pedido
 */
export class PedidoPoller {
  constructor(pedidoId, onUpdate) {
    this.pedidoId = pedidoId;
    this.onUpdate = onUpdate;
    this.interval = null;
    this.estadoAnterior = null;
  }

  iniciar() {
    this.consultar(); // Consultar inmediatamente
    this.interval = setInterval(
      () => this.consultar(),
      API_CONFIG.POLLING_INTERVAL
    );
  }

  detener() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async consultar() {
    try {
      const data = await consultarPedidoAPI(this.pedidoId);
      const pedido = data.pedido || data;

      // Solo actualizar si el estado cambió
      if (pedido.estado !== this.estadoAnterior) {
        this.estadoAnterior = pedido.estado;
        this.onUpdate(pedido);

        // Detener si el pedido terminó
        if (pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
          this.detener();
        }
      }
    } catch (error) {
      console.error('Error en polling:', error);
    }
  }
}

// ============================================
// 📊 INVENTARIO
// ============================================

/**
 * Consultar inventario de productos
 * @param {Array<string>} productosIds - Array de UUIDs de productos
 * @returns {Promise<Object>} Inventario de productos
 */
export const consultarInventarioAPI = async (productosIds) => {
  return request('/inventario/consultar', 'POST', {
    tenant_id: API_CONFIG.TENANT_ID,
    productos_ids: productosIds,
  });
};

/**
 * Ajustar inventario manualmente (solo admin)
 * @param {string} productoId - UUID del producto
 * @param {number} cantidad - Cantidad a ajustar (positivo = agregar, negativo = quitar)
 * @param {string} motivo - Motivo del ajuste
 * @returns {Promise<Object>} Inventario actualizado
 */
export const ajustarInventarioAPI = async (
  productoId,
  cantidad,
  motivo = 'ajuste_manual'
) => {
  return request('/inventario/ajustar', 'POST', {
    tenant_id: API_CONFIG.TENANT_ID,
    producto_id: productoId,
    cantidad,
    motivo,
  });
};

// ============================================
// 👨‍🍳 WORKFLOW STEP FUNCTIONS (Solo para admin)
// ============================================

/**
 * Chef confirma que terminó de preparar
 * @param {string} pedidoId - UUID del pedido
 * @param {string} chefId - ID del chef
 * @param {boolean} aprobado - Si el pedido fue aprobado o rechazado
 * @returns {Promise<Object>} Resultado
 */
export const confirmarChefAPI = async (
  pedidoId,
  chefId,
  aprobado = true
) => {
  return request('/chef/confirma', 'POST', {
    tenant_id: API_CONFIG.TENANT_ID,
    pedido_id: pedidoId,
    chef_id: chefId,
    aprobado,
  });
};

/**
 * Despachador confirma que despachó el pedido
 * @param {string} pedidoId - UUID del pedido
 * @returns {Promise<Object>} Resultado
 */
export const confirmarDespachadoAPI = async (pedidoId) => {
  return request('/despachado/confirma', 'POST', {
    tenant_id: API_CONFIG.TENANT_ID,
    pedido_id: pedidoId,
  });
};

/**
 * Motorizado confirma que recogió el pedido
 * @param {string} pedidoId - UUID del pedido
 * @param {string} motorizadoId - ID del motorizado
 * @returns {Promise<Object>} Resultado
 */
export const confirmarMotorizadoAPI = async (pedidoId, motorizadoId) => {
  return request('/motorizado/confirma', 'POST', {
    tenant_id: API_CONFIG.TENANT_ID,
    pedido_id: pedidoId,
    motorizado_id: motorizadoId,
  });
};

// ============================================
// 🗺️ MAPEO DE ESTADOS DEL BACKEND A FRONTEND
// ============================================

/**
 * Mapea los estados del backend a los estados del frontend
 * Backend: pendiente, preparando, listo_despacho, recogiendo, en_camino, entregado, cancelado
 * Frontend: Pedido Creado, Pedido Pendiente, Pedido Preparado, Pedido Enviado, Pedido Recibido
 */
export const mapearEstadoPedido = (estadoBackend) => {
  const mapeo = {
    pendiente: 'Pedido Creado',
    preparando: 'Pedido Pendiente',
    listo_despacho: 'Pedido Preparado',
    recogiendo: 'Pedido Preparado', // Aún en local
    en_camino: 'Pedido Enviado',
    entregado: 'Pedido Recibido',
    cancelado: 'Pedido Cancelado',
  };

  return mapeo[estadoBackend] || 'Pedido Creado';
};

/**
 * Mapea producto del backend al formato del frontend
 */
export const mapearProducto = (productoBackend) => {
  return {
    id: productoBackend.producto_id,
    nombre: productoBackend.nombre_producto,
    tipo: productoBackend.tipo_producto,
    precio: productoBackend.precio_producto,
    descripcion: productoBackend.descripcion_producto || '',
    imagen: productoBackend.image_url || 'https://via.placeholder.com/300',
    activo: productoBackend.is_active !== false,
    currency: productoBackend.currency || 'PEN',
    sku: productoBackend.sku || '',
    fechaCreacion: productoBackend.fecha_creacion,
    fechaActualizacion: productoBackend.fecha_actualizacion,
  };
};

/**
 * Mapea pedido del backend al formato del frontend
 */
export const mapearPedido = (pedidoBackend) => {
  return {
    id: pedidoBackend.pedido_id,
    fecha: pedidoBackend.fecha_pedido || pedidoBackend.fecha_creacion,
    estado: mapearEstadoPedido(pedidoBackend.estado),
    estadoBackend: pedidoBackend.estado, // Guardar el estado original
    total: pedidoBackend.monto_total || 0,
    direccion: pedidoBackend.direccion_entrega || '',
    telefono: pedidoBackend.telefono || '',
    medioPago: pedidoBackend.medio_pago || 'efectivo',
    notas: pedidoBackend.notas || '',
    productos: pedidoBackend.productos || [],
    usuarioId: pedidoBackend.usuario_id,
    tenantId: pedidoBackend.tenant_id,
    executionArn: pedidoBackend.execution_arn, // Para tracking de Step Functions
  };
};

// ============================================
// 🔍 HELPERS
// ============================================

/**
 * Valida que un string sea un UUID válido
 */
export const esUUIDValido = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Genera un UUID v4 simple (para usuario temporal)
 */
export const generarUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default {
  // Productos
  obtenerProductosAPI,
  obtenerTodosLosProductosAPI,
  obtenerProductoAPI,

  // Pedidos
  crearPedidoAPI,
  consultarPedidoAPI,
  actualizarPedidoAPI,

  // Polling
  PedidoPoller,

  // Inventario
  consultarInventarioAPI,
  ajustarInventarioAPI,

  // Workflow (Admin)
  confirmarChefAPI,
  confirmarDespachadoAPI,
  confirmarMotorizadoAPI,

  // Mapeo
  mapearEstadoPedido,
  mapearProducto,
  mapearPedido,

  // Helpers
  esUUIDValido,
  generarUUID,

  // Config
  API_CONFIG,
};
