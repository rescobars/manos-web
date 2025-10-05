'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useLayoutEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { DynamicThemeColors, OrganizationThemeConfig, OrganizationBranding } from './DynamicThemeContext';
import { movigoTheme } from '@/lib/themes/organizationThemes';

// Tipos para el modo de tema
type ThemeMode = 'light' | 'dark' | 'system';

// Contexto unificado que combina dark/light mode con themes de organización
interface UnifiedThemeContextType {
  // Mode management (light/dark)
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: 'light' | 'dark'; // El modo real después de resolver 'system'
  
  // Organization theme management
  organizationTheme: OrganizationThemeConfig | null;
  setOrganizationTheme: (theme: OrganizationThemeConfig | null) => void;
  
  // Branding
  branding: OrganizationBranding | null;
  setBranding: (branding: OrganizationBranding | null) => void;
  
  // Computed values
  currentColors: DynamicThemeColors;
  isLoading: boolean;
  error: string | null;
  themeReady: boolean;
  
  // Actions
  loadOrganizationTheme: (organizationUuid: string) => Promise<void>;
  updateTheme: (newConfig: OrganizationThemeConfig) => void;
  updateBranding: (newBranding: OrganizationBranding) => void;
  resetToDefault: () => void;
  
  // Utilities
  getColor: (colorKey: keyof DynamicThemeColors, fallback?: string) => string;
  applyThemeToElement: (element: HTMLElement, styles: Record<string, string>) => void;
}

const UnifiedThemeContext = createContext<UnifiedThemeContextType | undefined>(undefined);

// Hook para detectar preferencia del sistema
function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return systemTheme;
}

// Función para aplicar modo oscuro a los colores
function applyDarkMode(colors: DynamicThemeColors): DynamicThemeColors {
  return {
    // Invertir backgrounds
    background1: colors.background1 === '#ffffff' ? '#000000' : colors.background1,
    background2: colors.background2 === '#f8fafc' ? '#111111' : colors.background2,
    background3: colors.background3 === '#ffffff' ? '#1a1a1a' : colors.background3,
    
    // Mantener colores de botones pero ajustar si es necesario
    buttonPrimary1: colors.buttonPrimary1,
    buttonPrimary2: colors.buttonPrimary2,
    buttonPrimary3: colors.buttonPrimary3,
    buttonSecondary1: colors.background2, // Usar background2 para secondary en dark
    buttonSecondary2: colors.background1, // Usar background1 para secondary hover en dark
    buttonHover: colors.buttonHover,
    buttonActive: colors.buttonActive,
    buttonText: colors.buttonText,
    buttonTextHover: colors.buttonTextHover,
    
    // Ajustar tablas para dark mode
    tableHeader: colors.tableHeader,
    tableRow: colors.background1,
    tableRowHover: colors.background2,
    tableBorder: colors.border,
    
    // Ajustar menús
    menuBackground1: colors.background1,
    menuBackground2: colors.background2,
    menuItemHover: colors.background3,
    
    // Headers y sidebars
    headerBackground: colors.headerBackground === '#ffffff' ? '#000000' : colors.headerBackground,
    headerText: colors.headerText === '#14532d' ? '#ffffff' : colors.headerText,
    headerBorder: colors.headerBorder,
    sidebarBackground: colors.background2,
    sidebarText: colors.headerText === '#14532d' ? '#ffffff' : colors.sidebarText,
    sidebarBorder: colors.sidebarBorder,
    sidebarItemHover: colors.background3,
    sidebarItemActive: colors.sidebarItemActive,
    
    // Invertir textos si son muy oscuros
    textPrimary: colors.textPrimary === '#14532d' ? '#ffffff' : colors.textPrimary,
    textSecondary: colors.textSecondary === '#166534' ? '#d1d5db' : colors.textSecondary,
    textMuted: colors.textMuted === '#4ade80' ? '#9ca3af' : colors.textMuted,
    
    // Mantener bordes y estados
    border: colors.border,
    divider: colors.divider,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  };
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export function UnifiedThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useAuth();
  const systemTheme = useSystemTheme();
  
  // State
  const [mode, setMode] = useState<ThemeMode>('light');
  const [organizationTheme, setOrganizationTheme] = useState<OrganizationThemeConfig | null>(null);
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Iniciar como loading
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [themeReady, setThemeReady] = useState(false); // Nuevo estado para controlar cuando el theme está listo

  // Manejar hidratación
  useEffect(() => {
    setMounted(true);
    // Restaurar modo desde localStorage si existe
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      setMode(savedMode);
    } else {
      setMode('system');
    }
  }, []);

  // Guardar modo en localStorage cuando cambie
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme-mode', mode);
    }
  }, [mode, mounted]);

  // Resolver el modo actual
  const resolvedMode = mode === 'system' ? systemTheme : mode;

  // Calcular colores actuales
  const currentColors = useMemo(() => {
    const baseColors = organizationTheme?.colors || movigoTheme;
    return resolvedMode === 'dark' ? applyDarkMode(baseColors) : baseColors;
  }, [organizationTheme, resolvedMode]);

  // Mapeo de variables CSS
  const cssVarMap: Record<keyof DynamicThemeColors, string> = useMemo(() => ({
    background1: '--theme-background-1',
    background2: '--theme-background-2',
    background3: '--theme-background-3',
    buttonPrimary1: '--theme-button-primary-1',
    buttonPrimary2: '--theme-button-primary-2',
    buttonPrimary3: '--theme-button-primary-3',
    buttonSecondary1: '--theme-button-secondary-1',
    buttonSecondary2: '--theme-button-secondary-2',
    buttonHover: '--theme-button-hover',
    buttonActive: '--theme-button-active',
    buttonText: '--theme-button-text',
    buttonTextHover: '--theme-button-text-hover',
    tableHeader: '--theme-table-header',
    tableRow: '--theme-table-row',
    tableRowHover: '--theme-table-row-hover',
    tableBorder: '--theme-table-border',
    menuBackground1: '--theme-menu-background-1',
    menuBackground2: '--theme-menu-background-2',
    menuItemHover: '--theme-menu-item-hover',
    headerBackground: '--theme-header-background',
    headerText: '--theme-header-text',
    headerBorder: '--theme-header-border',
    sidebarBackground: '--theme-sidebar-background',
    sidebarText: '--theme-sidebar-text',
    sidebarBorder: '--theme-sidebar-border',
    sidebarItemHover: '--theme-sidebar-item-hover',
    sidebarItemActive: '--theme-sidebar-item-active',
    textPrimary: '--theme-text-primary',
    textSecondary: '--theme-text-secondary',
    textMuted: '--theme-text-muted',
    border: '--theme-border',
    divider: '--theme-divider',
    success: '--theme-success',
    warning: '--theme-warning',
    error: '--theme-error',
    info: '--theme-info',
  }), []);

  // Función optimizada para aplicar tema al documento
  const applyThemeToDocument = useCallback(
    debounce((themeColors: DynamicThemeColors) => {
      if (typeof window === 'undefined') return;

      requestAnimationFrame(() => {
        const root = document.documentElement;
        
        // Aplicar variables CSS
        Object.entries(themeColors).forEach(([key, value]) => {
          const cssVarName = cssVarMap[key as keyof DynamicThemeColors];
          if (cssVarName && value) {
            root.style.setProperty(cssVarName, value);
          }
        });

        // Aplicar clase de modo
        root.classList.remove('light', 'dark');
        root.classList.add(resolvedMode);
        
        // Aplicar al body también para compatibilidad
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(resolvedMode);
      });
    }, 16), // ~60fps
    [cssVarMap, resolvedMode]
  );

  // Aplicar tema cuando cambian los colores (solo si está montado)
  useLayoutEffect(() => {
    if (mounted) {
      applyThemeToDocument(currentColors);
      setThemeReady(true); // Marcar como listo después de aplicar
      
      // Marcar HTML como cargado para mostrar contenido
      if (typeof window !== 'undefined') {
        document.documentElement.classList.add('theme-loaded');
      }
    }
  }, [currentColors, applyThemeToDocument, mounted]);

  // Aplicar tema inicial inmediatamente para evitar flash
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      // Aplicar tema por defecto inmediatamente
      applyThemeToDocument(movigoTheme);
    }
  }, []);

  // Cargar tema de organización cuando cambia
  useEffect(() => {
    if (currentOrganization) {
      loadOrganizationTheme(currentOrganization.uuid);
    } else {
      setOrganizationTheme(null);
      setBranding(null);
    }
  }, [currentOrganization]);

  // Función para cargar tema de organización
  const loadOrganizationTheme = async (organizationUuid: string) => {
    setIsLoading(true);
    setError(null);
    setThemeReady(false); // Marcar como no listo durante la carga
    
    try {
      const response = await fetch(`/api/organizations/public/${organizationUuid}`);
      const organizationData = await response.json();
      
      if (response.ok && organizationData.success) {
        const { theme_config, branding: orgBranding } = organizationData.data;
        
        if (theme_config && theme_config.colors) {
          const themeConfig: OrganizationThemeConfig = {
            organization_uuid: organizationUuid,
            theme_name: theme_config.theme_name || 'Tema Personalizado',
            colors: theme_config.colors,
            is_active: theme_config.metadata?.is_active ?? true,
            created_at: theme_config.metadata?.created_at,
            updated_at: theme_config.metadata?.updated_at,
          };
          
          setOrganizationTheme(themeConfig);
          
          if (orgBranding) {
            setBranding(orgBranding);
            applyBrandingToDocument(orgBranding);
          }
        } else {
          // Usar tema por defecto
          const defaultThemeConfig: OrganizationThemeConfig = {
            organization_uuid: organizationUuid,
            theme_name: 'Movigo - Moderno',
            colors: movigoTheme,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          setOrganizationTheme(defaultThemeConfig);
        }
      } else {
        throw new Error(organizationData.error || 'Error al obtener información de la organización');
      }
      
    } catch (err) {
      console.error('Error loading organization theme:', err);
      setError('Error al cargar el tema de la organización');
      
      // Fallback al tema por defecto
      const defaultThemeConfig: OrganizationThemeConfig = {
        organization_uuid: organizationUuid,
        theme_name: 'Movigo - Moderno',
        colors: movigoTheme,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setOrganizationTheme(defaultThemeConfig);
    } finally {
      setIsLoading(false);
    }
  };

  // Aplicar branding al documento
  const applyBrandingToDocument = (branding: OrganizationBranding) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Aplicar logo
    if (branding.logo_url) {
      root.style.setProperty('--organization-logo', `url(${branding.logo_url})`);
    } else {
      root.style.removeProperty('--organization-logo');
    }
    
    // Aplicar favicon
    if (branding.favicon_url) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = branding.favicon_url;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = branding.favicon_url;
        document.head.appendChild(newFavicon);
      }
    }
    
    // Aplicar fuentes
    if (branding.primary_font) {
      root.style.setProperty('--primary-font', branding.primary_font);
    }
    
    if (branding.secondary_font) {
      root.style.setProperty('--secondary-font', branding.secondary_font);
    }
  };

  // Funciones de utilidad
  const updateTheme = (newConfig: OrganizationThemeConfig) => {
    setOrganizationTheme(newConfig);
  };

  const updateBranding = (newBranding: OrganizationBranding) => {
    setBranding(newBranding);
    applyBrandingToDocument(newBranding);
  };

  const resetToDefault = () => {
    if (currentOrganization) {
      const defaultConfig: OrganizationThemeConfig = {
        organization_uuid: currentOrganization.uuid,
        theme_name: 'Movigo - Moderno',
        colors: movigoTheme,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      updateTheme(defaultConfig);
    }
  };

  const getColor = (colorKey: keyof DynamicThemeColors, fallback?: string) => {
    return currentColors[colorKey] || fallback || '#000000';
  };

  const applyThemeToElement = (element: HTMLElement, styles: Record<string, string>) => {
    Object.entries(styles).forEach(([property, value]) => {
      element.style.setProperty(property, value);
    });
  };

  const value: UnifiedThemeContextType = {
    mode,
    setMode,
    resolvedMode,
    organizationTheme,
    setOrganizationTheme,
    branding,
    setBranding,
    currentColors,
    isLoading,
    error,
    themeReady,
    loadOrganizationTheme,
    updateTheme,
    updateBranding,
    resetToDefault,
    getColor,
    applyThemeToElement,
  };

  return (
    <UnifiedThemeContext.Provider value={value}>
      {children}
    </UnifiedThemeContext.Provider>
  );
}

export function useUnifiedTheme() {
  const context = useContext(UnifiedThemeContext);
  if (context === undefined) {
    throw new Error('useUnifiedTheme must be used within a UnifiedThemeProvider');
  }
  return context;
}

// Hook de compatibilidad con el sistema anterior
export function useDynamicTheme() {
  const context = useUnifiedTheme();
  
  return {
    themeConfig: context.organizationTheme,
    colors: context.currentColors,
    branding: context.branding,
    isLoading: context.isLoading,
    error: context.error,
    useDefaultTheme: false, // Deprecated
    updateTheme: context.updateTheme,
    updateBranding: context.updateBranding,
    toggleThemeMode: () => {
      // Toggle between light and dark
      context.setMode(context.resolvedMode === 'light' ? 'dark' : 'light');
    },
    resetToDefault: context.resetToDefault,
    getColor: context.getColor,
  };
}
