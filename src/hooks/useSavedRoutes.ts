import { useState, useCallback } from 'react';
import { SavedRoute, RoutesResponse } from '@/types';

interface RouteFilters {
  status?: string;
  priority?: string;
  search?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  minTrafficDelay?: number;
  maxTrafficDelay?: number;
  originLat?: number;
  originLon?: number;
  destinationLat?: number;
  destinationLon?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseSavedRoutesReturn {
  savedRoutes: SavedRoute[];
  isLoading: boolean;
  error: string | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchSavedRoutes: (organizationId: string, filters?: RouteFilters) => Promise<RoutesResponse>;
  reset: () => void;
}

export function useSavedRoutes(): UseSavedRoutesReturn {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | undefined>(undefined);

  const fetchSavedRoutes = useCallback(async (organizationId: string, filters?: RouteFilters): Promise<RoutesResponse> => {
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
      // Construir URL con parámetros de filtro
      let apiUrl = '/api/routes';
      const queryParams = new URLSearchParams();
      
      console.log('=== useSavedRoutes fetchSavedRoutes ===');
      console.log('filters received:', filters);
      
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.priority) queryParams.append('priority', filters.priority);
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.createdAfter) queryParams.append('created_after', filters.createdAfter);
      if (filters?.createdBefore) queryParams.append('created_before', filters.createdBefore);
      if (filters?.updatedAfter) queryParams.append('updated_after', filters.updatedAfter);
      if (filters?.updatedBefore) queryParams.append('updated_before', filters.updatedBefore);
      if (filters?.minTrafficDelay) queryParams.append('min_traffic_delay', filters.minTrafficDelay.toString());
      if (filters?.maxTrafficDelay) queryParams.append('max_traffic_delay', filters.maxTrafficDelay.toString());
      if (filters?.originLat) queryParams.append('origin_lat', filters.originLat.toString());
      if (filters?.originLon) queryParams.append('origin_lon', filters.originLon.toString());
      if (filters?.destinationLat) queryParams.append('destination_lat', filters.destinationLat.toString());
      if (filters?.destinationLon) queryParams.append('destination_lon', filters.destinationLon.toString());
      if (filters?.radius) queryParams.append('radius', filters.radius.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.sortBy) queryParams.append('sort_by', filters.sortBy);
      if (filters?.sortOrder) queryParams.append('sort_order', filters.sortOrder);
      
      console.log('queryParams built:', queryParams.toString());
      
      if (queryParams.toString()) {
        apiUrl += `?${queryParams.toString()}`;
      }
      
      console.log('Final API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': organizationId,
        },
      });

      const result: RoutesResponse = await response.json();

      if (result.success && result.data) {
        // Agregar valores por defecto para status y priority si no existen
        const routesWithDefaults = result.data.map(route => ({
          ...route,
          status: route.status || 'PLANNED',
          priority: route.priority || 'MEDIUM'
        }));
        setSavedRoutes(routesWithDefaults);
        setPagination(result.pagination);
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
    pagination,
    fetchSavedRoutes,
    reset
  };
}

