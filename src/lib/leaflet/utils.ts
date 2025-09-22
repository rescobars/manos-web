import L from 'leaflet';
import { CombinedDriverPosition, Location, Order } from './types';

// Colores para diferentes estados
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'DRIVING':
      return '#10B981'; // Verde
    case 'IDLE':
    case 'STOPPED':
      return '#F59E0B'; // Amarillo
    case 'BREAK':
      return '#8B5CF6'; // Púrpura
    case 'OFFLINE':
      return '#6B7280'; // Gris
    default:
      return '#6B7280';
  }
};

// Crear icono personalizado para conductores
export const createDriverIcon = (status: string, isSelected: boolean = false): L.DivIcon => {
  const color = getStatusColor(status);
  const size = isSelected ? 24 : 20;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.6}px;
        color: white;
        font-weight: bold;
      ">
        🚗
      </div>
    `,
    className: 'custom-driver-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Crear icono personalizado para pedidos
export const createOrderIcon = (orderNumber: string, color: string, isSelected: boolean = false): L.DivIcon => {
  const size = isSelected ? 32 : 28;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.4}px;
        color: white;
        font-weight: bold;
      ">
        ${orderNumber}
      </div>
    `,
    className: 'custom-order-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Crear icono para ubicación de recogida
export const createPickupIcon = (): L.DivIcon => {
  return L.divIcon({
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: #3B82F6;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: white;
        font-weight: bold;
      ">
        P
      </div>
    `,
    className: 'custom-pickup-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Convertir coordenadas a formato Leaflet
export const toLeafletLatLng = (location: Location): L.LatLng => {
  return L.latLng(location.latitude, location.longitude);
};

// Calcular distancia entre dos puntos
export const calculateDistance = (point1: Location, point2: Location): number => {
  const lat1 = point1.latitude;
  const lng1 = point1.longitude;
  const lat2 = point2.latitude;
  const lng2 = point2.longitude;

  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calcular bounds para un array de ubicaciones
export const calculateBounds = (locations: Location[]): L.LatLngBounds => {
  if (locations.length === 0) {
    return L.latLngBounds([0, 0], [0, 0]);
  }

  const lats = locations.map(loc => loc.latitude);
  const lngs = locations.map(loc => loc.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return L.latLngBounds(
    L.latLng(minLat, minLng),
    L.latLng(maxLat, maxLng)
  );
};

// Generar color único para pedidos
export const generateOrderColor = (orderId: string): string => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'
  ];
  
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    const char = orderId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Verificar si un conductor está offline
export const isDriverOffline = (driver: CombinedDriverPosition, thresholdMinutes: number = 70): boolean => {
  const transmissionTime = driver.transmission_timestamp || driver.timestamp;
  
  if (!transmissionTime) return true;
  
  const lastTransmissionTime = new Date(transmissionTime).getTime();
  const currentTime = new Date().getTime();
  const timeDifferenceMinutes = (currentTime - lastTransmissionTime) / (1000 * 60);
  
  return timeDifferenceMinutes > thresholdMinutes;
};

// Obtener estado real del conductor
export const getRealDriverStatus = (driver: CombinedDriverPosition): string => {
  if (isDriverOffline(driver)) {
    return 'OFFLINE';
  }
  return driver.status || 'IDLE';
};
