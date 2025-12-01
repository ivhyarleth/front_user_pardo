import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePedidos } from '../context/PedidosContext';
import { confirmarRecepcionAPI, getSelectedSede } from '../config/api';
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Calendar,
  Phone,
  Store,
  ChevronLeft,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { formatSedeName } from '../lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';

const OrdenDetalle = () => {
  const { pedidoId } = useParams();
  const navigate = useNavigate();
  const { pedidos, consultarPedido, iniciarPollingPedido, detenerPollingPedido } = usePedidos();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Función para actualizar manualmente
  const handleActualizarEstado = async () => {
    setActualizando(true);
    try {
      await consultarPedido(pedidoId);
      const pedidoActualizado = pedidos.find((p) => p.id === pedidoId);
      if (pedidoActualizado) {
        setPedido(pedidoActualizado);
      }
    } catch (error) {
      console.error('Error actualizando pedido:', error);
    } finally {
      setActualizando(false);
    }
  };

  // Función para confirmar recepción del pedido
  const handleConfirmarRecepcion = async () => {
    if (!pedido) return;

    setConfirmando(true);
    try {
      const tenantId = pedido.tenantId || getSelectedSede();
      const resultado = await confirmarRecepcionAPI(pedidoId, tenantId);
      
      if (resultado && resultado.pedido) {
        // Actualizar el pedido localmente
        setPedido({
          ...pedido,
          estadoBackend: 'entregado',
          estado: 'entregado',
        });
        setShowConfirmDialog(false);
        setShowSuccessDialog(true);
        
        // Actualizar en el contexto
        await consultarPedido(pedidoId);
      }
    } catch (error) {
      console.error('Error confirmando recepción:', error);
      alert('Error al confirmar recepción. Por favor, intenta nuevamente.');
    } finally {
      setConfirmando(false);
    }
  };

  useEffect(() => {
    const cargarPedido = async () => {
      setLoading(true);
      // Buscar en pedidos existentes
      const pedidoExistente = pedidos.find((p) => p.id === pedidoId);
      
      if (pedidoExistente) {
        setPedido(pedidoExistente);
        setLoading(false);
      } else {
        // Intentar consultar desde el backend UNA SOLA VEZ
        try {
          console.log('🔍 Consultando pedido desde backend:', pedidoId);
          await consultarPedido(pedidoId);
          const pedidoActualizado = pedidos.find((p) => p.id === pedidoId);
          if (pedidoActualizado) {
            setPedido(pedidoActualizado);
          }
        } catch (error) {
          console.error('❌ Error cargando pedido:', error);
        }
        setLoading(false);
      }
    };

    // Solo cargar una vez al montar el componente
    if (pedidoId) {
      cargarPedido();
    }

    // Cleanup: detener polling al desmontar
    return () => {
      console.log('🛑 Componente desmontado, deteniendo polling si existe');
      detenerPollingPedido(pedidoId);
    };
  }, [pedidoId]); // Solo depende de pedidoId

  // Actualizar pedido cuando cambie en el contexto
  useEffect(() => {
    const pedidoActualizado = pedidos.find((p) => p.id === pedidoId);
    if (pedidoActualizado) {
      setPedido(pedidoActualizado);
    }
  }, [pedidos, pedidoId]);

  const getStatusInfo = (estadoBackend) => {
    const statusMap = {
      pendiente: {
        label: 'Pedido Creado',
        icon: Clock,
        color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        step: 1,
      },
      preparando: {
        label: 'En Preparación',
        icon: Package,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        step: 2,
      },
      listo_despacho: {
        label: 'Listo para Despacho',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-300',
        step: 3,
      },
      despachando: {
        label: 'Despachando',
        icon: Package,
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        step: 4,
      },
      recogiendo: {
        label: 'En Recogida',
        icon: Truck,
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        step: 4,
      },
      en_camino: {
        label: 'En Camino',
        icon: Truck,
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        step: 5,
      },
      entregado: {
        label: 'Entregado',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-300',
        step: 6,
      },
    };
    return statusMap[estadoBackend] || statusMap.pendiente;
  };

  const steps = [
    { id: 1, name: 'Pedido Creado', icon: Clock },
    { id: 2, name: 'En Preparación', icon: Package },
    { id: 3, name: 'Listo', icon: CheckCircle },
    { id: 4, name: 'Despachando', icon: Package },
    { id: 5, name: 'En Camino', icon: Truck },
    { id: 6, name: 'Entregado', icon: CheckCircle },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-pardos-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pardos-rust mx-auto mb-4"></div>
          <p className="font-spartan font-bold text-xl text-pardos-dark">
            Cargando pedido...
          </p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-pardos-cream flex items-center justify-center p-4">
        <div className="text-center bg-white p-12 rounded-2xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="font-spartan font-bold text-2xl text-pardos-dark mb-4">
            Pedido no encontrado
          </h2>
          <p className="text-gray-600 font-lato mb-6">
            No pudimos encontrar el pedido que buscas
          </p>
          <Button onClick={() => navigate('/mis-pedidos')}>
            Ver Mis Pedidos
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(pedido.estadoBackend || 'pendiente');
  const StatusIcon = statusInfo.icon;
  const currentStep = statusInfo.step;

  return (
    <div className="min-h-screen bg-pardos-cream py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/mis-pedidos')}
              className="flex items-center gap-2 text-pardos-rust hover:text-pardos-brown font-spartan font-bold transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Volver a Mis Pedidos
            </button>
            
            <Button
              onClick={handleActualizarEstado}
              disabled={actualizando}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${actualizando ? 'animate-spin' : ''}`} />
              {actualizando ? 'Actualizando...' : 'Actualizar Estado'}
            </Button>
          </div>
          
          <h1 className="font-spartan font-black text-4xl md:text-5xl text-pardos-dark">
            Seguimiento de Pedido
          </h1>
          <p className="text-gray-600 font-lato mt-2">
            Pedido #{pedido.id.slice(0, 8)}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Estado y Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estado Actual */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div
                  className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 font-spartan font-bold text-lg ${statusInfo.color}`}
                >
                  <StatusIcon className="w-6 h-6" />
                  <span>{statusInfo.label}</span>
                </div>
                <span className="text-4xl font-spartan font-black text-pardos-rust">
                  S/ {(pedido.total || 0).toFixed(2)}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="relative">
                <div className="flex justify-between">
                  {steps.map((step, index) => {
                    const isCompleted = step.id < currentStep;
                    const isCurrent = step.id === currentStep;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.id} className="flex-1 relative">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                              isCompleted || isCurrent
                                ? 'bg-pardos-rust text-white scale-110'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            <StepIcon className="w-6 h-6" />
                          </div>
                          <p
                            className={`text-xs font-spartan font-bold text-center ${
                              isCompleted || isCurrent
                                ? 'text-pardos-dark'
                                : 'text-gray-400'
                            }`}
                          >
                            {step.name}
                          </p>
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className={`absolute top-6 left-1/2 w-full h-1 transition-all ${
                              step.id < currentStep
                                ? 'bg-pardos-rust'
                                : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="font-spartan font-bold text-2xl text-pardos-dark mb-6">
                Productos
              </h3>
              <div className="space-y-4">
                {pedido.items?.map((item, index) => {
                  const cantidad = item.cantidad || item.quantity || 1;
                  const precioUnitario = Number(item.precio || 0);

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-pardos-cream rounded-lg"
                    >
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80';
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
                        <p className="font-spartan font-bold text-xl text-pardos-rust">
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
            </div>
          </div>

          {/* Información de Entrega */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h3 className="font-spartan font-bold text-xl text-pardos-dark mb-6">
                Detalles de Entrega
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Store className="w-5 h-5 text-pardos-rust mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 font-lato">Sede</p>
                    <p className="font-spartan font-bold text-pardos-dark">
                      {formatSedeName(pedido.tenantId)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-pardos-rust mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 font-lato">Dirección</p>
                    <p className="font-lato text-pardos-dark">
                      {pedido.direccion || 'No especificada'}
                    </p>
                  </div>
                </div>

                {pedido.telefono && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-pardos-rust mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 font-lato">Teléfono</p>
                      <p className="font-lato text-pardos-dark">
                        {pedido.telefono}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-pardos-rust mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 font-lato">
                      Fecha de pedido
                    </p>
                    <p className="font-lato text-pardos-dark">
                      {new Date(pedido.fecha).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón para confirmar recepción si el pedido está en estados que permiten confirmación */}
              {(pedido.estadoBackend === 'despachado' || 
                pedido.estadoBackend === 'recogiendo' || 
                pedido.estadoBackend === 'en_camino') && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 font-lato font-bold mb-1">
                      📦 Tu pedido está en camino
                    </p>
                    <p className="text-xs text-blue-600 font-lato">
                      Cuando recibas tu pedido, confirma la recepción haciendo clic en el botón de abajo
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Confirmar Recepción del Pedido
                  </Button>
                </div>
              )}

              {/* Si ya está entregado, mostrar mensaje */}
              {pedido.estadoBackend === 'entregado' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-spartan font-bold text-green-800">
                      Pedido Entregado
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Gracias por tu compra
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => navigate('/menu')}
                  variant="outline"
                  className="w-full"
                >
                  Hacer Nuevo Pedido
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              ¿Confirmar Recepción?
            </DialogTitle>
            <DialogDescription className="text-center">
              ¿Has recibido tu pedido correctamente?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Al confirmar, el pedido será marcado como entregado y finalizará el seguimiento.
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={confirmando}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarRecepcion}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={confirmando}
              >
                {confirmando ? 'Confirmando...' : 'Sí, Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de éxito */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
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
              setShowSuccessDialog(false);
              navigate('/menu');
            }}
            className="w-full"
            size="lg"
          >
            Hacer Nuevo Pedido
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdenDetalle;

