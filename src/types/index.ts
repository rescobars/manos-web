// Tipos para la aplicación web basados en el response del backend

export interface User {
  uuid: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Permisos específicos por módulo
export interface ModulePermissions {
  read?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  assign?: boolean;
  cancel?: boolean;
  refund?: boolean;
  schedule?: boolean;
  track?: boolean;
  block?: boolean;
  verify?: boolean;
  export?: boolean;
  invite?: boolean;
  remove?: boolean;
  assign_roles?: boolean;
  suspend?: boolean;
  activate?: boolean;
  reset_password?: boolean;
  backup?: boolean;
  restore?: boolean;
  maintenance?: boolean;
  audit?: boolean;
  block_ip?: boolean;
  whitelist?: boolean;
  analyze?: boolean;
  send?: boolean;
  migrate?: boolean;
}

// Permisos completos del usuario
export interface UserPermissions {
  logs?: ModulePermissions;
  users?: ModulePermissions;
  system?: ModulePermissions;
  members?: ModulePermissions;
  security?: ModulePermissions;
  notifications?: ModulePermissions;
  organizations?: ModulePermissions;
  orders?: ModulePermissions;
  drivers?: ModulePermissions;
  customers?: ModulePermissions;
  reports?: ModulePermissions;
  settings?: ModulePermissions;
  billing?: ModulePermissions;
  analytics?: ModulePermissions;
}

export interface Role {
  uuid: string;
  name: 'PLATFORM_ADMIN' | 'OWNER' | 'DRIVER' | 'VIEWER';
  description: string;
  permissions: UserPermissions;
}

export interface Organization {
  uuid: string;
  name: string;
  slug: string;
  description: string;
  domain: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  status: string;
  plan_type: string;
  subscription_expires_at: string;
  roles: Role[];
  permissions: UserPermissions;
  member_since: string;
  is_owner: boolean;
  is_admin: boolean;
  // Configuración de tema
  theme_config?: OrganizationThemeConfig;
}

export interface OrganizationThemeConfig {
  organization_uuid: string;
  theme_id: string;
  custom_logo_url?: string;
  custom_favicon_url?: string;
  custom_css?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SessionData {
  organizations: Organization[];
  preferences: Record<string, unknown>;
  lastOrganizationUuid?: string;
  total_organizations: number;
}

// Response exacto del backend
export interface LoginResponse {
  user: User;
  organizations: Organization[];
  default_organization: Organization;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Estado de autenticación en el frontend
export interface AuthState {
  user: User | null;
  organizations: Organization[];
  defaultOrganization: Organization | null;
  currentOrganization: Organization | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Tipos para formularios
export interface LoginFormData {
  email: string;
}

export interface InviteMemberFormData {
  email: string;
  name: string;
  title?: string;
  roles: string[];
  organization_uuid?: string;
}

// Tipos para la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipos para el management de organizaciones
export interface CreateOrganizationFormData {
  name: string;
  slug: string;
  description: string;
  domain?: string;
  logo_url: string;
  website_url?: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan_type: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  subscription_expires_at: string;
}

export interface UpdateOrganizationFormData {
  name?: string;
  slug?: string;
  description?: string;
  domain?: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan_type?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  subscription_expires_at?: string;
}

export interface OrganizationFilters {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan_type?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  search?: string;
}

export interface OrganizationStatusUpdate {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// Tipos para el sistema de pedidos
export interface Order {
  uuid: string;
  order_number: string;
  organization_uuid: string;
  user_uuid?: string;
  description?: string;
  total_amount: number;
  pickup_address: string;
  delivery_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'REQUESTED' | 'PENDING' | 'ASSIGNED' | 'IN_ROUTE' | 'COMPLETED' | 'CANCELLED';

export type RouteStatus = 'PLANNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';
export type RoutePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CreateOrderFormData {
  organization_uuid: string;
  user_uuid?: string;
  description?: string;
  total_amount: number;
  pickup_address: string;
  delivery_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
}

export interface UpdateOrderFormData {
  description?: string;
  total_amount?: number;
  pickup_address?: string;
  delivery_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  status?: OrderStatus;
}

export interface BulkCreateOrderData {
  orders: CreateOrderFormData[];
}

export interface OrderFilters {
  status?: OrderStatus;
  organization_uuid?: string;
  date_from?: string;
  date_to?: string;
}

// Tipos para Mapbox Optimization API v2
export interface MapboxLocation {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface MapboxVehicle {
  name: string;
  routing_profile?: 'mapbox/driving' | 'mapbox/driving-traffic' | 'mapbox/cycling' | 'mapbox/walking';
  start_location?: string;
  end_location?: string;
  capacities?: Record<string, number>;
  capabilities?: string[];
  earliest_start?: string;
  latest_end?: string;
  breaks?: Array<{
    earliest_start: string;
    latest_end: string;
    duration: number;
  }>;
  loading_policy?: 'any' | 'fifo' | 'lifo';
}

export interface MapboxService {
  name: string;
  location: string;
  duration?: number;
  requirements?: string[];
  service_times?: Array<{
    earliest: string;
    latest: string;
    type?: 'strict' | 'soft' | 'soft_start' | 'soft_end';
  }>;
}

export interface MapboxShipment {
  name: string;
  from: string;
  to: string;
  size?: Record<string, number>;
  requirements?: string[];
  pickup_duration?: number;
  dropoff_duration?: number;
  pickup_times?: Array<{
    earliest: string;
    latest: string;
    type?: 'strict' | 'soft' | 'soft_start' | 'soft_end';
  }>;
  dropoff_times?: Array<{
    earliest: string;
    latest: string;
    type?: 'strict' | 'soft' | 'soft_start' | 'soft_end';
  }>;
}

export interface MapboxOptimizationOptions {
  objectives?: ['min-total-travel-duration'] | ['min-schedule-completion-time'];
}

export interface MapboxOptimizationRequest {
  version: 1;
  locations: MapboxLocation[];
  vehicles: MapboxVehicle[];
  services?: MapboxService[];
  shipments?: MapboxShipment[];
  options?: MapboxOptimizationOptions;
}

export interface MapboxOptimizationSubmission {
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'ok';
  status_date: string;
}

export interface MapboxOptimizationStop {
  type: 'start' | 'service' | 'pickup' | 'dropoff' | 'break' | 'end';
  location: string;
  eta: string;
  odometer: number;
  wait?: number;
  duration?: number;
  services?: string[];
  pickups?: string[];
  dropoffs?: string[];
}

export interface MapboxOptimizationRoute {
  vehicle: string;
  stops: MapboxOptimizationStop[];
}

export interface MapboxOptimizationSolution {
  dropped: {
    services: string[];
    shipments: string[];
  };
  routes: MapboxOptimizationRoute[];
}

export interface MapboxOptimizationError {
  code: string;
  message: string;
}

// Tipos para las respuestas de la API
export interface MapboxOptimizationResponse {
  success: boolean;
  data?: MapboxOptimizationSubmission | MapboxOptimizationSolution | MapboxOptimizationSubmission[];
  error?: string;
  message?: string;
}

// Tipos para rutas guardadas
export interface RoutePoint {
  lat: number;
  lon: number;
  name: string;
  traffic_delay: number;
  speed: number;
  congestion_level: string;
  waypoint_type: string;
  waypoint_index: number | null;
}

export interface RouteWaypoint {
  lat: number;
  lon: number;
  name: string;
}

export interface OrderedWaypoint {
  order_id: number;
  order: number;
}

export interface TrafficCondition {
  current_time: string;
  weather: string;
  road_conditions: string;
  general_congestion: string;
}

export interface RouteOrder {
  order_uuid: string;
  order_number: string;
  status: OrderStatus;
  pickup_address: string;
  delivery_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_lat: number;
  delivery_lng: number;
  total_amount: number;
  sequence_order: number;
}

export interface SavedRoute {
  id: number;
  uuid: string;
  organization_id: number;
  route_name: string;
  description: string;
  origin_lat: number;
  origin_lon: number;
  origin_name: string;
  destination_lat: number;
  destination_lon: number;
  destination_name: string;
  waypoints: RouteWaypoint[];
  route_points: RoutePoint[];
  ordered_waypoints: OrderedWaypoint[];
  traffic_condition: TrafficCondition;
  traffic_delay: number;
  status: RouteStatus;
  priority: RoutePriority;
  created_at: string;
  updated_at: string;
  orders: RouteOrder[];
}

export interface RoutesResponse {
  success: boolean;
  data: SavedRoute[];
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
