import { useState, useCallback } from 'react';

// Tipos para las rutas guardadas
export interface SavedRoute {
  id: string;
  route_name: string;
  description: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  origin: {
    lat: number;
    lon: number;
    name: string;
  };
  destination: {
    lat: number;
    lon: number;
    name: string;
  };
  waypoints: Array<{
    lat: number;
    lon: number;
    name: string;
  }>;
  route: Array<{
    lat: number;
    lon: number;
    name?: string;
    traffic_delay?: number;
    speed?: number;
    congestion_level?: string;
    waypoint_type?: string;
    waypoint_index?: number;
  }>;
  ordered_waypoints: Array<{
    order_id: string;
    order: number;
  }>;
  traffic_condition: any;
  traffic_delay: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface SavedRoutesResponse {
  success: boolean;
  data?: SavedRoute[];
  error?: string;
}

interface UseSavedRoutesReturn {
  savedRoutes: SavedRoute[];
  isLoading: boolean;
  error: string | null;
  fetchSavedRoutes: (organizationId: string) => Promise<SavedRoutesResponse>;
  reset: () => void;
}

export function useSavedRoutes(): UseSavedRoutesReturn {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedRoutes = useCallback(async (organizationId: string): Promise<SavedRoutesResponse> => {
    if (!organizationId) {
      const errorResponse: SavedRoutesResponse = {
        success: false,
        error: 'Organization ID is required'
      };
      setError(errorResponse.error ?? null);
      return errorResponse;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Reemplazar con el endpoint real cuando esté disponible
      const response = await fetch(`/api/routes/organization/${organizationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: SavedRoutesResponse = await response.json();

      if (result.success && result.data) {
        setSavedRoutes(result.data);
        setError(null);
      } else {
        setError(result.error || 'Error al obtener las rutas guardadas');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    setSavedRoutes([]);
  }, []);

  return {
    savedRoutes,
    isLoading,
    error,
    fetchSavedRoutes,
    reset
  };
}

