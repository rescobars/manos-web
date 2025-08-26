// Tipos para la aplicación web basados en el response del backend

export interface User {
  uuid: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Permisos específicos por módulo
export interface ModulePermissions {
  read?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  assign?: boolean;
  cancel?: boolean;
  refund?: boolean;
  schedule?: boolean;
  track?: boolean;
  block?: boolean;
  verify?: boolean;
  export?: boolean;
  invite?: boolean;
  remove?: boolean;
  assign_roles?: boolean;
  suspend?: boolean;
  activate?: boolean;
  reset_password?: boolean;
  backup?: boolean;
  restore?: boolean;
  maintenance?: boolean;
  audit?: boolean;
  block_ip?: boolean;
  whitelist?: boolean;
  analyze?: boolean;
  send?: boolean;
  migrate?: boolean;
}

// Permisos completos del usuario
export interface UserPermissions {
  logs?: ModulePermissions;
  users?: ModulePermissions;
  system?: ModulePermissions;
  members?: ModulePermissions;
  security?: ModulePermissions;
  notifications?: ModulePermissions;
  organizations?: ModulePermissions;
  orders?: ModulePermissions;
  drivers?: ModulePermissions;
  customers?: ModulePermissions;
  reports?: ModulePermissions;
  settings?: ModulePermissions;
  billing?: ModulePermissions;
  analytics?: ModulePermissions;
}

export interface Role {
  uuid: string;
  name: 'PLATFORM_ADMIN' | 'OWNER' | 'DRIVER' | 'VIEWER';
  description: string;
  permissions: UserPermissions;
}

export interface Organization {
  uuid: string;
  name: string;
  slug: string;
  description: string;
  domain: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  status: string;
  plan_type: string;
  subscription_expires_at: string;
  roles: Role[];
  permissions: UserPermissions;
  member_since: string;
  is_owner: boolean;
  is_admin: boolean;
}

export interface SessionData {
  organizations: Organization[];
  preferences: Record<string, unknown>;
  lastOrganizationUuid?: string;
  total_organizations: number;
}

// Response exacto del backend
export interface LoginResponse {
  user: User;
  organizations: Organization[];
  default_organization: Organization;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Estado de autenticación en el frontend
export interface AuthState {
  user: User | null;
  organizations: Organization[];
  defaultOrganization: Organization | null;
  currentOrganization: Organization | null;
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
  organization_uuid?: string;
}

// Tipos para la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipos para el management de organizaciones
export interface CreateOrganizationFormData {
  name: string;
  slug: string;
  description: string;
  domain?: string;
  logo_url: string;
  website_url?: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan_type: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  subscription_expires_at: string;
}

export interface UpdateOrganizationFormData {
  name?: string;
  slug?: string;
  description?: string;
  domain?: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan_type?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  subscription_expires_at?: string;
}

export interface OrganizationFilters {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan_type?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  search?: string;
}

export interface OrganizationStatusUpdate {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}
