import L from 'leaflet';

// Tipos base para ubicaciones
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

// Re-exportar tipos de conductores desde los hooks originales
export type { DriverPosition } from '@/hooks/useDriverPositions';
export type { RouteDriverPosition } from '@/hooks/useRouteDriverPositions';

export type CombinedDriverPosition = import('@/hooks/useDriverPositions').DriverPosition | import('@/hooks/useRouteDriverPositions').RouteDriverPosition;

// Tipos para pedidos
export interface Order {
  id: string;
  orderNumber: string;
  deliveryLocation: {
    lat: number;
    lng: number;
    address: string;
    id?: string;
  };
  description?: string;
  totalAmount?: number;
  createdAt?: string;
}

// Tipos para rutas
export interface Route {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

// Tipos para marcadores personalizados
export interface CustomMarkerOptions extends L.MarkerOptions {
  driverId?: string;
  orderId?: string;
  routeId?: string;
  status?: string;
  isSelected?: boolean;
}

// Tipos para popups
export interface PopupContent {
  title: string;
  content: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

// Tipos para eventos del mapa
export interface MapEvents {
  onDriverClick?: (driver: CombinedDriverPosition) => void;
  onOrderClick?: (order: Order) => void;
  onRouteClick?: (route: Route) => void;
  onMapReady?: (map: L.Map) => void;
  onMapMove?: (map: L.Map) => void;
  onMapZoom?: (map: L.Map) => void;
}
