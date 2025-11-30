import { useCart } from '../context/CartContext';
import { CheckCircle, X } from 'lucide-react';

const AddToCartToast = () => {
  const { showAddedModal, setShowAddedModal, lastAddedProduct } = useCart();

  if (!showAddedModal || !lastAddedProduct) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-green-500 p-4 flex items-center gap-4 max-w-md">
        {/* Icono de éxito */}
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>

        {/* Imagen del producto */}
        <img
          src={lastAddedProduct.imagen}
          alt={lastAddedProduct.nombre}
          className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/56';
          }}
        />

        {/* Información */}
        <div className="flex-1 min-w-0">
          <p className="font-spartan font-bold text-sm text-green-700 mb-1">
            ¡Agregado al carrito!
          </p>
          <p className="font-lato text-pardos-dark text-sm truncate">
            {lastAddedProduct.nombre}
          </p>
          <p className="font-spartan font-bold text-pardos-rust text-sm">
            S/ {lastAddedProduct.precio.toFixed(2)}
          </p>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={() => setShowAddedModal(false)}
          className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default AddToCartToast;

