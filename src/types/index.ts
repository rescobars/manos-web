// Tipos para la aplicación web
export interface User {
  id: number;
  uuid: string;
  email: string;
  name: string;
  status: string;
}

export interface SessionData {
  organizations: Organization[];
  preferences: Record<string, unknown>;
  lastOrganizationId?: number;
}

export interface Organization {
  id: number;
  name: string;
  roles: string[];
  permissions: Record<string, unknown>;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  session_data: SessionData;
}

export interface AuthState {
  user: User | null;
  sessionData: SessionData | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Tipos para formularios
export interface LoginFormData {
  email: string;
}

export interface InviteMemberFormData {
  email: string;
  name: string;
  title?: string;
  roles: string[];
  organization_id?: number;
}

// Tipos para la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
