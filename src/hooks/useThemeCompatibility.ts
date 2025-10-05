'use client';

// Hooks de compatibilidad para mantener la funcionalidad existente
// mientras migramos gradualmente al nuevo sistema

import { useTheme, useThemeMode, useThemeColors } from './useTheme';
import { useDynamicTheme as useUnifiedDynamicTheme } from '@/contexts/UnifiedThemeContext';

// Compatibilidad con useThemeClasses
export function useThemeClasses() {
  const { resolvedMode } = useTheme();
  
  return {
    theme: resolvedMode,
    mounted: true, // Siempre mounted en el nuevo sistema
  };
}

// Compatibilidad con useDynamicTheme (mantiene la API original)
export function useDynamicTheme() {
  return useUnifiedDynamicTheme();
}

// Compatibilidad con useOrganizationTheme
export function useOrganizationTheme() {
  const { 
    organizationTheme, 
    updateTheme, 
    isLoading,
    resolvedMode,
    setMode 
  } = useTheme();
  
  const saveOrganizationTheme = async (themeConfig: any) => {
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
          updateTheme(result.data);
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
    currentTheme: resolvedMode,
    setTheme: setMode,
  };
}

// Re-export de hooks principales para mantener compatibilidad
export { useTheme } from './useTheme';
export { useThemeMode } from './useTheme';
export { useThemeColors } from './useTheme';
export { useBranding } from './useTheme';
