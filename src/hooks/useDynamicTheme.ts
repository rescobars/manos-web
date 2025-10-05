'use client';

import { useDynamicTheme as useDynamicThemeContext } from '@/contexts/UnifiedThemeContext';
import { DynamicThemeColors } from '@/contexts/DynamicThemeContext';

export function useDynamicTheme() {
  const context = useDynamicThemeContext();
  
  // Función helper para obtener colores con fallback
  const getColor = (colorKey: keyof DynamicThemeColors, fallback?: string) => {
    return context.colors[colorKey] || fallback || '#000000';
  };

  // Función helper para generar clases CSS dinámicas
  const getThemeClasses = () => {
    const colors = context.colors;
    
    return {
      // Backgrounds
      bgPrimary: `bg-[${colors.background1}]`,
      bgSecondary: `bg-[${colors.background2}]`,
      bgCard: `bg-[${colors.background3}]`,
      
      // Buttons
      btnPrimary: `bg-[${colors.buttonPrimary1}] hover:bg-[${colors.buttonPrimary2}] active:bg-[${colors.buttonPrimary3}]`,
      btnSecondary: `bg-[${colors.buttonSecondary1}] hover:bg-[${colors.buttonSecondary2}]`,
      
      // Tables
      tableHeader: `bg-[${colors.tableHeader}]`,
      tableRow: `bg-[${colors.tableRow}] hover:bg-[${colors.tableRowHover}]`,
      tableBorder: `border-[${colors.tableBorder}]`,
      
      // Menus
      menuBg: `bg-[${colors.menuBackground1}]`,
      menuSubBg: `bg-[${colors.menuBackground2}]`,
      menuItemHover: `hover:bg-[${colors.menuItemHover}]`,
      
      // Text
      textPrimary: `text-[${colors.textPrimary}]`,
      textSecondary: `text-[${colors.textSecondary}]`,
      textMuted: `text-[${colors.textMuted}]`,
      
      // States
      success: `text-[${colors.success}]`,
      warning: `text-[${colors.warning}]`,
      error: `text-[${colors.error}]`,
      info: `text-[${colors.info}]`,
    };
  };

  // Función helper para obtener estilos inline
  const getInlineStyles = () => {
    const colors = context.colors;
    
    return {
      // Backgrounds
      background1: { backgroundColor: colors.background1 },
      background2: { backgroundColor: colors.background2 },
      background3: { backgroundColor: colors.background3 },
      
      // Buttons
      buttonPrimary: { 
        backgroundColor: colors.buttonPrimary1,
        '--hover-bg': colors.buttonPrimary2,
        '--active-bg': colors.buttonPrimary3,
      } as React.CSSProperties,
      
      // Tables
      tableHeader: { backgroundColor: colors.tableHeader },
      tableRow: { backgroundColor: colors.tableRow },
      tableBorder: { borderColor: colors.tableBorder },
      
      // Text
      textPrimary: { color: colors.textPrimary },
      textSecondary: { color: colors.textSecondary },
      textMuted: { color: colors.textMuted },
    };
  };

  return {
    ...context,
    getColor,
    getThemeClasses,
    getInlineStyles,
  };
}
