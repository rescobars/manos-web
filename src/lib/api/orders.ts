import { ApiResponse, Order, CreateOrderFormData, UpdateOrderFormData, BulkCreateOrderData, OrderFilters, OrderStatus } from '@/types';

const API_BASE_URL = '/api';

class OrdersApiService {
  private async getAccessToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const accessToken = await this.getAccessToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || data.message || data.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      console.error('Orders API Error:', error);
      throw error;
    }
  }

  // Crear un nuevo pedido
  async createOrder(data: CreateOrderFormData): Promise<ApiResponse<Order>> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Crear múltiples pedidos (bulk)
  async createBulkOrders(data: BulkCreateOrderData): Promise<ApiResponse<Order[]>> {
    return this.request<Order[]>('/orders/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Obtener todos los pedidos de una organización
  async getOrganizationOrders(organizationUuid: string, filters?: OrderFilters): Promise<ApiResponse<Order[]>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request<Order[]>(`/orders/organization/${organizationUuid}${queryParams}`, {
      method: 'GET',
    });
  }

  // Obtener pedidos pendientes de una organización
  async getPendingOrders(organizationUuid: string): Promise<ApiResponse<Order[]>> {
    return this.request<Order[]>(`/orders/organization/${organizationUuid}/pending`, {
      method: 'GET',
    });
  }

  // Obtener un pedido específico por UUID
  async getOrder(uuid: string): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/orders/${uuid}`, {
      method: 'GET',
    });
  }

  // Actualizar un pedido
  async updateOrder(uuid: string, data: UpdateOrderFormData): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/orders/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Eliminar un pedido
  async deleteOrder(uuid: string): Promise<ApiResponse> {
    return this.request(`/orders/${uuid}`, {
      method: 'DELETE',
    });
  }

  // Actualizar el estado de un pedido
  async updateOrderStatus(uuid: string, status: OrderStatus): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/orders/${uuid}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Obtener todos los pedidos (para admin platform)
  async getAllOrders(filters?: OrderFilters): Promise<ApiResponse<Order[]>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request<Order[]>(`/orders${queryParams}`, {
      method: 'GET',
    });
  }
}

export const ordersApiService = new OrdersApiService();
