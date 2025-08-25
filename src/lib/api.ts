import { ApiResponse, LoginResponse, InviteMemberFormData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
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
    return this.request(`/auth/passwordless/verify?token=${token}`, {
      method: 'GET',
    });
  }

  async verifyPasswordlessCode(code: string): Promise<ApiResponse<LoginResponse>> {
    return this.request('/auth/passwordless/verify-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
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

  async getProfile(accessToken: string): Promise<ApiResponse> {
    return this.request('/auth/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // Organization members endpoints
  async inviteMember(
    data: InviteMemberFormData,
    accessToken: string
  ): Promise<ApiResponse> {
    return this.request('/organization-members/create-user-and-member', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
