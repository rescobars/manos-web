import { useState, useCallback } from 'react';

interface RoutePoint {
  lat: number;
  lon: number;
  name: string;
  traffic_delay: number;
  speed: number;
  congestion_level: string;
  waypoint_index: number | null;
}

interface Waypoint {
  lat: number;
  lon: number;
  name: string;
}

interface Order {
  order_uuid: string;
  order_number: string;
  description: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_lat: number;
  delivery_lng: number;
  total_amount: number;
  details: string;
  created_at: string;
  updated_at: string;
  sequence_order: number;
}

interface TrafficCondition {
  road_conditions: string;
  general_congestion: string;
}

export interface RouteData {
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
  waypoints: Waypoint[];
  route_points: RoutePoint[];
  orders: Order[];
  traffic_condition: TrafficCondition;
  traffic_delay: number;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface RouteResponse {
  success: boolean;
  data?: RouteData;
  message?: string;
  error?: string;
}

interface UseRouteReturn {
  route: RouteData | null;
  getRoute: (uuid: string) => Promise<RouteResponse>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useRoute(): UseRouteReturn {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRoute = useCallback(async (uuid: string): Promise<RouteResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/routes/${uuid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: RouteResponse = await response.json();

      if (result.success && result.data) {
        setRoute(result.data);
        setError(null);
      } else {
        setError(result.error || 'Error desconocido al obtener la ruta');
        setRoute(null);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      setRoute(null);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setRoute(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    route,
    getRoute,
    isLoading,
    error,
    reset
  };
}
