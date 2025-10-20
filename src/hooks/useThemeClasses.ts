'use client';

import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useEffect, useState } from 'react';

// Hook para aplicar clases de tema globalmente usando el sistema unificado
export function useThemeClasses() {
  const { resolvedMode } = useDynamicTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Aplicar clases de tema al body cuando cambie el tema
  useEffect(() => {
    if (!mounted) return;

    // Remover clases anteriores
    document.body.classList.remove('light', 'dark');
    
    // Agregar clase del tema actual
    if (resolvedMode) {
      document.body.classList.add(resolvedMode);
    }
  }, [resolvedMode, mounted]);

  return {
    theme: resolvedMode,
    mounted
  };
}
