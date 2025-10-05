import { useState, useCallback } from 'react';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface DeliveryOrder {
  id: string;
  order_number: string;
  origin: Location;
  destination: Location;
  description: string;
  total_amount: number;
  priority: number;
  estimated_pickup_time: number;
  estimated_delivery_time: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  sequence: number;
  distance_from_previous: number | null;
  instruction: string;
  street_name: string;
  traffic_delay: number;
}

interface OptimizedRoute {
  total_distance: number;
  total_time: number;
  total_traffic_delay: number;
  stops: Array<{
    stop_number: number;
    stop_type: 'start' | 'pickup' | 'delivery' | 'end';
    order: DeliveryOrder | null;
    location: Location;
    distance_from_previous: number;
    cumulative_distance: number;
    estimated_time: number;
    cumulative_time: number;
    traffic_delay: number;
  }>;
  route_points: RoutePoint[];
  orders_delivered: number;
  optimization_metrics: {
    algorithm: string;
    locations_optimized: number;
    traffic_enabled: boolean;
    orders_processed: number;
  };
  route_efficiency: number;
}

interface MultiDeliveryOptimizationData {
  success: boolean;
  optimized_route?: OptimizedRoute;
  processing_time?: number;
  traffic_conditions?: {
    overall_congestion: string;
    total_traffic_delay: number;
    traffic_enabled: boolean;
  };
  error?: string;
}

interface UseMultiDeliveryOptimizationReturn {
  data: MultiDeliveryOptimizationData | null;
  optimizeRoute: (
    startLocation: Location,
    endLocation: Location,
    orders: DeliveryOrder[],
    options?: {
      include_traffic?: boolean;
      departure_time?: string;
      travel_mode?: string;
      route_type?: string;
      max_orders_per_trip?: number;
    }
  ) => Promise<MultiDeliveryOptimizationData>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useMultiDeliveryOptimization(): UseMultiDeliveryOptimizationReturn {
  const [data, setData] = useState<MultiDeliveryOptimizationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeRoute = useCallback(async (
    startLocation: Location,
    endLocation: Location,
    orders: DeliveryOrder[],
    options: {
      include_traffic?: boolean;
      departure_time?: string;
      travel_mode?: string;
      route_type?: string;
      max_orders_per_trip?: number;
    } = {}
  ): Promise<MultiDeliveryOptimizationData> => {
    setIsLoading(true);
    setError(null);

    try {
      const requestData = {
        driver_start_location: startLocation,
        driver_end_location: endLocation,
        delivery_orders: orders,
        include_traffic: options.include_traffic !== undefined ? options.include_traffic : true,
        departure_time: options.departure_time || 'now',
        travel_mode: options.travel_mode || 'car',
        route_type: options.route_type || 'fastest',
        max_orders_per_trip: options.max_orders_per_trip || 10
      };

      console.log('🚀 Sending request to API:', requestData);
      console.log('🔍 Start location in request:', requestData.driver_start_location);
      console.log('🔍 End location in request:', requestData.driver_end_location);

      const response = await fetch('/api/route-optimization-multi-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result: MultiDeliveryOptimizationData = await response.json();

      if (result.success) {
        setData(result);
        setError(null);
      } else {
        setError(result.error || 'Error desconocido en la optimización');
        setData(null);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      setData(null);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    optimizeRoute,
    isLoading,
    error,
    reset
  };
}
