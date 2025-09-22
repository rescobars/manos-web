import L from 'leaflet';
import { CombinedDriverPosition, Location, Order } from './types';

// Colores para diferentes estados
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'DRIVING':
      return '#10B981'; // Verde - En movimiento/activo
    case 'IDLE':
      return '#F59E0B'; // Ámbar/Naranja - Esperando
    case 'STOPPED':
      return '#EF4444'; // Rojo - Detenido
    case 'BREAK':
      return '#8B5CF6'; // Púrpura - En descanso
    case 'OFFLINE':
      return '#6B7280'; // Gris - Sin conexión
    default:
      return '#6B7280';
  }
};

// Crear icono personalizado para conductores
export const createDriverIcon = (status: string, isSelected: boolean = false): L.DivIcon => {
  const color = getStatusColor(status);
  const size = isSelected ? 48 : 44; // Mucho más grandes
  const borderWidth = isSelected ? 3 : 2;
  const iconSize = isSelected ? 26 : 24; // Ícono mucho más grande

  // Crear SVG del ícono de vehículo
  const vehicleSvg = `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 11L6.5 6.5H17.5L19 11M5 11V16H3V18H5V16H19V18H21V16H19V11M5 11H19M7.5 15.5C7.5 16.3284 8.17157 17 9 17C9.82843 17 10.5 16.3284 10.5 15.5C10.5 14.6716 9.82843 14 9 14C8.17157 14 7.5 14.6716 7.5 15.5ZM16.5 15.5C16.5 16.3284 17.1716 17 18 17C18.8284 17 19.5 16.3284 19.5 15.5C19.5 14.6716 18.8284 14 18 14C17.1716 14 16.5 14.6716 16.5 15.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  // Efecto de transmisión solo para DRIVING (más pequeño y lento)
  const transmissionEffect = status === 'DRIVING' ? `
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${size * 1.4}px;
      height: ${size * 1.4}px;
      border: 1.5px solid ${color};
      border-radius: 50%;
      opacity: 0.5;
      animation: transmission-pulse 4s infinite;
    "></div>
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${size * 1.7}px;
      height: ${size * 1.7}px;
      border: 1.5px solid ${color};
      border-radius: 50%;
      opacity: 0.3;
      animation: transmission-pulse 4s infinite 1s;
    "></div>
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${size * 2}px;
      height: ${size * 2}px;
      border: 1.5px solid ${color};
      border-radius: 50%;
      opacity: 0.1;
      animation: transmission-pulse 4s infinite 2s;
    "></div>
  ` : '';

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, ${color}, ${color}dd);
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.2s ease;
        z-index: 10;
      ">
        ${vehicleSvg}
        ${isSelected ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 14px;
            height: 14px;
            background: #3B82F6;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            z-index: 15;
          "></div>
        ` : ''}
      </div>
      ${transmissionEffect}
    `,
    className: `custom-driver-icon ${status === 'DRIVING' ? 'driving-transmission' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Crear icono personalizado para pedidos
export const createOrderIcon = (orderNumber: string, color: string, isSelected: boolean = false): L.DivIcon => {
  const size = isSelected ? 40 : 36;
  const borderWidth = isSelected ? 3 : 2;
  const fontSize = isSelected ? 14 : 12;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, ${color}, ${color}dd);
        border: ${borderWidth}px solid white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${fontSize}px;
        color: white;
        font-weight: bold;
        position: relative;
        transition: all 0.2s ease;
      ">
        ${orderNumber}
        ${isSelected ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            background: #3B82F6;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        ` : ''}
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
  const size = 36;
  const iconSize = 20;

  // SVG del ícono de pickup
  const pickupSvg = `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
    </svg>
  `;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, #3B82F6, #1D4ED8);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.2s ease;
      ">
        ${pickupSvg}
      </div>
    `,
    className: 'custom-pickup-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
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
