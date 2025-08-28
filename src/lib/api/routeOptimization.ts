// Interfaces para el frontend
interface FrontendLocation {
  lat: string | number;
  lng: string | number;
  address: string;
}

interface FrontendOrder {
  id: string;
  orderNumber: string;
  deliveryLocation: FrontendLocation;
  description?: string;
  totalAmount: string | number;
  createdAt?: string;
}

// Interfaces para la API de FastAPI
interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface Order {
  id: string;
  order_number: string;
  delivery_location: Location;
  description: string;
  total_amount: number;
}

interface OptimizedStop {
  stop_number: number;
  order: Order;
  distance_from_previous: number;
  cumulative_distance: number;
  estimated_time: number;
}

interface OptimizationMetrics {
  algorithm: string;
  solver_time: number;
  locations_optimized: number;
}

interface OptimizedRoute {
  total_distance: number;
  total_time: number;
  stops: OptimizedStop[];
  optimization_metrics: OptimizationMetrics;
}

interface RouteOptimizationResponse {
  success: boolean;
  optimized_route: OptimizedRoute;
  error_message: string | null;
  processing_time: number;
}

interface RouteOptimizationRequest {
  pickup_location: Location;
  orders: Order[];
}

// API base URL - llamar directamente a FastAPI
const API_BASE_URL = 'http://localhost:8000';

export const routeOptimizationService = {
  // Optimizar una sola ruta
  async optimizeRoute(request: RouteOptimizationRequest): Promise<RouteOptimizationResponse> {
    try {
      console.log('🔍 Request completo:', JSON.stringify(request, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/api/v1/routes/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Response exitoso:', data);
      return data;
    } catch (error) {
      console.error('💥 Error optimizing route:', error);
      throw error;
    }
  },

  // Optimizar múltiples rutas (batch)
  async optimizeRoutesBatch(requests: RouteOptimizationRequest[]): Promise<RouteOptimizationResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/routes/optimize/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requests),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error optimizing routes batch:', error);
      throw error;
    }
  },

  // Convertir pedidos del frontend al formato del API
  convertOrdersForAPI(orders: FrontendOrder[], pickupLocation: Location): Order[] {
    return orders.map(order => ({
      id: order.id,
      order_number: order.orderNumber,
      delivery_location: {
        lat: parseFloat(order.deliveryLocation.lat.toString()),
        lng: parseFloat(order.deliveryLocation.lng.toString()),
        address: order.deliveryLocation.address
      },
      description: order.description || '', // Ensure description is always a string
      total_amount: parseFloat(order.totalAmount.toString())
    }));
  },

  // Convertir respuesta del API al formato del frontend
  convertApiResponseToFrontend(response: RouteOptimizationResponse) {
    return {
      totalDistance: response.optimized_route.total_distance,
      totalTime: response.optimized_route.total_time,
      stops: response.optimized_route.stops.map(stop => ({
        stopNumber: stop.stop_number,
        order: stop.order,
        distanceFromPrevious: stop.distance_from_previous,
        cumulativeDistance: stop.cumulative_distance,
        estimatedTime: stop.estimated_time
      })),
      optimizationMetrics: response.optimized_route.optimization_metrics,
      processingTime: response.processing_time
    };
  }
};

export type {
  FrontendLocation,
  FrontendOrder,
  Location,
  Order,
  OptimizedStop,
  OptimizedRoute,
  OptimizationMetrics,
  RouteOptimizationResponse,
  RouteOptimizationRequest
};
