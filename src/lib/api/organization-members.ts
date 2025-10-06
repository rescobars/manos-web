import { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface Driver {
  user_uuid: string;
  email: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  member_since: string;
  organization_membership_uuid: string;
  roles: Array<{
    role_name: string;
  }>;
}

class OrganizationMembersApiService {
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
      console.error('Organization Members API Error:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios de una organización con un rol específico
  async getOrganizationUsers(organizationUuid: string, role?: string): Promise<ApiResponse<Driver[]>> {
    const queryParams = role ? `?role=${role}` : '';
    return this.request<Driver[]>(`/organization-members/organization/${organizationUuid}/users${queryParams}`, {
      method: 'GET',
    });
  }

  // Obtener drivers de una organización
  async getDrivers(organizationUuid: string): Promise<ApiResponse<Driver[]>> {
    return this.getOrganizationUsers(organizationUuid, 'DRIVER');
  }

  // Obtener todos los miembros de una organización
  async getOrganizationMembers(organizationUuid: string): Promise<ApiResponse<Driver[]>> {
    return this.getOrganizationUsers(organizationUuid);
  }

  // Asignar ruta a un driver
  async assignRouteToDriver(
    routeUuid: string, 
    membershipUuid: string, 
    assignmentData: {
      start_time: string;
      end_time: string;
      driver_notes?: string;
      driver_instructions?: Record<string, any>;
    },
    organizationId?: string
  ): Promise<ApiResponse> {
    const headers: Record<string, string> = {};
    if (organizationId) {
      headers['organization-id'] = organizationId;
    }
    
    return this.request(`/route-drivers/assign/${routeUuid}/${membershipUuid}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(assignmentData),
    });
  }
}

export const organizationMembersApiService = new OrganizationMembersApiService();
