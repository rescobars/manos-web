'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getThemeByOrganizationUuid, movigoTheme } from '@/lib/themes/organizationThemes';

// Definición de la estructura de colores para el tema dinámico
export interface DynamicThemeColors {
  // Backgrounds
  background1: string;        // Fondo principal
  background2: string;        // Fondo secundario
  background3: string;        // Fondo de tarjetas/paneles
  
  // Botones
  buttonPrimary1: string;     // Botón primario principal
  buttonPrimary2: string;     // Botón primario hover
  buttonPrimary3: string;     // Botón primario activo
  buttonSecondary1: string;   // Botón secundario
  buttonSecondary2: string;   // Botón secundario hover
  buttonHover: string;        // Color de hover general para botones
  buttonActive: string;       // Color de activo general para botones
  buttonText: string;         // Color de texto para botones
  buttonTextHover: string;    // Color de texto en hover
  
  // Tablas
  tableHeader: string;        // Fondo del header de tabla
  tableRow: string;           // Fondo de fila de tabla
  tableRowHover: string;      // Fondo de fila al hacer hover
  tableBorder: string;        // Borde de tabla
  
  // Menús
  menuBackground1: string;    // Fondo del menú principal
  menuBackground2: string;    // Fondo de submenús
  menuItemHover: string;      // Fondo de item de menú al hover
  
  // Header/Navbar específico
  headerBackground: string;   // Fondo de la barra superior
  headerText: string;         // Texto de la barra superior
  headerBorder: string;       // Borde de la barra superior
  
  // Sidebar específico
  sidebarBackground: string;  // Fondo del sidebar
  sidebarText: string;        // Texto del sidebar
  sidebarBorder: string;      // Borde del sidebar
  sidebarItemHover: string;   // Hover de items del sidebar
  sidebarItemActive: string;  // Item activo del sidebar
  
  // Textos
  textPrimary: string;        // Texto principal
  textSecondary: string;      // Texto secundario
  textMuted: string;          // Texto atenuado
  
  // Bordes y divisores
  border: string;             // Borde general
  divider: string;            // Divisor
  
  // Estados
  success: string;            // Color de éxito
  warning: string;            // Color de advertencia
  error: string;              // Color de error
  info: string;               // Color de información
}

// Configuración completa del tema de la organización
export interface OrganizationThemeConfig {
  organization_uuid: string;
  theme_name: string;
  colors: DynamicThemeColors;
  colors_dark?: DynamicThemeColors; // Tema dark personalizado de la organización
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Configuración de branding
export interface OrganizationBranding {
  logo_url?: string | null;
  favicon_url?: string | null;
  primary_font?: string;
  secondary_font?: string;
}

// Estructura completa de la organización con tema y branding
export interface OrganizationWithTheme {
  uuid: string;
  name: string;
  slug: string;
  theme_config: {
    theme_name: string;
    theme_version?: string;
    colors: DynamicThemeColors;
    metadata?: {
      created_at?: string;
      updated_at?: string;
      created_by?: string;
      is_default?: boolean;
      is_active?: boolean;
    };
  };
  branding: OrganizationBranding;
}

// Tema Movigo por defecto
const defaultMovigoTheme: DynamicThemeColors = movigoTheme;

// Tema verde por defecto (mantenido para compatibilidad)
const defaultGreenTheme: DynamicThemeColors = {
  // Backgrounds
  background1: '#f0fdf4',      // Verde muy claro
  background2: '#dcfce7',      // Verde claro
  background3: '#ffffff',      // Blanco
  
  // Botones
  buttonPrimary1: '#16a34a',   // Verde principal
  buttonPrimary2: '#15803d',   // Verde hover
  buttonPrimary3: '#166534',   // Verde activo
  buttonSecondary1: '#f0fdf4', // Verde muy claro
  buttonSecondary2: '#dcfce7', // Verde claro
  buttonHover: '#15803d',      // Verde hover general
  buttonActive: '#166534',     // Verde activo general
  buttonText: '#ffffff',       // Texto blanco para botones
  buttonTextHover: '#ffffff',  // Texto blanco en hover
  
  // Tablas
  tableHeader: '#16a34a',      // Verde principal
  tableRow: '#ffffff',         // Blanco
  tableRowHover: '#f0fdf4',    // Verde muy claro
  tableBorder: '#bbf7d0',      // Verde claro
  
  // Menús
  menuBackground1: '#ffffff',  // Blanco
  menuBackground2: '#f0fdf4',  // Verde muy claro
  menuItemHover: '#dcfce7',    // Verde claro
  
  // Header/Navbar específico
  headerBackground: '#ffffff', // Blanco
  headerText: '#14532d',       // Verde muy oscuro
  headerBorder: '#bbf7d0',     // Verde claro
  
  // Sidebar específico
  sidebarBackground: '#f8fafc', // Gris muy claro
  sidebarText: '#14532d',       // Verde muy oscuro
  sidebarBorder: '#bbf7d0',     // Verde claro
  sidebarItemHover: '#dcfce7',  // Verde claro
  sidebarItemActive: '#16a34a', // Verde principal
  
  // Textos
  textPrimary: '#14532d',      // Verde muy oscuro
  textSecondary: '#166534',    // Verde oscuro
  textMuted: '#4ade80',        // Verde medio
  
  // Bordes y divisores
  border: '#bbf7d0',           // Verde claro
  divider: '#dcfce7',          // Verde claro
  
  // Estados
  success: '#16a34a',          // Verde principal
  warning: '#eab308',          // Amarillo
  error: '#dc2626',            // Rojo
  info: '#0ea5e9',             // Azul
};

interface DynamicThemeContextType {
  themeConfig: OrganizationThemeConfig | null;
  colors: DynamicThemeColors;
  branding: OrganizationBranding | null;
  isLoading: boolean;
  error: string | null;
  useDefaultTheme: boolean;
  updateTheme: (newConfig: OrganizationThemeConfig) => void;
  updateBranding: (newBranding: OrganizationBranding) => void;
  toggleThemeMode: () => void;
  resetToDefault: () => void;
}

const DynamicThemeContext = createContext<DynamicThemeContextType | undefined>(undefined);

export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useAuth();
  const [themeConfig, setThemeConfig] = useState<OrganizationThemeConfig | null>(null);
  const [colors, setColors] = useState<DynamicThemeColors>(defaultMovigoTheme);
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useDefaultTheme, setUseDefaultTheme] = useState(false);

  // Cargar tema de la organización
  useEffect(() => {
    if (currentOrganization) {
      loadOrganizationTheme(currentOrganization.uuid);
    } else {
      // Resetear a tema por defecto cuando no hay organización
      setThemeConfig(null);
      setColors(defaultMovigoTheme);
    }
  }, [currentOrganization]);

  // Escuchar cambios de organización para simulación
  useEffect(() => {
    const handleOrganizationChange = (event: CustomEvent) => {
      const { uuid } = event.detail;
      loadOrganizationTheme(uuid);
    };

    window.addEventListener('organizationChanged', handleOrganizationChange as EventListener);
    
    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange as EventListener);
    };
  }, []);

  // Aplicar tema inicial cuando se monta el componente
  useEffect(() => {
    if (colors) {
      applyThemeToDocument(colors);
    }
  }, [colors]);

  // Aplicar tema basado en el modo seleccionado
  useEffect(() => {
    if (useDefaultTheme) {
      setColors(defaultMovigoTheme);
      applyThemeToDocument(defaultMovigoTheme);
    } else if (themeConfig) {
      setColors(themeConfig.colors);
      applyThemeToDocument(themeConfig.colors);
    }
  }, [useDefaultTheme, themeConfig]);

  const loadOrganizationTheme = async (organizationUuid: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener información pública de la organización desde la API externa
      const response = await fetch(`/api/organizations/public/${organizationUuid}`);
      const organizationData = await response.json();

      console.log('organizationData', organizationData);
      
      if (response.ok && organizationData.success) {
        // Usar theme_config y branding de la API externa
        const { theme_config, branding } = organizationData.data;
        
        if (theme_config && theme_config.colors) {
          // Crear configuración de tema desde la API
          const themeConfig: OrganizationThemeConfig = {
            organization_uuid: organizationUuid,
            theme_name: theme_config.theme_name || 'Tema Personalizado',
            colors: theme_config.colors,
            is_active: theme_config.metadata?.is_active ?? true,
            created_at: theme_config.metadata?.created_at,
            updated_at: theme_config.metadata?.updated_at,
          };
          
          setThemeConfig(themeConfig);
          setColors(themeConfig.colors);
          applyThemeToDocument(themeConfig.colors);
          
          // Aplicar branding si está disponible
          if (branding) {
            setBranding(branding);
            applyBrandingToDocument(branding);
          }
        } else {
          // Fallback al tema por defecto si no hay theme_config
          const defaultThemeConfig: OrganizationThemeConfig = {
            organization_uuid: organizationUuid,
            theme_name: 'Movigo - Moderno',
            colors: defaultMovigoTheme,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          setThemeConfig(defaultThemeConfig);
          setColors(defaultThemeConfig.colors);
          applyThemeToDocument(defaultThemeConfig.colors);
        }
      } else {
        throw new Error(organizationData.error || 'Error al obtener información de la organización');
      }
      
    } catch (err) {
      console.error('Error loading organization theme:', err);
      setError('Error al cargar el tema de la organización');
      setColors(defaultMovigoTheme);
      applyThemeToDocument(defaultMovigoTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const applyThemeToDocument = (themeColors: DynamicThemeColors) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Mapeo específico de propiedades a variables CSS
    const cssVarMap: Record<keyof DynamicThemeColors, string> = {
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
    };
    
    // Aplicar variables CSS personalizadas
    Object.entries(themeColors).forEach(([key, value]) => {
      const cssVarName = cssVarMap[key as keyof DynamicThemeColors];
      if (cssVarName) {
        root.style.setProperty(cssVarName, value);
      } else {
        console.warn(`⚠️ No CSS variable mapping found for: ${key}`);
      }
    });
    
    // Forzar re-render de elementos con clases de tema
    const elementsWithTheme = document.querySelectorAll('[class*="theme-"]');
    elementsWithTheme.forEach((element) => {
      // Trigger reflow to force style recalculation
      (element as HTMLElement).offsetHeight;
    });
    
  };

  const updateTheme = (newConfig: OrganizationThemeConfig) => {
    setThemeConfig(newConfig);
    setColors(newConfig.colors);
    applyThemeToDocument(newConfig.colors);
    
    // TODO: Guardar en el backend
  };

  const applyBrandingToDocument = (branding: OrganizationBranding) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Aplicar logo si está disponible
    if (branding.logo_url) {
      root.style.setProperty('--organization-logo', `url(${branding.logo_url})`);
    } else {
      root.style.removeProperty('--organization-logo');
    }
    
    // Aplicar favicon si está disponible
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
    
    // Aplicar fuentes si están disponibles
    if (branding.primary_font) {
      root.style.setProperty('--primary-font', branding.primary_font);
    }
    
    if (branding.secondary_font) {
      root.style.setProperty('--secondary-font', branding.secondary_font);
    }
    
  };

  const updateBranding = (newBranding: OrganizationBranding) => {
    setBranding(newBranding);
    applyBrandingToDocument(newBranding);
  };

  const toggleThemeMode = () => {
    setUseDefaultTheme(!useDefaultTheme);
  };

  const resetToDefault = () => {
    if (currentOrganization) {
      const defaultConfig: OrganizationThemeConfig = {
        organization_uuid: currentOrganization.uuid,
        theme_name: 'Movigo - Moderno',
        colors: defaultMovigoTheme,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      updateTheme(defaultConfig);
    }
  };

  return (
    <DynamicThemeContext.Provider
      value={{
        themeConfig,
        colors,
        branding,
        isLoading,
        error,
        useDefaultTheme,
        updateTheme,
        updateBranding,
        toggleThemeMode,
        resetToDefault,
      }}
    >
      {children}
    </DynamicThemeContext.Provider>
  );
}

export function useDynamicTheme() {
  const context = useContext(DynamicThemeContext);
  if (context === undefined) {
    throw new Error('useDynamicTheme must be used within a DynamicThemeProvider');
  }
  return context;
}
