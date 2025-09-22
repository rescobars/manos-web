'use client';

import React from 'react';
import { RouteSelector } from '@/components/ui/RouteSelector';
import { MapTileSelector, MapTileType } from '@/components/ui/leaflet';

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
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg">
      {/* Route Selector - Top */}
      <div className="p-3 border-b border-gray-200">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
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
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            {wsConnected && (
              <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-30"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">
              {filteredDrivers.length} de {totalDrivers} conductor{totalDrivers !== 1 ? 'es' : ''}
            </div>
            <div className="text-xs text-gray-600 truncate">
              {wsConnected ? 'Conectado' : 'Desconectado'}
              {selectedRouteIds.length > 0 && (
                <span className="ml-1 text-blue-600 font-medium">
                  (Filtrado)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Filters - Siempre visibles */}
      <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Estados
          </div>
          {[
            { status: 'DRIVING', label: 'Manejando', color: '#10B981' },
            { status: 'IDLE', label: 'Inactivo', color: '#F59E0B' },
            { status: 'STOPPED', label: 'Detenido', color: '#EF4444' },
            { status: 'BREAK', label: 'En Parada', color: '#8B5CF6' },
            { status: 'OFFLINE', label: 'Offline', color: '#6B7280' }
          ].map(({ status, label, color }) => (
            <label key={status} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1.5 rounded transition-colors">
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
              <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                {label}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">
                {statusCounts[status] || 0}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Selector de cartografía */}
      <div className="p-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
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
