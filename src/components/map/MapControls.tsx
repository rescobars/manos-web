'use client';

import React from 'react';
import { RouteSelector } from '@/components/ui/RouteSelector';
import { MapTileSelector, MapTileType } from '@/components/ui/leaflet';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

interface MapControlsProps {
  // Route controls
  inProgressRoutes: any[];
  selectedRouteIds: string[];
  onRouteSelectionChange: (routeIds: string[]) => void;
  routesLoading: boolean;
  routesError: string | null;
  
  // Driver controls
  filteredDrivers: any[];
  totalDrivers: number;
  wsConnected: boolean;
  statusCounts: Record<string, number>;
  statusFilters: Set<string>;
  onStatusFiltersChange: (filters: Set<string>) => void;
  
  // Map controls
  tileType: MapTileType;
  onTileTypeChange: (type: MapTileType) => void;
}

export function MapControls({
  inProgressRoutes,
  selectedRouteIds,
  onRouteSelectionChange,
  routesLoading,
  routesError,
  filteredDrivers,
  totalDrivers,
  wsConnected,
  statusCounts,
  statusFilters,
  onStatusFiltersChange,
  tileType,
  onTileTypeChange
}: MapControlsProps) {
  const { colors } = useDynamicTheme();
  
  return (
    <div 
      className="backdrop-blur-sm border rounded-lg shadow-lg"
      style={{
        backgroundColor: colors.background3 + 'F5', // 95% opacity
        borderColor: colors.border
      }}
    >
      {/* Route Selector - Top */}
      <div 
        className="p-3 border-b"
        style={{ borderColor: colors.border }}
      >
        <div className="space-y-2">
          <label 
            className="text-sm font-medium block"
            style={{ color: colors.textPrimary }}
          >
            Rutas Activas
          </label>
          <RouteSelector
            routes={inProgressRoutes}
            selectedRouteIds={selectedRouteIds}
            onSelectionChange={onRouteSelectionChange}
            loading={routesLoading}
            error={routesError}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Driver Count */}
      <div 
        className="p-3 border-b"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div 
              className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: wsConnected ? colors.success : colors.error }}
            ></div>
            {wsConnected && (
              <div 
                className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-30"
                style={{ backgroundColor: colors.success }}
              ></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div 
              className="text-sm font-bold truncate"
              style={{ color: colors.textPrimary }}
            >
              {filteredDrivers.length} de {totalDrivers} conductor{totalDrivers !== 1 ? 'es' : ''}
            </div>
            <div 
              className="text-xs truncate"
              style={{ color: colors.textSecondary }}
            >
              {wsConnected ? 'Conectado' : 'Desconectado'}
              {selectedRouteIds.length > 0 && (
                <span 
                  className="ml-1 font-medium"
                  style={{ color: colors.info }}
                >
                  (Filtrado)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Filters - Siempre visibles */}
      <div 
        className="px-3 py-3 border-b"
        style={{ borderColor: colors.border }}
      >
        <div className="space-y-2">
          <div 
            className="text-sm font-medium"
            style={{ color: colors.textPrimary }}
          >
            Estados
          </div>
          {[
            { status: 'DRIVING', label: 'Manejando', color: colors.success },
            { status: 'IDLE', label: 'Inactivo', color: colors.warning },
            { status: 'STOPPED', label: 'Detenido', color: colors.error },
            { status: 'BREAK', label: 'En Parada', color: colors.info },
            { status: 'OFFLINE', label: 'Offline', color: colors.textMuted }
          ].map(({ status, label, color }) => (
            <label 
              key={status} 
              className="flex items-center space-x-2 cursor-pointer p-1.5 rounded transition-colors"
              style={{ 
                backgroundColor: 'transparent',
                '--hover-bg': colors.menuItemHover
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.menuItemHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <input
                type="checkbox"
                checked={statusFilters.has(status)}
                onChange={(e) => {
                  const newFilters = new Set(statusFilters);
                  if (e.target.checked) {
                    newFilters.add(status);
                  } else {
                    newFilters.delete(status);
                  }
                  onStatusFiltersChange(newFilters);
                }}
                className="sr-only"
              />
              <div 
                className={`w-3 h-3 rounded-full transition-opacity flex-shrink-0 ${statusFilters.has(status) ? 'opacity-100' : 'opacity-30'}`}
                style={{ backgroundColor: color }}
              ></div>
              <span 
                className="text-xs flex-1 truncate"
                style={{ color: colors.textPrimary }}
              >
                {label}
              </span>
              <span 
                className="text-xs font-medium flex-shrink-0"
                style={{ color: colors.textSecondary }}
              >
                {statusCounts[status] || 0}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Selector de cartografía */}
      <div className="p-3">
        <div className="space-y-2">
          <label 
            className="text-sm font-medium block"
            style={{ color: colors.textPrimary }}
          >
            Mapa
          </label>
          <MapTileSelector
            onTileChange={onTileTypeChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
