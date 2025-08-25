import { ApiResponse, LoginResponse, InviteMemberFormData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private async getAccessToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private async getRefreshToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  private async setAccessToken(token: string): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  private async removeTokens(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.request<{ access_token: string; expires_in: number }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.success && response.data) {
        await this.setAccessToken(response.data.access_token);
        return response.data.access_token;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.removeTokens();
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Obtener token de acceso
    let accessToken = await this.getAccessToken();
    
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
        // Si es 401 y no hemos intentado renovar el token
        if (response.status === 401 && retryCount === 0) {
          // Si ya estamos renovando, agregar a la cola
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.request<T>(endpoint, options, retryCount + 1);
            });
          }

          this.isRefreshing = true;

          try {
            // Intentar renovar el token
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);
            
            // Reintentar la request original con el nuevo token
            return this.request<T>(endpoint, options, retryCount + 1);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }
        
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async requestPasswordlessLogin(email: string): Promise<ApiResponse> {
    return this.request('/auth/passwordless/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyPasswordlessToken(token: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>(`/auth/passwordless/verify?token=${token}`, {
      method: 'GET',
    });
  }

  async verifyPasswordlessCode(email: string, code: string): Promise<ApiResponse<LoginResponse>> {
    return this.request('/auth/passwordless/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ access_token: string; expires_in: number }>> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async logout(refreshToken?: string): Promise<ApiResponse> {
    const headers: Record<string, string> = {};
    if (refreshToken) {
      headers['x-refresh-token'] = refreshToken;
    }
    
    return this.request('/auth/logout', {
      method: 'POST',
      headers,
    });
  }

  async getProfile(): Promise<ApiResponse> {
    // Llamada real al endpoint de perfil
    // El token se incluye automáticamente en el header Authorization
    return this.request('/auth/profile', {
      method: 'GET',
    });
  }

  // Organization members endpoints
  async inviteMember(data: InviteMemberFormData): Promise<ApiResponse> {
    return this.request('/organization-members/create-user-and-member', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Método genérico para requests autenticadas
  async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, options);
  }
}

export const apiService = new ApiService();
