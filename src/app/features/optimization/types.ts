export interface Location {
  lat: number;
  lng: number;
  address: string;
  id?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  deliveryLocation: Location;
  description?: string;
  totalAmount?: number;
  createdAt?: string;
}

export interface OptimizedRoute {
  optimized_route: {
    stops: Array<{
      stop_number: number;
      order: {
        id: string;
        order_number: string;
        description: string;
        delivery_location: Location;
      };
      distance_from_previous: number;
      cumulative_distance: number;
    }>;
    total_distance: number;
    total_time: number;
    optimization_metrics: {
      algorithm: string;
      locations_optimized: number;
      solver_time: number;
    };
  };
  processing_time: number;
}

export interface OptimizedRouteMapProps {
  pickupLocation: Location;
  optimizedRoute: OptimizedRoute;
  showOptimizedRoute: boolean;
}
