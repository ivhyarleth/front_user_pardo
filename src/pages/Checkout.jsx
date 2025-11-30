import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { usePedidos } from '../context/PedidosContext';
import { getSelectedSede, getSedeInfo } from '../config/api';
import { formatSedeName } from '../lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { CheckCircle2, Loader2, MapPin, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { agregarPedido, loading } = usePedidos();
  const navigate = useNavigate();
  
  const [sede, setSede] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({
    ciudad: '',
    distrito: '',
    numero: '',
    calle: '',
    telefono: '',
    referencia: '',
  });
  const [procesando, setProcesando] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pedidoCreado, setPedidoCreado] = useState(null);

  // Leer sede seleccionada
  useEffect(() => {
    const sedeId = getSelectedSede();
    if (sedeId) {
      setSede(sedeId);
    }
  }, []);

  const handleInputChange = (e) => {
    setDeliveryInfo({
      ...deliveryInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleConfirmarCompra = async () => {
    // Validar sede
    if (!sede) {
      setErrorMessage('Por favor selecciona una sede desde la pantalla principal.');
      setShowErrorModal(true);
      return;
    }

    // Validar campos obligatorios
    if (!deliveryInfo.ciudad || !deliveryInfo.distrito || !deliveryInfo.calle || !deliveryInfo.telefono) {
      setErrorMessage('Por favor completa todos los campos obligatorios marcados con (*)');
      setShowErrorModal(true);
      return;
    }

    // Validar teléfono (9 dígitos)
    if (deliveryInfo.telefono.length !== 9 || !/^\d+$/.test(deliveryInfo.telefono)) {
      setErrorMessage('Por favor ingresa un número de teléfono válido de 9 dígitos');
      setShowErrorModal(true);
      return;
    }

    setProcesando(true);

    try {
      // Crear dirección completa
      const direccionCompleta = `${deliveryInfo.calle} ${deliveryInfo.numero || 'S/N'}, ${deliveryInfo.distrito}, ${deliveryInfo.ciudad}${
        deliveryInfo.referencia ? ` - Ref: ${deliveryInfo.referencia}` : ''
      }`;

      // Preparar datos del pedido
      const pedidoData = {
        items: cart,
        total: getCartTotal(),
        sede: sede,
        direccion: direccionCompleta,
        telefono: deliveryInfo.telefono,
        metodoPago: 'efectivo',
        notas: deliveryInfo.referencia || '',
      };

      // Crear pedido
      const nuevoPedido = await agregarPedido(pedidoData);

      // Guardar pedido y mostrar modal de éxito
      if (nuevoPedido && nuevoPedido.id) {
        setPedidoCreado(nuevoPedido);
        setShowSuccessModal(true);
        
        // Limpiar carrito después de mostrar el modal
        setTimeout(() => {
          clearCart();
        }, 100);
      } else {
        throw new Error('No se recibió información del pedido creado');
      }

    } catch (error) {
      console.error('Error al crear pedido:', error);
      setErrorMessage(
        error.message || 'Ocurrió un error al procesar tu pedido. Por favor, intenta nuevamente.'
      );
      setShowErrorModal(true);
    } finally {
      setProcesando(false);
    }
  };

  const handleVolver = () => {
    navigate('/menu');
  };

  // Solo mostrar "carrito vacío" si NO hay un pedido recién creado
  if (cart.length === 0 && !pedidoCreado) {
    return (
      <div className="min-h-screen bg-pardos-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="info">
            <AlertDescription className="flex flex-col items-center py-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-spartan font-bold text-pardos-dark mb-2">
                Tu carrito está vacío
              </h2>
              <p className="text-center text-gray-600 mb-6">
                Agrega productos desde nuestro menú para continuar
              </p>
              <Button onClick={() => navigate('/menu')} size="lg">
                Ver Menú
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-pardos-cream py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center space-x-2 text-base md:text-lg font-lato">
            <button
              onClick={handleVolver}
              className="text-pardos-rust hover:text-pardos-brown font-semibold transition-colors"
            >
              ← Volver
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-pardos-dark font-bold">Mi Orden</span>
            <span className="text-gray-400">/</span>
            <span className="text-pardos-rust font-bold">CHECKOUT</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Dirección de Entrega */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="font-spartan font-bold text-4xl text-pardos-dark mb-6">
                  DIRECCIÓN DE ENTREGA
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="ciudad"
                    value={deliveryInfo.ciudad}
                    onChange={handleInputChange}
                    placeholder="Ciudad *"
                    className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust transition-all"
                    required
                  />
                  <input
                    type="text"
                    name="distrito"
                    value={deliveryInfo.distrito}
                    onChange={handleInputChange}
                    placeholder="Distrito *"
                    className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust transition-all"
                    required
                  />
                  <input
                    type="text"
                    name="calle"
                    value={deliveryInfo.calle}
                    onChange={handleInputChange}
                    placeholder="Calle/Avenida *"
                    className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust transition-all"
                    required
                  />

                  <input
                    type="text"
                    name="numero"
                    value={deliveryInfo.numero}
                    onChange={handleInputChange}
                    placeholder="Número (opcional)"
                    className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust transition-all"
                  />

                  <input
                    type="tel"
                    name="telefono"
                    value={deliveryInfo.telefono}
                    onChange={handleInputChange}
                    placeholder="Teléfono (9 dígitos) *"
                    maxLength="9"
                    className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust md:col-span-2 transition-all"
                    required
                  />
                  <input
                    type="text"
                    name="referencia"
                    value={deliveryInfo.referencia}
                    onChange={handleInputChange}
                    placeholder="Referencia (opcional)"
                    className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust md:col-span-2 transition-all"
                  />
                </div>

                <p className="text-sm text-gray-500 mt-4 font-lato">
                  * Campos obligatorios
                </p>
              </div>
            </div>

            {/* Resumen de pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-24">
                <h2 className="font-spartan font-bold text-4xl text-pardos-dark mb-3">
                  RESUMEN DE PEDIDO
                </h2>

                {/* Mostrar sede seleccionada */}
                {sede && (
                  <div className="mb-4 p-3 bg-pardos-cream rounded-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-pardos-rust" />
                    <div>
                      <p className="text-xs font-lato text-gray-600">Sede:</p>
                      <p className="font-spartan font-bold text-pardos-rust">
                        {formatSedeName(sede)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start space-x-3 pb-4 border-b border-gray-100"
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
                        <h3 className="font-spartan font-bold text-base text-pardos-dark line-clamp-2">
                          {item.nombre}
                        </h3>
                        <p className="text-sm font-lato text-gray-600 mt-1">
                          Cantidad: x{item.cantidad}
                        </p>
                        <p className="text-pardos-rust font-bold mt-1 text-lg">
                          S/ {(item.precio * item.cantidad).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between font-lato text-gray-600 text-lg">
                    <span>Subtotal:</span>
                    <span className="font-bold">
                      S/ {getCartTotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-spartan font-bold text-xl text-pardos-dark">
                    <span>Total general</span>
                    <span className="text-pardos-rust text-3xl">
                      S/ {getCartTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleConfirmarCompra}
                  disabled={procesando || loading}
                  className="w-full mt-6"
                  size="lg"
                >
                  {procesando || loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Procesando...
                    </span>
                  ) : (
                    `CONFIRMAR COMPRA S/ ${getCartTotal().toFixed(2)}`
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4 font-lato">
                  Al confirmar, aceptas nuestros términos y condiciones
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={(open) => {
        if (!open && pedidoCreado) {
          navigate(`/orden/${pedidoCreado.id}`);
        }
      }}>
        <DialogContent 
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl">
              ¡Pedido Confirmado!
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Tu pedido <span className="font-bold text-pardos-rust">#{pedidoCreado?.id?.slice(0, 8) || 'creado'}</span> ha sido creado exitosamente y está siendo procesado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 my-4">
            <p className="font-lato text-center text-green-800 font-bold">
              🎉 Tu pedido ya está en camino
            </p>
            <p className="text-sm text-green-600 text-center mt-2">
              Haz clic abajo para ver el estado en tiempo real
            </p>
          </div>

          <Button
            onClick={() => {
              if (pedidoCreado && pedidoCreado.id) {
                navigate(`/orden/${pedidoCreado.id}`);
              }
            }}
            className="w-full"
            disabled={!pedidoCreado}
            size="lg"
          >
            Ver Mi Pedido Ahora →
          </Button>
        </DialogContent>
      </Dialog>

      {/* Modal de Error */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <DialogTitle className="text-center">
              Ups, algo salió mal
            </DialogTitle>
            <DialogDescription className="text-center">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          
          <Button
            onClick={() => setShowErrorModal(false)}
            variant="outline"
            className="w-full mt-4"
          >
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Checkout;
