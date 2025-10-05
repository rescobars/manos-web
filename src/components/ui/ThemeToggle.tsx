'use client';

import React from 'react';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { Palette, Building2 } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = true }: ThemeToggleProps) {
  const { useDefaultTheme, toggleThemeMode, themeConfig } = useDynamicTheme();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium theme-text-secondary">
          Tema:
        </span>
      )}
      
      <button
        onClick={toggleThemeMode}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${useDefaultTheme 
            ? 'theme-button-primary-1' 
            : 'theme-bg-2'
          }
        `}
        style={{
          backgroundColor: useDefaultTheme 
            ? themeConfig?.colors.buttonPrimary1 || '#ffffff'
            : '#e5e7eb'
        }}
        title={useDefaultTheme ? 'Usar tema de la organización' : 'Usar tema por defecto'}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full theme-bg-3 transition-transform
            ${useDefaultTheme ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      
      <div className="flex items-center gap-1 text-xs theme-text-muted">
        {useDefaultTheme ? (
          <>
            <Palette className="w-3 h-3" />
            <span>Por Defecto</span>
          </>
        ) : (
          <>
            <Building2 className="w-3 h-3" />
            <span>Organización</span>
          </>
        )}
      </div>
    </div>
  );
}
