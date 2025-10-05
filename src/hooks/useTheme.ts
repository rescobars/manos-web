'use client';

import { useUnifiedTheme } from '@/contexts/UnifiedThemeContext';
import { DynamicThemeColors } from '@/contexts/DynamicThemeContext';
import { useMemo } from 'react';

// Hook principal unificado para themes
export function useTheme() {
  const context = useUnifiedTheme();
  
  // Generar clases CSS optimizadas usando variables CSS
  const themeClasses = useMemo(() => ({
    // Backgrounds
    bgPrimary: 'theme-bg-1',
    bgSecondary: 'theme-bg-2',
    bgCard: 'theme-bg-3',
    
    // Buttons
    btnPrimary: 'theme-btn-primary',
    btnSecondary: 'theme-btn-secondary',
    
    // Tables
    tableHeader: 'theme-table-header',
    tableRow: 'theme-table-row theme-table-row-hover',
    tableBorder: 'theme-table-border',
    
    // Menus
    menuBg: 'theme-menu-bg',
    menuSubBg: 'theme-menu-sub-bg',
    menuItemHover: 'theme-menu-item',
    
    // Headers and Sidebars
    headerBg: 'theme-header-bg',
    headerText: 'theme-header-text',
    headerBorder: 'theme-header-border',
    sidebarBg: 'theme-sidebar-bg',
    sidebarText: 'theme-sidebar-text',
    sidebarBorder: 'theme-sidebar-border',
    sidebarItemHover: 'theme-sidebar-item',
    
    // Text
    textPrimary: 'theme-text-primary',
    textSecondary: 'theme-text-secondary',
    textMuted: 'theme-text-muted',
    
    // Borders
    border: 'theme-border',
    divider: 'theme-divider',
    
    // States
    success: 'theme-success',
    warning: 'theme-warning',
    error: 'theme-error',
    info: 'theme-info',
  }), []);

  // Generar estilos inline cuando sea necesario
  const inlineStyles = useMemo(() => ({
    // Backgrounds
    background1: { backgroundColor: `var(--theme-background-1)` },
    background2: { backgroundColor: `var(--theme-background-2)` },
    background3: { backgroundColor: `var(--theme-background-3)` },
    
    // Buttons
    buttonPrimary: { 
      backgroundColor: `var(--theme-button-primary-1)`,
      color: `var(--theme-button-text)`,
    },
    buttonSecondary: {
      backgroundColor: `var(--theme-button-secondary-1)`,
      color: `var(--theme-text-primary)`,
    },
    
    // Tables
    tableHeader: { 
      backgroundColor: `var(--theme-table-header)`,
      color: `var(--theme-button-text)`,
    },
    tableRow: { backgroundColor: `var(--theme-table-row)` },
    tableBorder: { borderColor: `var(--theme-table-border)` },
    
    // Text
    textPrimary: { color: `var(--theme-text-primary)` },
    textSecondary: { color: `var(--theme-text-secondary)` },
    textMuted: { color: `var(--theme-text-muted)` },
    
    // States
    success: { color: `var(--theme-success)` },
    warning: { color: `var(--theme-warning)` },
    error: { color: `var(--theme-error)` },
    info: { color: `var(--theme-info)` },
  }), []);

  return {
    // Propiedades del contexto
    ...context,
    
    // Clases CSS optimizadas
    classes: themeClasses,
    
    // Estilos inline
    styles: inlineStyles,
    
    // Helpers adicionales
    isDark: context.resolvedMode === 'dark',
    isLight: context.resolvedMode === 'light',
    
    // Función para obtener variable CSS
    getCSSVar: (varName: string) => {
      if (typeof window === 'undefined') return '';
      return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    },
    
    // Función para aplicar múltiples clases de tema
    cn: (...classes: (string | undefined | null | false)[]) => {
      return classes.filter(Boolean).join(' ');
    },
  };
}

// Hook de compatibilidad con next-themes
export function useThemeMode() {
  const { mode, setMode, resolvedMode } = useUnifiedTheme();
  
  return {
    theme: mode,
    setTheme: setMode,
    resolvedTheme: resolvedMode,
    systemTheme: resolvedMode, // Para compatibilidad
  };
}

// Hook específico para colores
export function useThemeColors() {
  const { currentColors, getColor } = useUnifiedTheme();
  
  return {
    colors: currentColors,
    getColor,
    
    // Colores más usados como propiedades directas
    primary: getColor('buttonPrimary1'),
    secondary: getColor('buttonSecondary1'),
    background: getColor('background1'),
    text: getColor('textPrimary'),
    border: getColor('border'),
    success: getColor('success'),
    warning: getColor('warning'),
    error: getColor('error'),
    info: getColor('info'),
  };
}

// Hook para branding
export function useBranding() {
  const { branding, updateBranding } = useUnifiedTheme();
  
  return {
    branding,
    updateBranding,
    
    // Helpers
    hasLogo: !!branding?.logo_url,
    hasFavicon: !!branding?.favicon_url,
    hasCustomFonts: !!(branding?.primary_font || branding?.secondary_font),
    
    // CSS variables
    logoVar: 'var(--organization-logo)',
    primaryFontVar: 'var(--primary-font)',
    secondaryFontVar: 'var(--secondary-font)',
  };
}

// Hook para compatibilidad con useThemeClasses
export function useThemeClasses() {
  const { resolvedMode } = useUnifiedTheme();
  
  return {
    theme: resolvedMode,
    mounted: true, // Siempre mounted en el nuevo sistema
  };
}
