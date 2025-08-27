// Configuración de Mapbox
export const MAPBOX_CONFIG = {
  // Token de acceso público (debe estar en .env.local)
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  
  // Estilos de mapa disponibles
  styles: {
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11'
  },
  
  // Configuración por defecto
  defaultStyle: 'mapbox://styles/mapbox/streets-v12',
  defaultZoom: 12,
  defaultCenter: [-90.5069, 14.6349], // Ciudad de Guatemala
  
  // Límites de búsqueda
  searchCountry: 'GT', // Guatemala
  searchTypes: 'address,poi', // Direcciones y puntos de interés
  
  // Configuración de marcadores
  markerColors: {
    pickup: '#3B82F6',    // Azul para sucursal
    delivery: '#10B981',  // Verde para entrega
    selected: '#F59E0B'   // Amarillo para seleccionado
  }
};

// Función para verificar si Mapbox está configurado
export const isMapboxConfigured = (): boolean => {
  return !!MAPBOX_CONFIG.accessToken;
};

// Función para obtener el token de Mapbox
export const getMapboxToken = (): string => {
  if (!MAPBOX_CONFIG.accessToken) {
    console.warn('Mapbox token no configurado. Agrega NEXT_PUBLIC_MAPBOX_TOKEN en .env.local');
  }
  return MAPBOX_CONFIG.accessToken;
};
