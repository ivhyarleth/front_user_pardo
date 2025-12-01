import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePedidos } from '../context/PedidosContext';
import { confirmarRecepcionAPI, getSelectedSede } from '../config/api';
import {
  RefreshCw,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Store,
  Clock,
  CheckCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Alert, AlertDescription } from '../components/ui/Alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import './MisPedidos.css';

const MisPedidos = () => {
  const { pedidos, refrescarPedidos, loading, consultarPedido } = usePedidos();
  const navigate = useNavigate();
  const [expandedPedidos, setExpandedPedidos] = useState(new Set());
  const [confirmando, setConfirmando] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState({});
  const [showSuccessDialog, setShowSuccessDialog] = useState({});

  const toggleExpanded = (pedidoId) => {
    setExpandedPedidos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pedidoId)) {
        newSet.delete(pedidoId);
      } else {
        newSet.add(pedidoId);
      }
      return newSet;
    });
  };

  // Función para confirmar recepción del pedido
  const handleConfirmarRecepcion = async (pedidoId, tenantId) => {
    setConfirmando(prev => ({ ...prev, [pedidoId]: true }));
    try {
      const resultado = await confirmarRecepcionAPI(pedidoId, tenantId);
      
      if (resultado && resultado.pedido) {
        setShowConfirmDialog(prev => ({ ...prev, [pedidoId]: false }));
        setShowSuccessDialog(prev => ({ ...prev, [pedidoId]: true }));
        
        // Actualizar en el contexto
        await consultarPedido(pedidoId);
        // Refrescar lista de pedidos
        await refrescarPedidos();
      }
    } catch (error) {
      console.error('Error confirmando recepción:', error);
      alert('Error al confirmar recepción. Por favor, intenta nuevamente.');
    } finally {
      setConfirmando(prev => ({ ...prev, [pedidoId]: false }));
    }
  };

  const getStatusInfo = (estadoBackend) => {
    const statusMap = {
      pendiente: {
        label: 'Pedido Creado',
        icon: Clock,
        color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        progressColor: 'bg-cyan-500',
      },
      preparando: {
        label: 'En Preparación',
        icon: Package,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        progressColor: 'bg-yellow-500',
      },
      listo_despacho: {
        label: 'Listo para Despacho',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-300',
        progressColor: 'bg-green-500',
      },
      despachando: {
        label: 'Despachando',
        icon: Package,
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        progressColor: 'bg-orange-500',
      },
      recogiendo: {
        label: 'En Recogida',
        icon: Package,
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        progressColor: 'bg-orange-500',
      },
      en_camino: {
        label: 'En Camino',
        icon: Package,
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        progressColor: 'bg-blue-500',
      },
      entregado: {
        label: 'Entregado',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-300',
        progressColor: 'bg-green-500',
      },
      cancelado: {
        label: 'Cancelado',
        icon: AlertCircle,
        color: 'bg-red-100 text-red-800 border-red-300',
        progressColor: 'bg-red-500',
      },
    };
    return statusMap[estadoBackend] || statusMap.pendiente;
  };

  const getProgressPercentage = (estadoBackend) => {
    const estados = [
      'pendiente',
      'preparando',
      'listo_despacho',
      'despachando',
      'recogiendo',
      'en_camino',
      'entregado',
    ];
    const index = estados.indexOf(estadoBackend);
    if (index === -1) return 0;
    return ((index + 1) / estados.length) * 100;
  };

  const formatFecha = (isoString) => {
    if (!isoString) return '';
    const fecha = new Date(isoString);
    if (isNaN(fecha.getTime())) return '';
    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNombreSede = (tenantId) => {
    const sedeMap = {
      pardo_miraflores: 'Pardos Miraflores',
      pardo_surco: 'Pardos Surco',
    };
    return sedeMap[tenantId] || tenantId;
  };

  if (!pedidos || pedidos.length === 0) {
    return (
      <div className="min-h-screen bg-pardos-cream py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Alert variant="info" className="mb-4">
              <AlertDescription className="flex flex-col items-center py-8">
                <Package className="w-16 h-16 text-blue-500 mb-4" />
                <h3 className="text-xl font-spartan font-bold mb-2">
                  No tienes pedidos aún
                </h3>
                <p className="text-center text-gray-600 mb-4">
                  ¡Realiza tu primer pedido desde nuestra carta!
                </p>
                <Button onClick={() => navigate('/menu')} size="lg">
                  Ver Carta
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pardos-cream py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-spartan font-black text-pardos-dark">
              Mis Pedidos
            </h1>
            <p className="text-gray-600 font-lato mt-1">
              Gestiona y rastrea todos tus pedidos
            </p>
          </div>
          <Button
            onClick={refrescarPedidos}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            {loading ? 'Actualizando...' : 'Actualizar Estado'}
          </Button>
        </div>

        {/* Lista de Pedidos */}
        <div className="grid gap-6">
          {pedidos.map((pedido) => {
            const statusInfo = getStatusInfo(pedido.estadoBackend || 'pendiente');
            const StatusIcon = statusInfo.icon;
            const progreso = getProgressPercentage(
              pedido.estadoBackend || 'pendiente'
            );
            const isExpanded = expandedPedidos.has(pedido.id);

            return (
              <div
                key={pedido.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl"
              >
                {/* Header del Pedido */}
                <div className="bg-gradient-to-r from-pardos-purple to-pardos-rust p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="text-white flex-1">
                      <h3 className="text-xl font-spartan font-bold mb-2">
                        Pedido #{pedido.id.slice(0, 8)}...
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatFecha(pedido.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Store className="w-4 h-4" />
                          <span>{getNombreSede(pedido.tenantId)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="bg-white text-pardos-rust px-4 py-2 rounded-lg font-spartan font-bold text-xl">
                        S/ {(pedido.total || 0).toFixed(2)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white text-pardos-rust border-white hover:bg-pardos-cream"
                        onClick={() => navigate(`/orden/${pedido.id}`)}
                      >
                        Ver Detalle
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Contenido del Pedido */}
                <div className="p-6">
                  {/* Estado Actual */}
                  <div className="mb-4">
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-spartan font-bold ${statusInfo.color}`}
                    >
                      <StatusIcon className="w-5 h-5" />
                      <span>{statusInfo.label}</span>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 font-lato">
                          Progreso del pedido
                        </span>
                        <span className="text-sm font-bold text-pardos-rust">
                          {progreso.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full ${statusInfo.progressColor} transition-all duration-500 ease-out rounded-full`}
                          style={{ width: `${progreso}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Dirección de Entrega */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-pardos-rust mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-spartan font-bold text-sm text-gray-700 mb-1">
                          Dirección de Entrega
                        </p>
                        <p className="text-gray-600 font-lato text-sm">
                          {pedido.direccion || 'No especificada'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Productos - Expandible */}
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => toggleExpanded(pedido.id)}
                      className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <span className="font-spartan font-bold text-pardos-dark flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Productos ({pedido.items?.length || 0})
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-3 animate-fadeIn">
                        {pedido.items?.map((item, index) => {
                          const cantidad = item.cantidad || item.quantity || 1;
                          const precioUnitario = Number(item.precio || 0);

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <img
                                src={item.imagen}
                                alt={item.nombre}
                                className="w-16 h-16 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.src =
                                    'https://via.placeholder.com/64';
                                }}
                              />
                              <div className="flex-1">
                                <p className="font-spartan font-bold text-pardos-dark">
                                  {item.nombre}
                                </p>
                                <p className="text-sm text-gray-600 font-lato">
                                  Cantidad: x{cantidad}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-spartan font-bold text-pardos-rust">
                                  S/ {(precioUnitario * cantidad).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  S/ {precioUnitario.toFixed(2)} c/u
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Botón para confirmar recepción si el pedido está en estados que permiten confirmación */}
                  {(pedido.estadoBackend === 'despachado' || 
                    pedido.estadoBackend === 'recogiendo' || 
                    pedido.estadoBackend === 'en_camino') && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-xs text-blue-800 font-lato font-bold mb-1">
                          📦 Tu pedido está en camino
                        </p>
                        <p className="text-xs text-blue-600 font-lato">
                          Confirma cuando recibas tu pedido
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowConfirmDialog(prev => ({ ...prev, [pedido.id]: true }))}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirmar Recepción
                      </Button>
                    </div>
                  )}

                  {/* Si ya está entregado, mostrar mensaje */}
                  {pedido.estadoBackend === 'entregado' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="font-spartan font-bold text-green-800 text-sm">
                          Pedido Entregado
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Gracias por tu compra
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Historial de Estados - Expandible */}
                  {pedido.historialEstados &&
                    pedido.historialEstados.length > 0 && (
                      <details className="mt-4 border-t border-gray-200 pt-4">
                        <summary className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg font-spartan font-bold text-pardos-dark flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          <span>Ver Historial de Estados</span>
                        </summary>
                        <div className="mt-4 ml-4 border-l-2 border-pardos-rust pl-4 space-y-4">
                          {pedido.historialEstados.map((historial, index) => (
                            <div
                              key={index}
                              className="relative pb-4 animate-fadeIn"
                              style={{
                                animationDelay: `${index * 50}ms`,
                              }}
                            >
                              <div className="absolute -left-[22px] top-0 w-4 h-4 bg-pardos-rust rounded-full border-2 border-white"></div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="font-spartan font-bold text-pardos-dark">
                                  {historial.estado}
                                </p>
                                <p className="text-sm text-gray-600 font-lato mt-1">
                                  {historial.fecha}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dialogs de confirmación para cada pedido */}
        {pedidos.map((pedido) => (
          <div key={pedido.id}>
            {/* Dialog de confirmación */}
            <Dialog 
              open={showConfirmDialog[pedido.id] || false} 
              onOpenChange={(open) => setShowConfirmDialog(prev => ({ ...prev, [pedido.id]: open }))}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center">
                    ¿Confirmar Recepción?
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    ¿Has recibido tu pedido #{pedido.id.slice(0, 8)} correctamente?
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    Al confirmar, el pedido será marcado como entregado y finalizará el seguimiento.
                  </p>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowConfirmDialog(prev => ({ ...prev, [pedido.id]: false }))}
                      variant="outline"
                      className="flex-1"
                      disabled={confirmando[pedido.id]}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleConfirmarRecepcion(pedido.id, pedido.tenantId || getSelectedSede())}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={confirmando[pedido.id]}
                    >
                      {confirmando[pedido.id] ? 'Confirmando...' : 'Sí, Confirmar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Dialog de éxito */}
            <Dialog 
              open={showSuccessDialog[pedido.id] || false} 
              onOpenChange={(open) => setShowSuccessDialog(prev => ({ ...prev, [pedido.id]: open }))}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <DialogTitle className="text-2xl text-center">
                    ¡Pedido Recibido!
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    Tu pedido ha sido confirmado como entregado exitosamente.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 my-4">
                  <p className="font-lato text-center text-green-800 font-bold">
                    🎉 Gracias por tu compra
                  </p>
                  <p className="text-sm text-green-600 text-center mt-2">
                    Esperamos que disfrutes tu pedido
                  </p>
                </div>

                <Button
                  onClick={() => {
                    setShowSuccessDialog(prev => ({ ...prev, [pedido.id]: false }));
                  }}
                  className="w-full"
                  size="lg"
                >
                  Cerrar
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        ))}

        {/* Botón para nuevo pedido */}
        <div className="mt-8 text-center">
          <Button onClick={() => navigate('/menu')} size="lg">
            Realizar Nuevo Pedido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MisPedidos;
