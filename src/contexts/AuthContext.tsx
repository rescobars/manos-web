'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, LoginResponse, User } from '@/types';
import { apiService } from '@/lib/api';

// Estado inicial
const initialState: AuthState = {
  user: null,
  sessionData: null,
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
  | { type: 'UPDATE_SESSION'; payload: Partial<AuthState> };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        sessionData: action.payload.session_data,
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
    
    default:
      return state;
  }
}

// Contexto
interface AuthContextType extends AuthState {
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyToken: (token: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar token al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (accessToken && refreshToken) {
        try {
          // Intentar obtener el perfil del usuario
          const response = await apiService.getProfile(accessToken);
          if (response.success) {
            // Token válido, restaurar sesión
            const user = response.data as User;
            const sessionData = (response.data as any).session_data;
            dispatch({
              type: 'UPDATE_SESSION',
              payload: {
                user,
                sessionData,
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
        dispatch({
          type: 'UPDATE_SESSION',
          payload: {
            accessToken: response.data.access_token,
            isAuthenticated: true,
            isLoading: false,
          },
        });
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Función de login
  const login = async (email: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiService.requestPasswordlessLogin(email);
      if (response.success) {
        // El login passwordless envía un email, no retorna tokens inmediatamente
        // Los tokens se obtienen cuando el usuario verifica el token del email
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
  const verifyCode = async (code: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiService.verifyPasswordlessCode(code);
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
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    verifyToken,
    verifyCode,
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
