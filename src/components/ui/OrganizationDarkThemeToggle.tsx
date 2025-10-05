'use client';

import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

export function OrganizationDarkThemeToggle() {
  const { 
    organizationTheme, 
    useOrganizationDarkTheme, 
    toggleOrganizationDarkTheme
  } = useTheme();

  // Solo mostrar si la organización tiene un dark theme personalizado
  if (!organizationTheme?.colors_dark) {
    return null;
  }

  return (
    <button
      onClick={toggleOrganizationDarkTheme}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${useOrganizationDarkTheme 
          ? 'theme-btn-primary' 
          : 'theme-bg-3 theme-border border'
        }
      `}
      role="switch"
      aria-checked={useOrganizationDarkTheme}
      aria-label="Usar tema dark personalizado"
    >
      <span
        className={`
          inline-flex h-4 w-4 items-center justify-center transform rounded-full bg-white transition-transform
          ${useOrganizationDarkTheme ? 'translate-x-6' : 'translate-x-1'}
        `}
      >
        {useOrganizationDarkTheme ? (
          <Sun className="h-3 w-3 text-gray-600" />
        ) : (
          <Moon className="h-3 w-3 text-gray-600" />
        )}
      </span>
    </button>
  );
}
