import { useState, useCallback } from 'react';
import { Order, OrderStatus } from '@/types';

interface OrderFilters {
  status?: string;
  search?: string;
  createdAfter?: string;
  createdBefore?: string;
  minAmount?: number;
  maxAmount?: number;
  pickupLat?: number;
  pickupLon?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // Para contadores KPI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | undefined>(undefined);

  // Función para obtener todos los pedidos (para contadores KPI)
  const fetchAllOrders = useCallback(async (organizationId: string) => {
    try {
      const apiUrl = '/api/orders/organization/' + organizationId + '?limit=1000';
      
      // Obtener el token de autorización del localStorage
      const token = localStorage.getItem('accessToken');

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': organizationId,
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        setAllOrders(result.data);
      }
    } catch (err) {
      console.error('Error loading all orders for counters:', err);
    }
  }, []);

  // Función para obtener pedidos con filtros y paginación
  const fetchOrders = useCallback(async (organizationId: string, filters?: OrderFilters): Promise<OrdersResponse> => {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      let apiUrl = '/api/orders/organization/' + organizationId;
      const queryParams = new URLSearchParams();
      
      // Solo enviar status si no es "all"
      if (filters?.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.createdAfter) queryParams.append('created_after', filters.createdAfter);
      if (filters?.createdBefore) queryParams.append('created_before', filters.createdBefore);
      if (filters?.minAmount) queryParams.append('min_amount', filters.minAmount.toString());
      if (filters?.maxAmount) queryParams.append('max_amount', filters.maxAmount.toString());
      if (filters?.pickupLat) queryParams.append('pickup_lat', filters.pickupLat.toString());
      if (filters?.pickupLon) queryParams.append('pickup_lon', filters.pickupLon.toString());
      if (filters?.radius) queryParams.append('radius', filters.radius.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.sortBy) queryParams.append('sort_by', filters.sortBy);
      if (filters?.sortOrder) queryParams.append('sort_order', filters.sortOrder);
      
      if (queryParams.toString()) {
        apiUrl += `?${queryParams.toString()}`;
      }

      // Obtener el token de autorización del localStorage
      const token = localStorage.getItem('accessToken');

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': organizationId,
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const result: OrdersResponse = await response.json();

      if (result.success && result.data) {
        setOrders(result.data);
        setPagination(result.pagination);
        setError(null);
      } else {
        setError(result.message || 'Error al obtener los pedidos');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
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
    orders,
    allOrders,
    loading,
    error,
    pagination,
    fetchOrders,
    fetchAllOrders,
    clearError,
  };
}
