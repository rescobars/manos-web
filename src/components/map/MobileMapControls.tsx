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
      <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-xl z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Controles del Mapa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
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
