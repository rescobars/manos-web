'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

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
  
  // Tablas
  tableHeader: string;        // Fondo del header de tabla
  tableRow: string;           // Fondo de fila de tabla
  tableRowHover: string;      // Fondo de fila al hacer hover
  tableBorder: string;        // Borde de tabla
  
  // Menús
  menuBackground1: string;    // Fondo del menú principal
  menuBackground2: string;    // Fondo de submenús
  menuItemHover: string;      // Fondo de item de menú al hover
  
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
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Tema verde por defecto
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
  
  // Tablas
  tableHeader: '#16a34a',      // Verde principal
  tableRow: '#ffffff',         // Blanco
  tableRowHover: '#f0fdf4',    // Verde muy claro
  tableBorder: '#bbf7d0',      // Verde claro
  
  // Menús
  menuBackground1: '#ffffff',  // Blanco
  menuBackground2: '#f0fdf4',  // Verde muy claro
  menuItemHover: '#dcfce7',    // Verde claro
  
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
  isLoading: boolean;
  error: string | null;
  updateTheme: (newConfig: OrganizationThemeConfig) => void;
  resetToDefault: () => void;
}

const DynamicThemeContext = createContext<DynamicThemeContextType | undefined>(undefined);

export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useAuth();
  const [themeConfig, setThemeConfig] = useState<OrganizationThemeConfig | null>(null);
  const [colors, setColors] = useState<DynamicThemeColors>(defaultGreenTheme);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar tema de la organización
  useEffect(() => {
    if (currentOrganization) {
      loadOrganizationTheme(currentOrganization.uuid);
    } else {
      // Resetear a tema por defecto cuando no hay organización
      setThemeConfig(null);
      setColors(defaultGreenTheme);
    }
  }, [currentOrganization]);

  const loadOrganizationTheme = async (organizationUuid: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simular llamada al backend - por ahora usar tema verde por defecto
      // TODO: Reemplazar con llamada real al backend
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
      
      const mockThemeConfig: OrganizationThemeConfig = {
        organization_uuid: organizationUuid,
        theme_name: 'Tema Verde Corporativo',
        colors: defaultGreenTheme,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setThemeConfig(mockThemeConfig);
      setColors(mockThemeConfig.colors);
      
      // Aplicar variables CSS personalizadas
      applyThemeToDocument(mockThemeConfig.colors);
      
    } catch (err) {
      console.error('Error loading organization theme:', err);
      setError('Error al cargar el tema de la organización');
      setColors(defaultGreenTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const applyThemeToDocument = (themeColors: DynamicThemeColors) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Aplicar variables CSS personalizadas
    Object.entries(themeColors).forEach(([key, value]) => {
      const cssVarName = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });
  };

  const updateTheme = (newConfig: OrganizationThemeConfig) => {
    setThemeConfig(newConfig);
    setColors(newConfig.colors);
    applyThemeToDocument(newConfig.colors);
    
    // TODO: Guardar en el backend
    console.log('Saving theme config:', newConfig);
  };

  const resetToDefault = () => {
    if (currentOrganization) {
      const defaultConfig: OrganizationThemeConfig = {
        organization_uuid: currentOrganization.uuid,
        theme_name: 'Tema Verde Corporativo',
        colors: defaultGreenTheme,
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
        isLoading,
        error,
        updateTheme,
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
