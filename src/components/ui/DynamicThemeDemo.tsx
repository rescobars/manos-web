'use client';

import React from 'react';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { Card } from './Card';
import { Button } from './Button';

export function DynamicThemeDemo() {
  const { colors, themeConfig, isLoading, error } = useDynamicTheme();

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 theme-bg-2 rounded w-1/3 mb-4"></div>
            <div className="h-4 theme-bg-2 rounded w-1/2 mb-2"></div>
            <div className="h-4 theme-bg-2 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6">
          <div className="text-red-600">
            <h3 className="text-lg font-semibold mb-2">Error al cargar el tema</h3>
            <p>{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información del tema actual */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold theme-text-primary mb-4">
            Tema Dinámico Actual
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm theme-text-secondary mb-2">
                <strong>Organización:</strong> {themeConfig?.organization_uuid || 'N/A'}
              </p>
              <p className="text-sm theme-text-secondary mb-2">
                <strong>Nombre del Tema:</strong> {themeConfig?.theme_name || 'Tema Verde Corporativo'}
              </p>
              <p className="text-sm theme-text-muted">
                <strong>Estado:</strong> {themeConfig?.is_active ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: colors.background1 }}
                ></div>
                <span className="text-sm theme-text-secondary">Background 1</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: colors.buttonPrimary1 }}
                ></div>
                <span className="text-sm theme-text-secondary">Botón Primario</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Demostración de componentes con tema dinámico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Botones */}
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-semibold theme-text-primary mb-4">Botones</h4>
            <div className="space-y-3">
              <Button 
                className="theme-btn-primary px-4 py-2 rounded font-medium"
                style={{ 
                  backgroundColor: colors.buttonPrimary1,
                  color: colors.buttonText
                }}
              >
                Botón Primario
              </Button>
              <Button 
                className="theme-btn-secondary px-4 py-2 rounded border font-medium"
                style={{ 
                  backgroundColor: colors.buttonSecondary1,
                  color: colors.textPrimary,
                  borderColor: colors.border
                }}
              >
                Botón Secundario
              </Button>
              <Button 
                className="theme-btn-hover px-4 py-2 rounded font-medium"
                style={{ 
                  backgroundColor: colors.buttonPrimary1,
                  color: colors.buttonText
                }}
              >
                Botón con Hover
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabla de ejemplo */}
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-semibold theme-text-primary mb-4">Tabla</h4>
            <div className="overflow-hidden rounded border theme-table-border">
              <table className="w-full">
                <thead 
                  className="theme-table-header"
                  style={{ backgroundColor: colors.tableHeader }}
                >
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold" style={{ color: 'white' }}>Columna 1</th>
                    <th className="px-4 py-2 text-left font-semibold" style={{ color: 'white' }}>Columna 2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    className="theme-table-row hover:theme-table-row-hover"
                    style={{ backgroundColor: colors.tableRow }}
                  >
                    <td className="px-4 py-2 theme-text-primary">Fila 1</td>
                    <td className="px-4 py-2 theme-text-secondary">Datos</td>
                  </tr>
                  <tr 
                    className="theme-table-row hover:theme-table-row-hover"
                    style={{ backgroundColor: colors.tableRow }}
                  >
                    <td className="px-4 py-2 theme-text-primary">Fila 2</td>
                    <td className="px-4 py-2 theme-text-secondary">Datos</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Menú de ejemplo */}
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-semibold theme-text-primary mb-4">Menú</h4>
            <div 
              className="theme-menu-bg rounded border theme-border p-4"
              style={{ 
                backgroundColor: colors.menuBackground1,
                borderColor: colors.border
              }}
            >
              <div className="space-y-2">
                <div 
                  className="theme-menu-item px-3 py-2 rounded cursor-pointer"
                  style={{ backgroundColor: colors.menuItemHover }}
                >
                  <span className="theme-text-primary">Opción 1</span>
                </div>
                <div 
                  className="theme-menu-item px-3 py-2 rounded cursor-pointer"
                  style={{ backgroundColor: colors.menuItemHover }}
                >
                  <span className="theme-text-primary">Opción 2</span>
                </div>
                <div 
                  className="theme-menu-sub-bg px-3 py-2 rounded"
                  style={{ backgroundColor: colors.menuBackground2 }}
                >
                  <span className="theme-text-secondary">Submenú</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Estados de color */}
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-semibold theme-text-primary mb-4">Estados</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: colors.success + '20' }}>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colors.success }}
                ></div>
                <span className="font-medium" style={{ color: colors.success }}>Éxito</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: colors.warning + '20' }}>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colors.warning }}
                ></div>
                <span className="font-medium" style={{ color: colors.warning }}>Advertencia</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: colors.error + '20' }}>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colors.error }}
                ></div>
                <span className="font-medium" style={{ color: colors.error }}>Error</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: colors.info + '20' }}>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colors.info }}
                ></div>
                <span className="font-medium" style={{ color: colors.info }}>Información</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Paleta de colores completa */}
      <Card>
        <div className="p-6">
          <h4 className="text-lg font-semibold theme-text-primary mb-4">Paleta de Colores</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key} className="text-center group">
                <div 
                  className="w-full h-20 rounded-lg border-2 shadow-sm mb-3 group-hover:shadow-md transition-shadow"
                  style={{ backgroundColor: value }}
                ></div>
                <p className="text-xs font-medium theme-text-primary mb-1">{key}</p>
                <p className="text-xs theme-text-muted font-mono theme-bg-1 px-2 py-1 rounded">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
