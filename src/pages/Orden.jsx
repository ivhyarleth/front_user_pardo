import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { AlertCircle, Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import './Orden.css';

const Orden = () => {
  const { cart, updateQuantity, removeFromCart, getTotal } = useCart();
  const navigate = useNavigate();
  const [showEmptyCartModal, setShowEmptyCartModal] = useState(false);

  const handleCheckout = () => {
    if (cart.length === 0) {
      setShowEmptyCartModal(true);
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-pardos-cream flex items-center justify-center p-4">
        <div className="text-center bg-white p-12 rounded-2xl shadow-lg max-w-md">
          <div className="w-24 h-24 bg-pardos-cream rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-pardos-rust" />
          </div>
          <h2 className="font-spartan font-bold text-3xl text-pardos-dark mb-3">
            Tu orden está vacía
          </h2>
          <p className="text-gray-600 font-lato mb-8">
            Agrega productos deliciosos desde nuestro menú
          </p>
          <Button onClick={() => navigate('/menu')} size="lg">
            Ver Menú
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-pardos-cream py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="font-spartan font-black text-4xl md:text-5xl text-pardos-dark">
              MI ORDEN
            </h1>
            <div className="h-1 w-32 bg-pardos-yellow mt-2" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row items-center gap-4 transform transition-all duration-300 hover:shadow-xl"
                >
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/96';
                    }}
                  />

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-spartan font-bold text-xl text-pardos-dark mb-1">
                      {item.nombre}
                    </h3>
                    <p className="font-spartan font-bold text-2xl text-pardos-rust">
                      S/ {item.precio.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      className="w-10 h-10 rounded-full bg-pardos-cream hover:bg-pardos-rust hover:text-white text-pardos-rust font-bold transition-all flex items-center justify-center"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-spartan font-bold text-xl min-w-[3rem] text-center">
                      x{item.quantity}
                    </span>
                    <button
                      className="w-10 h-10 rounded-full bg-pardos-cream hover:bg-pardos-rust hover:text-white text-pardos-rust font-bold transition-all flex items-center justify-center"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white transition-all flex items-center justify-center"
                    onClick={() => removeFromCart(item.id)}
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-24">
                <h3 className="font-spartan font-bold text-2xl text-pardos-dark mb-6">
                  Resumen de Pedido
                </h3>

                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between font-lato text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">S/ {getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center font-spartan font-bold text-xl text-pardos-dark">
                    <span>Total general</span>
                    <span className="text-pardos-rust text-3xl">
                      S/ {getTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button onClick={handleCheckout} className="w-full" size="lg">
                  PROCESAR COMPRA
                </Button>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => navigate('/menu')}
                    variant="ghost"
                    className="w-full"
                  >
                    Seguir Comprando
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de carrito vacío */}
      <Dialog open={showEmptyCartModal} onOpenChange={setShowEmptyCartModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>
            <DialogTitle className="text-center">Carrito Vacío</DialogTitle>
            <DialogDescription className="text-center">
              Tu carrito está vacío. Por favor, agrega productos antes de proceder al checkout.
            </DialogDescription>
          </DialogHeader>

          <Button
            onClick={() => {
              setShowEmptyCartModal(false);
              navigate('/menu');
            }}
            className="w-full mt-4"
          >
            Ver Menú
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Orden;
