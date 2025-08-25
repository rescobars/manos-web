'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, LoginResponse, User, Organization } from '@/types';
import { apiService } from '@/lib/api';

// Estado inicial
const initialState: AuthState = {
  user: null,
  organizations: [],
  defaultOrganization: null,
  currentOrganization: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
};

// Acciones
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: LoginResponse }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_SESSION'; payload: Partial<AuthState> }
  | { type: 'SET_CURRENT_ORGANIZATION'; payload: Organization };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        organizations: action.payload.organizations,
        defaultOrganization: action.payload.default_organization,
        currentOrganization: action.payload.default_organization,
        accessToken: action.payload.access_token,
        refreshToken: action.payload.refresh_token,
        isAuthenticated: true,
        isLoading: false,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    
    case 'UPDATE_SESSION':
      return {
        ...state,
        ...action.payload,
      };

    case 'SET_CURRENT_ORGANIZATION':
      return {
        ...state,
        currentOrganization: action.payload,
      };
    
    default:
      return state;
  }
}

// Contexto
interface AuthContextType extends AuthState {
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyToken: (token: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  setCurrentOrganization: (organization: Organization) => void;
  getCurrentOrganization: () => Organization | null;
  getOrganizationBySlug: (slug: string) => Organization | null;
  hasPermission: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (accessToken && refreshToken) {
        try {
          // Intentar obtener el perfil del usuario (ahora sin pasar token)
          const response = await apiService.getProfile();
          
          if (response.success && response.data) {
            // Token válido, restaurar sesión
            const data = response.data as any;
            
            // Extraer datos según la estructura real del endpoint
            const user = {
              uuid: data.uuid,
              email: data.email,
              name: data.name,
              status: data.status,
              created_at: data.created_at,
              updated_at: data.updated_at
            } as User;
            
            const organizations = data.session_data?.organizations as Organization[] || [];
            const defaultOrganization = organizations.find(org => org.uuid === data.session_data?.lastOrganizationUuid) || organizations[0];
            
            dispatch({
              type: 'UPDATE_SESSION',
              payload: {
                user,
                organizations,
                defaultOrganization,
                currentOrganization: defaultOrganization,
                accessToken,
                refreshToken,
                isAuthenticated: true,
                isLoading: false,
              },
            });
          } else {
            // Token inválido, intentar refresh
            await refreshAccessToken(refreshToken);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Limpiar tokens inválidos
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // Función para refrescar token
  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const response = await apiService.refreshToken(refreshToken);
      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.access_token);
        
        // Después de renovar el token, obtener el perfil completo
        const profileResponse = await apiService.getProfile();
        if (profileResponse.success && profileResponse.data) {
          const data = profileResponse.data as any;
          
          // Extraer datos según la estructura real del endpoint
          const user = {
            uuid: data.uuid,
            email: data.email,
            name: data.name,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at
          } as User;
          
          const organizations = data.session_data?.organizations as Organization[] || [];
          const defaultOrganization = organizations.find(org => org.uuid === data.session_data?.lastOrganizationUuid) || organizations[0];
          
          dispatch({
            type: 'UPDATE_SESSION',
            payload: {
              user,
              organizations,
              defaultOrganization,
              currentOrganization: defaultOrganization,
              accessToken: response.data.access_token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            },
          });
        } else {
          throw new Error('Failed to get profile after token refresh');
        }
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Función de login
  const login = async (email: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiService.requestPasswordlessLogin(email);
      if (response.success) {
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Función de verificación de token
  const verifyToken = async (token: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiService.verifyPasswordlessToken(token);
      if (response.success && response.data) {
        // Guardar tokens en localStorage
        localStorage.setItem('accessToken', response.data.access_token);
        localStorage.setItem('refreshToken', response.data.refresh_token);
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      } else {
        throw new Error(response.error || 'Token verification failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Función de verificación de código
  const verifyCode = async (email: string, code: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiService.verifyPasswordlessCode(email, code);
      if (response.success && response.data) {
        // Guardar tokens en localStorage
        localStorage.setItem('accessToken', response.data.access_token);
        localStorage.setItem('refreshToken', response.data.refresh_token);
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      } else {
        throw new Error(response.error || 'Code verification failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      if (state.refreshToken) {
        await apiService.logout(state.refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
      
      // Redirigir a login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  // Función para cambiar la organización actual
  const setCurrentOrganization = (organization: Organization) => {
    dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: organization });
  };

  // Función para obtener la organización actual
  const getCurrentOrganization = (): Organization | null => {
    return state.currentOrganization;
  };

  // Función para obtener organización por slug
  const getOrganizationBySlug = (slug: string): Organization | null => {
    return state.organizations.find(org => org.slug === slug) || null;
  };

  // Función para verificar permisos
  const hasPermission = (module: string, action: string): boolean => {
    if (!state.currentOrganization) return false;
    
    const permissions = state.currentOrganization.permissions;
    const modulePermissions = permissions[module as keyof typeof permissions];
    
    if (!modulePermissions || typeof modulePermissions !== 'object') {
      return false;
    }
    
    return (modulePermissions as any)[action] === true;
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    verifyToken,
    verifyCode,
    setCurrentOrganization,
    getCurrentOrganization,
    getOrganizationBySlug,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
