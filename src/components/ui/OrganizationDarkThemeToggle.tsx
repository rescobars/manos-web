'use client';

import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';
import { Moon, Sun } from 'lucide-react';

export function OrganizationDarkThemeToggle() {
  const { 
    organizationTheme, 
    useOrganizationDarkTheme, 
    toggleOrganizationDarkTheme,
    resolvedMode 
  } = useTheme();

  // Solo mostrar si la organización tiene un dark theme personalizado
  if (!organizationTheme?.colors_dark) {
    return null;
  }

  return (
    <Button
      variant={useOrganizationDarkTheme ? "primary" : "outline"}
      size="sm"
      onClick={toggleOrganizationDarkTheme}
      className="flex items-center gap-2"
    >
      {useOrganizationDarkTheme ? (
        <>
          <Sun className="h-4 w-4" />
          <span>Usar tema normal</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          <span>Usar tema dark personalizado</span>
        </>
      )}
    </Button>
  );
}
