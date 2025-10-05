'use client';

import React from 'react';
import { X, Settings } from 'lucide-react';
import { MapControls } from './MapControls';
import { MapTileType } from '@/components/ui/leaflet';

interface MobileMapControlsProps {
  isOpen: boolean;
  onClose: () => void;
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

export function MobileMapControls({
  isOpen,
  onClose,
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
}: MobileMapControlsProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-80 max-w-[90vw] sm:max-w-[85vw] theme-bg-3 dark:bg-gray-800 shadow-xl z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b theme-border dark:border-gray-700 theme-bg-2 dark:bg-gray-700">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 theme-text-secondary dark:text-gray-300 flex-shrink-0" />
            <h2 className="text-sm sm:text-lg font-semibold theme-text-primary dark:text-gray-100 truncate">Controles del Mapa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:theme-bg-2 dark:hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 theme-text-secondary dark:text-gray-300" />
          </button>
        </div>
        
        {/* Content */}
        <div className="h-full overflow-y-auto">
          <MapControls
            inProgressRoutes={inProgressRoutes}
            selectedRouteIds={selectedRouteIds}
            onRouteSelectionChange={onRouteSelectionChange}
            routesLoading={routesLoading}
            routesError={routesError}
            filteredDrivers={filteredDrivers}
            totalDrivers={totalDrivers}
            wsConnected={wsConnected}
            statusCounts={statusCounts}
            statusFilters={statusFilters}
            onStatusFiltersChange={onStatusFiltersChange}
            tileType={tileType}
            onTileTypeChange={onTileTypeChange}
          />
        </div>
      </div>
    </>
  );
}
