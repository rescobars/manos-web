// Tipos para optimización de rutas con tráfico

export interface Point {
  lat: number;
  lon: number;
  name: string;
  waypoint_type?: string;
  waypoint_index?: number;
}

export interface VisitOrderItem {
  name: string;
  waypoint_index: number;
}

export interface RouteSummary {
  total_time: number;
  total_distance: number;
  traffic_delay: number;
  base_time?: number;
  traffic_time?: number;
  fuel_consumption?: number | null;
}

export interface RoutePoint {
  lat: number;
  lon: number;
  name: string; // Agregar nombre para compatibilidad
  traffic_delay: number;
  speed: number | null;
  congestion_level: string;
  waypoint_type?: 'origin' | 'destination' | 'waypoint' | 'route';
  waypoint_index?: number | undefined; // Cambiar a undefined para compatibilidad con Point
}

export interface Route {
  summary: RouteSummary;
  points: RoutePoint[];
  route_id: string;
  visit_order: VisitOrderItem[]; // Orden específico de esta ruta
  optimized_waypoints?: Point[]; // Waypoints optimizados (opcional, solo para ruta principal)
}

export interface RouteInfo {
  origin: Point;
  destination: Point;
  waypoints: Point[];
  total_waypoints: number;
  optimized_waypoints: Point[];
  visit_order: VisitOrderItem[]; // Orden general (puede ser removido si no se usa)
}

export interface TrafficOptimizationData {
  route_info: RouteInfo;
  primary_route: Route;
  alternative_routes: Route[] | null;
  request_info: any;
  traffic_conditions: any;
}

export interface TrafficOptimizationRequest {
  origin: Point;
  destination: Point;
  waypoints: Point[];
  alternatives?: boolean;
  queue_mode?: boolean;
}

export interface TrafficOptimizationResponse {
  success: boolean;
  data?: TrafficOptimizationData;
  error?: string;
  message?: string;
}
