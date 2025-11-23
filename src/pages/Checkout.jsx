import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { usePedidos } from '../context/PedidosContext';

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

  // 🔄 Leer sede seleccionada en el Home
  useEffect(() => {
    const sedeGuardada = localStorage.getItem('sede-seleccionada');
    if (sedeGuardada) {
      setSede(sedeGuardada);
    }
  }, []);

  const handleInputChange = (e) => {
    setDeliveryInfo({
      ...deliveryInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleConfirmarCompra = async () => {
    // ✅ Validar sede
    if (!sede) {
      alert('Por favor selecciona una sede desde la pantalla principal.');
      return;
    }

    // Validar campos obligatorios
    if (!deliveryInfo.ciudad || !deliveryInfo.distrito || !deliveryInfo.calle || !deliveryInfo.telefono) {
      alert('Por favor completa todos los campos obligatorios (*)');
      return;
    }

    // Validar teléfono (9 dígitos)
    if (deliveryInfo.telefono.length !== 9 || !/^\d+$/.test(deliveryInfo.telefono)) {
      alert('Por favor ingresa un teléfono válido de 9 dígitos');
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
        sede: sede,                    // 👈 ahora enviamos la sede correcta
        direccion: direccionCompleta,
        telefono: deliveryInfo.telefono,
        metodoPago: 'efectivo',
        notas: deliveryInfo.referencia || '',
      };

      // Crear pedido en la API / contexto
      const nuevoPedido = await agregarPedido(pedidoData);

      // Limpiar carrito
      clearCart();

      // Mostrar confirmación
      alert(
        `¡Pedido confirmado! 🎉\n\nTu pedido #${nuevoPedido.id.slice(
          0,
          8
        )} está siendo procesado.\n\nPodrás ver su estado en "Mis Pedidos"`
      );

      // Redirigir a Mis Pedidos
      navigate('/mis-pedidos');
    } catch (error) {
      console.error('Error al crear pedido:', error);
      alert(
        `Error al crear el pedido: ${error.message}\n\nPor favor, intenta de nuevo.`
      );
    } finally {
      setProcesando(false);
    }
  };

  const handleVolver = () => {
    navigate('/menu');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-pardos-cream flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-32 h-32 text-pardos-gray mx-auto mb-4"
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
          <h2 className="font-spartan font-bold text-4xl text-pardos-dark mb-4">
            Tu carrito está vacío
          </h2>
          <button
            onClick={() => navigate('/menu')}
            className="bg-pardos-rust hover:bg-pardos-brown text-white px-8 py-3 rounded-full font-spartan font-bold text-lg transition-all"
          >
            Ver menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pardos-cream py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center space-x-2 text-base md:text-lg font-lato">
          <button
            onClick={handleVolver}
            className="text-pardos-rust hover:text-pardos-brown font-semibold"
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
                  className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust"
                  required
                />
                <input
                  type="text"
                  name="distrito"
                  value={deliveryInfo.distrito}
                  onChange={handleInputChange}
                  placeholder="Distrito *"
                  className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust"
                  required
                />
                <input
                  type="text"
                  name="calle"
                  value={deliveryInfo.calle}
                  onChange={handleInputChange}
                  placeholder="Calle/Avenida *"
                  className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust"
                  required
                />

                <input
                  type="text"
                  name="numero"
                  value={deliveryInfo.numero}
                  onChange={handleInputChange}
                  placeholder="Número (opcional)"
                  className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust"
                />

                <input
                  type="tel"
                  name="telefono"
                  value={deliveryInfo.telefono}
                  onChange={handleInputChange}
                  placeholder="Teléfono (9 dígitos) *"
                  maxLength="9"
                  className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust md:col-span-2"
                  required
                />
                <input
                  type="text"
                  name="referencia"
                  value={deliveryInfo.referencia}
                  onChange={handleInputChange}
                  placeholder="Referencia (opcional)"
                  className="px-4 py-3 bg-pardos-cream rounded-lg font-lato text-lg focus:outline-none focus:ring-2 focus:ring-pardos-rust md:col-span-2"
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
                <p className="text-sm font-lato text-gray-700 mb-4">
                  <span className="font-semibold text-pardos-rust">Sede:</span>{' '}
                  {sede}
                </p>
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

              <button
                onClick={handleConfirmarCompra}
                disabled={procesando || loading}
                className="w-full mt-6 bg-pardos-purple hover:bg-pardos-brown text-white font-spartan font-bold py-4 rounded-full text-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {procesando || loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  `CONFIRMAR COMPRA S/ ${getCartTotal().toFixed(2)}`
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4 font-lato">
                Al confirmar, aceptas nuestros términos y condiciones
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
