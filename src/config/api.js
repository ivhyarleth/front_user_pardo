/**
 * 🔌 Configuración de API - Sistema de Pedidos Pardo
 * Incluye autenticación JWT y multi-tenant
 */

// IMPORTANTE: Actualizar esta URL con la URL real de API Gateway después del despliegue
// export const BASE_URL = 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev';
export const BASE_URL = 'https://tl5son9q35.execute-api.us-east-1.amazonaws.com/dev'; // URL actual
export const AUTH_BASE_URL = BASE_URL; // Mismo endpoint para auth

// Claves para LocalStorage
const AUTH_TOKEN_KEY = 'pardos-auth-token';
const USER_DATA_KEY = 'pardos-user';
const SEDE_KEY = 'pardos-sede-selected';

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

/**
 * Obtener token de autenticación del localStorage
 */
export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Guardar token de autenticación
 */
export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Eliminar token de autenticación
 */
export function removeAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Obtener datos del usuario autenticado
 */
export function getUserData() {
  const userData = localStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
}

/**
 * Guardar datos del usuario
 */
export function setUserData(user) {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

/**
 * Eliminar datos del usuario
 */
export function removeUserData() {
  localStorage.removeItem(USER_DATA_KEY);
}

/**
 * Verificar si el usuario está autenticado
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Obtener sede seleccionada
 */
export function getSelectedSede() {
  return localStorage.getItem(SEDE_KEY) || 'pardo_miraflores'; // Default Miraflores
}

/**
 * Guardar sede seleccionada
 */
export function setSelectedSede(sede) {
  localStorage.setItem(SEDE_KEY, sede);
}

// ============================================================================
// SEDES (Multi-tenant)
// ============================================================================

/**
 * Lista de sedes disponibles
 */
export const SEDES = [
  {
    id: 'pardo_miraflores',
    nombre: 'Pardos Miraflores',
    direccion: 'Av. Benavides 730, Miraflores'
  },
  {
    id: 'pardo_surco',
    nombre: 'Pardos Surco',
    direccion: 'Av. Primavera 645, Surco'
  }
];

/**
 * Obtener información de una sede
 */
export function getSedeInfo(sedeId) {
  return SEDES.find(s => s.id === sedeId) || SEDES[0];
}

// ============================================================================
// HEADERS Y REQUEST HELPERS
// ============================================================================

/**
 * Obtener headers comunes para las peticiones
 */
export function getHeaders(includeAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
    'x-tenant-id': getSelectedSede()
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

/**
 * Manejar respuestas de la API
 */
async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    // Si es error 401, cerrar sesión
    if (response.status === 401) {
      removeAuthToken();
      removeUserData();
      // Redirigir a login si no estamos ya ahí
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    throw {
      status: response.status,
      message: data.message || 'Error en la petición',
      data
    };
  }
  
  return data;
}

// ============================================================================
// AUTH API
// ============================================================================

/**
 * Login de usuario
 */
export async function loginAPI(email, password) {
  const response = await fetch(`${AUTH_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      frontend_type: 'client'
    })
  });
  
  const data = await handleResponse(response);
  
  // Guardar token y datos de usuario
  if (data.token) {
    setAuthToken(data.token);
    setUserData(data.user);
  }
  
  return data;
}

/**
 * Registro de nuevo usuario
 */
export async function registroAPI(userData) {
  const response = await fetch(`${AUTH_BASE_URL}/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...userData,
      frontend_type: 'client',
      user_type: 'cliente'
    })
  });
  
  const responseData = await handleResponse(response);
  
  // Después del registro exitoso, hacer login automático
  if (responseData.user_id) {
    return await loginAPI(userData.email, userData.password);
  }
  
  return responseData;
}

/**
 * Logout de usuario
 */
export async function logoutAPI() {
  try {
    const token = getAuthToken();
    if (token) {
      await fetch(`${AUTH_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } finally {
    // Siempre limpiar local storage
    removeAuthToken();
    removeUserData();
  }
}

// ============================================================================
// PRODUCTOS API
// ============================================================================

/**
 * Obtener lista de productos de la sede seleccionada
 */
export async function obtenerProductosAPI() {
  const response = await fetch(`${BASE_URL}/producto/obtener`, {
    method: 'GET',
    headers: getHeaders(false) // Endpoint público
  });
  
  return await handleResponse(response);
}

/**
 * Obtener todos los productos (maneja paginación)
 */
export async function obtenerTodosLosProductosAPI() {
  const data = await obtenerProductosAPI();
  return data.productos || [];
}

/**
 * Obtener un producto por ID
 */
export async function obtenerProductoAPI(productoId) {
  const response = await fetch(`${BASE_URL}/producto/${productoId}`, {
    method: 'GET',
    headers: getHeaders(false) // Endpoint público
  });
  
  return await handleResponse(response);
}

// ============================================================================
// PEDIDOS API
// ============================================================================

/**
 * Crear un nuevo pedido
 * Requiere autenticación
 */
export async function crearPedidoAPI(pedidoData) {
  if (!isAuthenticated()) {
    throw new Error('Debe iniciar sesión para crear un pedido');
  }
  
  const user = getUserData();
  
  // Preparar datos del pedido
  const body = {
    usuario_id: user.user_id,
    productos: pedidoData.productos.map((p) => ({
      producto_id: p.producto_id || p.id,
      cantidad: p.cantidad || p.quantity || 1,
    })),
    direccion_entrega: pedidoData.direccion_entrega,
    telefono: pedidoData.telefono,
    medio_pago: pedidoData.medio_pago || 'efectivo',
    notas: pedidoData.notas || '',
  };
  
  const response = await fetch(`${BASE_URL}/pedido/crear`, {
    method: 'POST',
    headers: getHeaders(true), // Incluir autenticación
    body: JSON.stringify(body)
  });
  
  return await handleResponse(response);
}

/**
 * Consultar pedidos del usuario autenticado
 * Requiere autenticación
 */
export async function consultarPedidosAPI(params = {}) {
  if (!isAuthenticated()) {
    throw new Error('Debe iniciar sesión para consultar pedidos');
  }
  
  // El backend obtiene el user_id del JWT automáticamente
  // Solo pasamos parámetros adicionales si los hay
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams 
    ? `${BASE_URL}/pedido/consultar?${queryParams}`
    : `${BASE_URL}/pedido/consultar`;
  
  const headers = getHeaders(true); // Incluir autenticación (JWT con user_id)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: headers
  });
  
  return await handleResponse(response);
}

/**
 * Obtener un pedido específico por ID
 */
export async function consultarPedidoAPI(pedidoId) {
  if (!isAuthenticated()) {
    throw new Error('Debe iniciar sesión para ver el pedido');
  }
  
  const response = await fetch(`${BASE_URL}/pedido/consultar?pedido_id=${pedidoId}`, {
    method: 'GET',
    headers: getHeaders(true) // Incluir autenticación
  });
  
  return await handleResponse(response);
}

/**
 * Confirmar recepción del pedido (cliente)
 * Requiere autenticación
 */
export async function confirmarRecepcionAPI(pedidoId, tenantId) {
  if (!isAuthenticated()) {
    throw new Error('Debe iniciar sesión para confirmar recepción');
  }
  
  const response = await fetch(`${BASE_URL}/pedido/confirmar-recepcion`, {
    method: 'POST',
    headers: getHeaders(true, tenantId), // Incluir autenticación y tenant_id
    body: JSON.stringify({
      pedido_id: pedidoId,
      tenant_id: tenantId,
    })
  });
  
  return await handleResponse(response);
}

// ============================================================================
// POLLING DE PEDIDOS
// ============================================================================

export class PedidoPoller {
  constructor(pedidoId, onUpdate) {
    this.pedidoId = pedidoId;
    this.onUpdate = onUpdate;
    this.interval = null;
    this.estadoAnterior = null;
  }

  iniciar() {
    this.consultar();
    this.interval = setInterval(() => this.consultar(), 3000);
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

      if (pedido.estado !== this.estadoAnterior) {
        this.estadoAnterior = pedido.estado;
        this.onUpdate(pedido);

        if (pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
          this.detener();
        }
      }
    } catch (error) {
      console.error('Error en polling:', error);
    }
  }
}

// ============================================================================
// MAPEO DE ESTADOS Y PRODUCTOS
// ============================================================================

export const mapearEstadoPedido = (estadoBackend) => {
  const mapeo = {
    pendiente: 'Pedido Creado',
    preparando: 'Pedido Pendiente',
    listo_despacho: 'Pedido Preparado',
    despachando: 'Pedido Preparado',
    recogiendo: 'Pedido Preparado',
    en_camino: 'Pedido Enviado',
    entregado: 'Pedido Recibido',
    cancelado: 'Pedido Cancelado',
  };

  return mapeo[estadoBackend] || 'Pedido Creado';
};

export const mapearProducto = (productoBackend) => {
  return {
    id: productoBackend.producto_id,
    nombre: productoBackend.nombre_producto || productoBackend.nombre_plato,
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

export const mapearPedido = (pedidoBackend) => {
  return {
    id: pedidoBackend.pedido_id,
    fecha: pedidoBackend.fecha_inicio || pedidoBackend.fecha_creacion,
    estado: mapearEstadoPedido(pedidoBackend.estado),
    estadoBackend: pedidoBackend.estado,
    total: pedidoBackend.precio_total || 0,
    direccion: pedidoBackend.direccion_entrega || '',
    telefono: pedidoBackend.telefono || '',
    medioPago: pedidoBackend.medio_pago || 'efectivo',
    notas: pedidoBackend.notas || '',
    productos: pedidoBackend.productos || [],
    usuarioId: pedidoBackend.user_id,
    tenantId: pedidoBackend.tenant_id,
    executionArn: pedidoBackend.execution_arn,
  };
};

// ============================================================================
// HELPERS
// ============================================================================

export const esUUIDValido = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const generarUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  // Auth
  loginAPI,
  registroAPI,
  logoutAPI,
  isAuthenticated,
  getAuthToken,
  getUserData,
  
  // Productos
  obtenerProductosAPI,
  obtenerTodosLosProductosAPI,
  obtenerProductoAPI,
  
  // Pedidos
  crearPedidoAPI,
  consultarPedidosAPI,
  consultarPedidoAPI,
  
  // Polling
  PedidoPoller,
  
  // Sedes
  getSelectedSede,
  setSelectedSede,
  SEDES,
  getSedeInfo,
  
  // Mapeo
  mapearEstadoPedido,
  mapearProducto,
  mapearPedido,
  
  // Helpers
  esUUIDValido,
  generarUUID,
  getHeaders,
  
  // Config
  BASE_URL
};
