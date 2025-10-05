import { useState, useEffect } from 'react';

interface OrganizationThemeConfig {
  organization_uuid: string;
  theme_name: string;
  colors: {
    background1: string;
    background2: string;
    background3: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    buttonPrimary1: string;
    buttonText: string;
    success: string;
    warning: string;
    error: string;
    divider: string;
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface OrganizationBranding {
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface PublicOrganizationData {
  theme_config?: OrganizationThemeConfig;
  branding?: OrganizationBranding;
}

// Colores por defecto para páginas públicas
const defaultColors = {
  background1: '#ffffff',
  background2: '#f8fafc',
  background3: '#f1f5f9',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  buttonPrimary1: '#3b82f6',
  buttonText: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  divider: '#f3f4f6'
};

export function usePublicOrganizationTheme(orgUuid: string | null) {
  const [colors, setColors] = useState(defaultColors);
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgUuid) {
      setColors(defaultColors);
      setBranding(null);
      setIsLoading(false);
      return;
    }

    loadOrganizationTheme(orgUuid);
  }, [orgUuid]);

  const loadOrganizationTheme = async (organizationUuid: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/organizations/public/${organizationUuid}`);
      const organizationData = await response.json();
      
      if (response.ok && organizationData.success) {
        const { theme_config, branding: orgBranding } = organizationData.data;
        
        if (theme_config && theme_config.colors) {
          // Usar colores de la organización
          setColors(theme_config.colors);
          
          // Aplicar branding si está disponible
          if (orgBranding) {
            setBranding(orgBranding);
            applyBrandingToDocument(orgBranding);
          }
        } else {
          // Usar colores por defecto si no hay configuración
          setColors(defaultColors);
        }
      } else {
        // Usar colores por defecto si hay error
        setColors(defaultColors);
        setError(organizationData.error || 'Error al cargar el tema de la organización');
      }
    } catch (err) {
      console.error('Error loading organization theme:', err);
      setColors(defaultColors);
      setError('Error de conexión al cargar el tema');
    } finally {
      setIsLoading(false);
    }
  };

  const applyBrandingToDocument = (branding: OrganizationBranding) => {
    if (typeof window === 'undefined') return;

    // Aplicar favicon si está disponible
    if (branding.favicon_url) {
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.setAttribute('href', branding.favicon_url);
      } else {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.href = branding.favicon_url;
        document.head.appendChild(favicon);
      }
    }

    // Aplicar colores personalizados si están disponibles
    if (branding.primary_color || branding.secondary_color) {
      const root = document.documentElement;
      
      if (branding.primary_color) {
        root.style.setProperty('--organization-primary', branding.primary_color);
      }
      
      if (branding.secondary_color) {
        root.style.setProperty('--organization-secondary', branding.secondary_color);
      }
    }
  };

  return {
    colors,
    branding,
    isLoading,
    error,
    reload: () => orgUuid ? loadOrganizationTheme(orgUuid) : null
  };
}
