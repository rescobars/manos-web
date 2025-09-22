'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Hook para aplicar clases de tema globalmente
export function useThemeClasses() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Aplicar clases de tema al body cuando cambie el tema
  useEffect(() => {
    if (!mounted) return;

    const currentTheme = resolvedTheme || theme;
    
    // Remover clases anteriores
    document.body.classList.remove('light', 'dark');
    
    // Agregar clase del tema actual
    if (currentTheme && currentTheme !== 'system') {
      document.body.classList.add(currentTheme);
    } else {
      // Para system, usar la preferencia del sistema
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.body.classList.add(systemTheme);
    }
  }, [theme, resolvedTheme, mounted]);

  return {
    theme: resolvedTheme || theme,
    mounted
  };
}
