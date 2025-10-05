'use client';

import { useUnifiedTheme } from '@/contexts/UnifiedThemeContext';
import { useEffect, useState } from 'react';

interface ThemeLoadingProviderProps {
  children: React.ReactNode;
}

export function ThemeLoadingProvider({ children }: ThemeLoadingProviderProps) {
  const { themeReady, isLoading } = useUnifiedTheme();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Mostrar contenido solo cuando el theme esté listo
    if (themeReady && !isLoading) {
      setShowContent(true);
    }
  }, [themeReady, isLoading]);

  // Mostrar loading screen mientras se carga el theme
  if (!showContent) {
    return (
      <div className="min-h-screen theme-bg-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 theme-text-primary mx-auto mb-4"></div>
          <p className="theme-text-secondary text-sm">Cargando tema...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
