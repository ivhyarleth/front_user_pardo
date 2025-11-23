import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { obtenerTodosLosProductosAPI, mapearProducto } from '../config/api';

const Menu = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  // Cargar productos desde la API
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener todos los productos de la API
      const data = await obtenerTodosLosProductosAPI({
        sort_by: 'tipo_producto',
        sort_order: 'asc'
      });

      // Mapear productos al formato del frontend
      const productosMapeados = data
        .filter(p => p.is_active !== false) // Solo productos activos
        .map(mapearProducto);

      setProductos(productosMapeados);

      // Extraer categorías únicas
      const categoriasUnicas = [...new Set(productosMapeados.map(p => p.tipo))];
      setCategorias(categoriasUnicas);

      // Seleccionar primera categoría por defecto
      if (categoriasUnicas.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriasUnicas[0]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('Error al cargar los productos. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter(
    producto => producto.tipo === selectedCategory
  );

  const handleAddToCart = (producto) => {
    // Convertir formato del producto para el carrito
    const productoParaCarrito = {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      tipo: producto.tipo
    };
    addToCart(productoParaCarrito);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pardos-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pardos-rust mx-auto mb-4"></div>
          <p className="font-spartan font-bold text-xl text-pardos-dark">
            Cargando productos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pardos-cream flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="font-spartan font-bold text-2xl text-pardos-dark mb-4">
            {error}
          </h2>
          <button
            onClick={cargarProductos}
            className="bg-pardos-rust hover:bg-pardos-brown text-white px-6 py-3 rounded-full font-spartan font-bold transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="min-h-screen bg-pardos-cream flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="font-spartan font-bold text-2xl text-pardos-dark mb-4">
            No hay productos disponibles
          </h2>
          <p className="font-lato text-gray-600 mb-6">
            Por favor, vuelve más tarde.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pardos-cream">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <aside className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="font-spartan font-bold text-3xl text-pardos-dark mb-4 px-2">
                Categorías
              </h2>
              <nav className="space-y-2">
                {categorias.map(categoria => (
                  <button
                    key={categoria}
                    onClick={() => setSelectedCategory(categoria)}
                    className={`w-full text-left px-4 py-4 rounded-xl font-spartan font-semibold text-lg md:text-xl transition-all duration-300 ${
                      selectedCategory === categoria
                        ? 'bg-pardos-rust text-white shadow-md'
                        : 'text-pardos-dark hover:bg-pardos-cream'
                    }`}
                  >
                    {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content - Products */}
          <main className="flex-1">
            {/* Category Header */}
            <div className="mb-6">
              <h2 className="font-spartan font-black text-3xl md:text-5xl text-pardos-dark">
                {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </h2>
              <div className="h-1 w-32 bg-pardos-yellow mt-2" />
              <p className="text-gray-600 font-lato mt-2">
                {productosFiltrados.length} productos disponibles
              </p>
            </div>

            {/* Products Grid */}
            {productosFiltrados.length === 0 ? (
              <div className="text-center bg-white p-12 rounded-2xl shadow-lg">
                <div className="text-5xl mb-4">😔</div>
                <p className="font-spartan font-bold text-xl text-pardos-dark">
                  No hay productos en esta categoría
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {productosFiltrados.map(producto => (
                  <div
                    key={producto.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:scale-105"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
                        }}
                      />
                      {/* Subcategoría / chip eliminado */}
                    </div>
                    
                    <div className="p-5">
                      <h3 className="font-spartan font-bold text-lg text-pardos-dark mb-2 line-clamp-2 min-h-[3.5rem]">
                        {producto.nombre}
                      </h3>
                      
                      {producto.descripcion && (
                        <p className="text-gray-600 font-lato text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                          {producto.descripcion}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-4">
                        <span className="font-spartan font-black text-2xl text-pardos-rust">
                          S/ {producto.precio.toFixed(2)}
                        </span>
                        
                        <button
                          onClick={() => handleAddToCart(producto)}
                          className="bg-pardos-rust hover:bg-pardos-brown text-white px-5 py-2 rounded-full font-spartan font-bold text-sm transition-all duration-300 transform hover:scale-105"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Menu;
