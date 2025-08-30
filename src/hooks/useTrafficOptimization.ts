import { useState, useCallback } from 'react';

interface Point {
  lat: number;
  lon: number;
  name: string;
}

interface RouteSummary {
  total_time: number;
  total_distance: number;
  traffic_delay: number;
  base_time?: number;
  traffic_time?: number;
  fuel_consumption?: number | null;
}

interface RoutePoint {
  lat: number;
  lon: number;
  traffic_delay: number;
  speed: number | null;
  congestion_level: string;
  waypoint_type: 'origin' | 'destination' | 'waypoint' | 'route';
  waypoint_index: number | null;
}

interface Route {
  summary: RouteSummary;
  points: RoutePoint[];
  route_id: string;
}

interface TrafficOptimizationData {
  route_info: {
    origin: Point;
    destination: Point;
    waypoints: Point[];
    total_waypoints: number;
  };
  primary_route: Route;
  alternative_routes: Route[] | null;
  request_info: any;
  traffic_conditions: any;
}

interface TrafficOptimizationResponse {
  success: boolean;
  data?: TrafficOptimizationData;
  error?: string;
  message?: string;
}

interface UseTrafficOptimizationReturn {
  optimizeRoute: (origin: Point, destination: Point, waypoints: Point[], alternatives?: boolean) => Promise<TrafficOptimizationResponse>;
  isLoading: boolean;
  error: string | null;
  data: TrafficOptimizationData | null;
  reset: () => void;
}

export function useTrafficOptimization(): UseTrafficOptimizationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrafficOptimizationData | null>(null);

  const optimizeRoute = useCallback(async (
    origin: Point,
    destination: Point,
    waypoints: Point[], 
    alternatives: boolean = true
  ): Promise<TrafficOptimizationResponse> => {
    if (!origin || !destination || !waypoints || waypoints.length === 0) {
      const errorResponse: TrafficOptimizationResponse = {
        success: false,
        error: 'Se requieren origin, destination y al menos 1 waypoint para optimizar la ruta'
      };
      setError(errorResponse.error || 'Error de validación');
      return errorResponse;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/route-optimization-trafic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
          waypoints,
          alternatives
        }),
      });

      const result: TrafficOptimizationResponse = await response.json();

      if (result.success && result.data) {
        setData(result.data);
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
    optimizeRoute,
    isLoading,
    error,
    data,
    reset
  };
}

// Hook específico para optimización simple (sin alternativas)
export function useSimpleTrafficOptimization(): UseTrafficOptimizationReturn {
  const baseHook = useTrafficOptimization();
  
  const optimizeRoute = useCallback(async (
    origin: Point,
    destination: Point,
    waypoints: Point[]
  ): Promise<TrafficOptimizationResponse> => {
    return baseHook.optimizeRoute(origin, destination, waypoints, false);
  }, [baseHook]);

  return {
    ...baseHook,
    optimizeRoute
  };
}

// Hook para optimización con múltiples alternativas
export function useAlternativeTrafficOptimization(): UseTrafficOptimizationReturn {
  const baseHook = useTrafficOptimization();
  
  const optimizeRoute = useCallback(async (
    origin: Point,
    destination: Point,
    waypoints: Point[]
  ): Promise<TrafficOptimizationResponse> => {
    return baseHook.optimizeRoute(origin, destination, waypoints, true);
  }, [baseHook]);

  return {
    ...baseHook,
    optimizeRoute
  };
}
