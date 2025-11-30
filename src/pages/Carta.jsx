import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import {
  obtenerTodosLosProductosAPI,
  mapearProducto,
  SEDES,
  getSelectedSede,
  setSelectedSede,
  getSedeInfo,
} from '../config/api';
import { formatCategoryName } from '../lib/formatters';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import './Carta.css';

const PRODUCTOS_POR_PAGINA = 12;

const Carta = () => {
  const [productos, setProductos] = useState([]);
  const [selectedSede, setSelectedSedeState] = useState(getSelectedSede());
  const [selectedCategory, setSelectedCategory] = useState('Pollos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);

  // Cargar productos cuando cambia la sede
  useEffect(() => {
    cargarProductos();
  }, [selectedSede]);

  // Extraer categorías únicas de los productos
  useEffect(() => {
    if (productos.length > 0) {
      const uniqueCategories = [
        ...new Set(productos.map((p) => p.tipo)),
      ].filter(Boolean);
      setCategories(uniqueCategories);

      // Establecer primera categoría si no está seleccionada o no existe
      if (!selectedCategory || !uniqueCategories.includes(selectedCategory)) {
        setSelectedCategory(uniqueCategories[0] || 'Pollos');
      }
    }
  }, [productos]);

  // Resetear página cuando cambia la categoría
  useEffect(() => {
    setPaginaActual(1);
  }, [selectedCategory]);

  const cargarProductos = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await obtenerTodosLosProductosAPI();
      const productosMapeados = data.map(mapearProducto);
      setProductos(productosMapeados);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('No se pudieron cargar los productos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSedeChange = (nuevoSedeId) => {
    setSelectedSedeState(nuevoSedeId);
    setSelectedSede(nuevoSedeId);
    setPaginaActual(1);
  };

  const filteredProducts = productos.filter(
    (product) => product.tipo === selectedCategory && product.activo
  );

  // Paginación
  const totalPaginas = Math.ceil(filteredProducts.length / PRODUCTOS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
  const indiceFin = indiceInicio + PRODUCTOS_POR_PAGINA;
  const productosEnPagina = filteredProducts.slice(indiceInicio, indiceFin);

  const sedeActual = getSedeInfo(selectedSede);

  return (
    <div className="carta-page">
      {/* Selector de Sede - Nuevo componente */}
      <div className="sede-selector-banner">
        <div className="sede-selector-container">
          <div className="sede-selector-label">
            <MapPin className="w-6 h-6 inline-block mr-2" />
            Selecciona tu sede:
          </div>
          <div className="sede-buttons">
            {SEDES.map((sede) => (
              <button
                key={sede.id}
                className={`sede-btn ${selectedSede === sede.id ? 'active' : ''}`}
                onClick={() => handleSedeChange(sede.id)}
              >
                <div className="sede-btn-nombre">{sede.nombre}</div>
                <div className="sede-btn-direccion">{sede.direccion}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="carta-container">
        <div className="categories-sidebar">
          {loading ? (
            <div className="loading-categories">Cargando...</div>
          ) : categories.length > 0 ? (
            categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {formatCategoryName(category)}
              </button>
            ))
          ) : (
            <div className="no-categories">No hay categorías disponibles</div>
          )}
        </div>

        <div className="products-grid">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando productos de {sedeActual.nombre}...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button onClick={cargarProductos} className="retry-btn">
                Reintentar
              </button>
            </div>
          ) : (
            <>
              <div className="category-header">
                <h2 className="category-title">{formatCategoryName(selectedCategory)}</h2>
                {filteredProducts.length > PRODUCTOS_POR_PAGINA && (
                  <p className="text-sm text-gray-600">
                    Mostrando {indiceInicio + 1} - {Math.min(indiceFin, filteredProducts.length)} de {filteredProducts.length} productos
                  </p>
                )}
              </div>
              
              <div className="products-container">
                {productosEnPagina.length > 0 ? (
                  productosEnPagina.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                ) : (
                  <div className="no-products">
                    <p>
                      No hay productos disponibles en esta categoría para{' '}
                      {sedeActual.nombre}
                    </p>
                  </div>
                )}
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="pagination-container">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                    disabled={paginaActual === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>

                  <div className="pagination-pages">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                      (pagina) => (
                        <button
                          key={pagina}
                          onClick={() => setPaginaActual(pagina)}
                          className={`pagination-page ${paginaActual === pagina ? 'active' : ''}`}
                        >
                          {pagina}
                        </button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
                    }
                    disabled={paginaActual === totalPaginas}
                    className="flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Carta;
