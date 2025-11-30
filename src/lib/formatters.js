// Función para formatear nombres de categorías
export const formatCategoryName = (category) => {
  if (!category) return '';
  
  // Mapeo personalizado para categorías conocidas
  const categoryMap = {
    'Anticuchos_y_mollejitas': 'Anticuchos y Mollejitas',
    'anticuchos_y_mollejitas': 'Anticuchos y Mollejitas',
    'Pardos_parrilleros': 'Pardos Parrilleros',
    'pardos_parrilleros': 'Pardos Parrilleros',
    'Pardos_brasa': 'Pardos a la Brasa',
    'pardos_brasa': 'Pardos a la Brasa',
    'Pollos': 'Pollos',
    'Bebidas': 'Bebidas',
    'Sanguches': 'Sanguches',
    'Chicharrones': 'Chicharrones',
    'Guarniciones': 'Guarniciones',
    'Adicionales': 'Adicionales',
    'Ensaladas': 'Ensaladas',
    'Promociones': 'Promociones',
  };

  // Si existe en el mapeo, retornar el nombre formateado
  if (categoryMap[category]) {
    return categoryMap[category];
  }

  // Si no, formatear automáticamente
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Función para formatear nombres de sedes
export const formatSedeName = (sedeId) => {
  const sedeMap = {
    'pardo_miraflores': 'Pardos Miraflores',
    'pardo_surco': 'Pardos Surco',
  };
  return sedeMap[sedeId] || sedeId;
};

// Función para formatear fechas
export const formatDate = (isoString) => {
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

// Función para formatear precios
export const formatPrice = (price, currency = 'S/') => {
  return `${currency} ${Number(price).toFixed(2)}`;
};

