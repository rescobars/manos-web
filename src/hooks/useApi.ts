import { useState, useCallback } from 'react';
import { apiService } from '@/lib/api';
import { 
  CreateOrganizationFormData, 
  UpdateOrganizationFormData, 
  OrganizationFilters,
  OrganizationStatusUpdate,
  ApiResponse 
} from '@/types';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (
    endpoint: string,
    requestOptions: RequestInit = {}
  ): Promise<ApiResponse<T> | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.authenticatedRequest<T>(endpoint, requestOptions);
      
      if (response.success) {
        setData(response.data || null);
        options.onSuccess?.(response.data);
      } else {
        throw new Error(response.error || 'Request failed');
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
      options.onFinally?.();
    }
  }, [options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

// Hook específico para POST requests
export function usePostApi<T = any>(options: UseApiOptions = {}) {
  const api = useApi<T>(options);

  const post = useCallback(async (
    endpoint: string,
    body: any
  ): Promise<ApiResponse<T> | null> => {
    return api.execute(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }, [api]);

  return {
    ...api,
    post,
  };
}

// Hook específico para GET requests
export function useGetApi<T = any>(options: UseApiOptions = {}) {
  const api = useApi<T>(options);

  const get = useCallback(async (
    endpoint: string
  ): Promise<ApiResponse<T> | null> => {
    return api.execute(endpoint, {
      method: 'GET',
    });
  }, [api]);

  return {
    ...api,
    get,
  };
}

// Hook específico para PUT requests
export function usePutApi<T = any>(options: UseApiOptions = {}) {
  const api = useApi<T>(options);

  const put = useCallback(async (
    endpoint: string,
    body: any
  ): Promise<ApiResponse<T> | null> => {
    return api.execute(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }, [api]);

  return {
    ...api,
    put,
  };
}

// Hook específico para DELETE requests
export function useDeleteApi<T = any>(options: UseApiOptions = {}) {
  const api = useApi<T>(options);

  const del = useCallback(async (
    endpoint: string
  ): Promise<ApiResponse<T> | null> => {
    return api.execute(endpoint, {
      method: 'DELETE',
    });
  }, [api]);

  return {
    ...api,
    delete: del,
  };
}

export function useOrganizations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOrganizations = useCallback(async (filters?: OrganizationFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getOrganizations(filters);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrganization = useCallback(async (uuid: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getOrganization(uuid);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrganization = useCallback(async (data: CreateOrganizationFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.createOrganization(data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrganization = useCallback(async (uuid: string, data: UpdateOrganizationFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.updateOrganization(uuid, data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrganizationStatus = useCallback(async (uuid: string, status: OrganizationStatusUpdate['status']) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.updateOrganizationStatus(uuid, status);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOrganization = useCallback(async (uuid: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.deleteOrganization(uuid);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    getOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    updateOrganizationStatus,
    deleteOrganization,
    clearError,
  };
}
