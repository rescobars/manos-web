'use client';

import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useEffect } from 'react';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { theme, mounted } = useThemeClasses();

  // Aplicar clases de tema a elementos específicos
  useEffect(() => {
    if (!mounted) return;

    // Aplicar tema a elementos que no usan Tailwind dark: classes
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
        if (theme === 'dark') {
          htmlElement.style.backgroundColor = '#1f2937';
          htmlElement.style.color = '#f9fafb';
          htmlElement.style.borderColor = '#374151';
        } else {
          htmlElement.style.backgroundColor = '#ffffff';
          htmlElement.style.color = '#111827';
          htmlElement.style.borderColor = '#e5e7eb';
        }
      });
    });
  }, [theme, mounted]);

  if (!mounted) {
    return <div className="min-h-screen bg-white dark:bg-gray-900">{children}</div>;
  }

  return <>{children}</>;
}
