'use client';

import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useState, useEffect } from 'react';

export function ThemeDebugger() {
  const { colors, themeConfig } = useDynamicTheme();
  const [cssVars, setCssVars] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      const vars: Record<string, string> = {};
      
      // Obtener todas las variables CSS de tema
      const themeVarNames = [
        '--theme-background-1',
        '--theme-background-2', 
        '--theme-background-3',
        '--theme-button-primary-1',
        '--theme-button-primary-2',
        '--theme-button-primary-3',
        '--theme-button-secondary-1',
        '--theme-button-secondary-2',
        '--theme-button-hover',
        '--theme-button-active',
        '--theme-button-text',
        '--theme-button-text-hover',
        '--theme-table-header',
        '--theme-table-row',
        '--theme-table-row-hover',
        '--theme-table-border',
        '--theme-menu-background-1',
        '--theme-menu-background-2',
        '--theme-menu-item-hover',
        '--theme-header-background',
        '--theme-header-text',
        '--theme-header-border',
        '--theme-sidebar-background',
        '--theme-sidebar-text',
        '--theme-sidebar-border',
        '--theme-sidebar-item-hover',
        '--theme-sidebar-item-active',
        '--theme-text-primary',
        '--theme-text-secondary',
        '--theme-text-muted',
        '--theme-border',
        '--theme-divider',
        '--theme-success',
        '--theme-warning',
        '--theme-error',
        '--theme-info',
      ];

      themeVarNames.forEach(varName => {
        vars[varName] = computedStyle.getPropertyValue(varName).trim();
      });

      setCssVars(vars);
    }
  }, [colors]);

  return (
    <div className="fixed bottom-4 right-4 theme-bg-3 border-2 theme-border rounded-lg p-4 shadow-lg max-w-sm max-h-96 overflow-y-auto z-50">
      <h3 className="font-bold text-sm mb-2">🎨 Theme Debugger</h3>
      <div className="text-xs space-y-1">
        <div><strong>Theme:</strong> {themeConfig?.theme_name || 'N/A'}</div>
        <div><strong>Org:</strong> {themeConfig?.organization_uuid || 'N/A'}</div>
        <div className="mt-2"><strong>CSS Variables:</strong></div>
        {Object.entries(cssVars).map(([varName, value]) => (
          <div key={varName} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded border"
              style={{ backgroundColor: value || '#000' }}
            ></div>
            <span className="font-mono text-xs">
              {varName}: {value || 'NOT SET'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
