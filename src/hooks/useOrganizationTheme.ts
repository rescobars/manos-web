'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';

interface OrganizationThemeConfig {
  organization_uuid: string;
  theme_id: string;
  custom_logo_url?: string;
  custom_favicon_url?: string;
  custom_css?: string;
  is_active: boolean;
}

export function useOrganizationTheme() {
  const { theme, setTheme } = useTheme();
  const { currentOrganization } = useAuth();
  const [organizationTheme, setOrganizationTheme] = useState<OrganizationThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar tema de la organización cuando cambie
  useEffect(() => {
    if (currentOrganization) {
      loadOrganizationTheme(currentOrganization.uuid);
    } else {
      setOrganizationTheme(null);
    }
  }, [currentOrganization]);

  const loadOrganizationTheme = async (organizationUuid: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/organizations/${organizationUuid}/theme`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setOrganizationTheme(result.data);
          
          // Aplicar el tema si está especificado
          if (result.data.theme_id) {
            setTheme(result.data.theme_id);
          }
          
          // Aplicar CSS personalizado si existe
          if (result.data.custom_css) {
            applyCustomCSS(result.data.custom_css);
          }
          
          // Aplicar logo personalizado si existe
          if (result.data.custom_logo_url) {
            updateLogo(result.data.custom_logo_url);
          }
        } else {
          // Usar tema por defecto si no hay configuración
          setTheme('blue');
          setOrganizationTheme({
            organization_uuid: organizationUuid,
            theme_id: 'blue',
            is_active: true,
          });
        }
      } else {
        // Usar tema por defecto si hay error
        setTheme('blue');
        setOrganizationTheme({
          organization_uuid: organizationUuid,
          theme_id: 'blue',
          is_active: true,
        });
      }
    } catch (error) {
      console.error('Error loading organization theme:', error);
      setTheme('blue');
      setOrganizationTheme({
        organization_uuid: organizationUuid,
        theme_id: 'blue',
        is_active: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveOrganizationTheme = async (themeConfig: OrganizationThemeConfig) => {
    try {
      const response = await fetch(`/api/organizations/${themeConfig.organization_uuid}/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(themeConfig),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setOrganizationTheme(result.data);
          setTheme(themeConfig.theme_id);
        }
      } else {
        throw new Error('Error saving theme configuration');
      }
    } catch (error) {
      console.error('Error saving organization theme:', error);
      throw error;
    }
  };

  const applyCustomCSS = (css: string) => {
    if (typeof window !== 'undefined') {
      const existingStyle = document.getElementById('custom-org-css');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = 'custom-org-css';
      style.textContent = css;
      document.head.appendChild(style);
    }
  };

  const updateLogo = (logoUrl: string) => {
    if (typeof window !== 'undefined') {
      // Actualizar favicon
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = logoUrl;
      }
      
      // Actualizar logo en la aplicación (si existe)
      const logoElement = document.querySelector('[data-logo]') as HTMLImageElement;
      if (logoElement) {
        logoElement.src = logoUrl;
      }
    }
  };

  return {
    organizationTheme,
    isLoading,
    saveOrganizationTheme,
    applyCustomCSS,
    updateLogo,
    currentTheme: theme,
    setTheme,
  };
}
