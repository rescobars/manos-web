import { useState, useCallback } from 'react';
import { SavedRoute, RoutesResponse } from '@/types';

interface UseSavedRoutesReturn {
  savedRoutes: SavedRoute[];
  isLoading: boolean;
  error: string | null;
  fetchSavedRoutes: (organizationId: string) => Promise<RoutesResponse>;
  reset: () => void;
}

export function useSavedRoutes(): UseSavedRoutesReturn {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedRoutes = useCallback(async (organizationId: string): Promise<RoutesResponse> => {
    if (!organizationId) {
      const errorResponse: RoutesResponse = {
        success: false,
        data: [],
        message: 'Organization ID is required'
      };
      setError('Organization ID is required');
      return errorResponse;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/routes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': organizationId,
        },
      });

      const result: RoutesResponse = await response.json();

      if (result.success && result.data) {
        setSavedRoutes(result.data);
        setError(null);
      } else {
        setError('Error al obtener las rutas guardadas');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      
      return {
        success: false,
        data: [],
        message: errorMessage
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

