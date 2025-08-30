import { useState, useCallback } from 'react';
import { TrafficOptimizationData } from '@/types/traffic-optimization';

interface CreateRouteRequest {
  routeData: TrafficOptimizationData;
  selectedOrders: string[];
  organizationId: string;
  routeName?: string;
  description?: string;
}

interface CreateRouteResponse {
  success: boolean;
  data?: {
    route_id: string;
    message: string;
    payload_sent: any;
  };
  error?: string;
}

interface UseRouteCreationReturn {
  createRoute: (request: CreateRouteRequest) => Promise<CreateRouteResponse>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useRouteCreation(): UseRouteCreationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoute = useCallback(async (request: CreateRouteRequest): Promise<CreateRouteResponse> => {
    if (!request.routeData || !request.selectedOrders || !request.organizationId) {
      const errorResponse: CreateRouteResponse = {
        success: false,
        error: 'Faltan datos requeridos para crear la ruta'
      };
      setError(errorResponse?.error || 'Faltan datos requeridos para crear la ruta');
      return errorResponse;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/routes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result: CreateRouteResponse = await response.json();

      if (result.success) {
        setError(null);
      } else {
        setError(result.error || 'Error desconocido al crear la ruta');
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
  }, []);

  return {
    createRoute,
    isLoading,
    error,
    reset
  };
}
