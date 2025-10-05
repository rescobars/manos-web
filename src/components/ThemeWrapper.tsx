'use client';

import { useTheme } from '@/hooks/useTheme';
import { useEffect } from 'react';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { resolvedMode, currentColors, applyThemeToElement } = useTheme();

  // Aplicar tema a elementos específicos que no usan nuestro sistema de variables CSS
  useEffect(() => {
    // Aplicar tema a elementos de mapas que no usan Tailwind
    const elementsToUpdate = [
      '.leaflet-popup-content-wrapper',
      '.leaflet-popup-tip',
      '.mapboxgl-popup-content',
      '.mapboxgl-popup-tip'
    ];

    elementsToUpdate.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const htmlElement = element as HTMLElement;
        
        // Usar los colores del tema actual
        const styles = {
          backgroundColor: currentColors.background3,
          color: currentColors.textPrimary,
          borderColor: currentColors.border,
        };
        
        applyThemeToElement(htmlElement, styles);
      });
    });
  }, [resolvedMode, currentColors, applyThemeToElement]);

  return <>{children}</>;
}
