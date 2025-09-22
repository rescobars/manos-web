'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MapTileType } from '@/components/ui/leaflet';

interface MapControlsContextType {
  // Route controls
  selectedRouteIds: string[];
  setSelectedRouteIds: (routeIds: string[]) => void;
  
  // Status filters
  statusFilters: Set<string>;
  setStatusFilters: (filters: Set<string>) => void;
  
  
  // Map controls
  tileType: MapTileType;
  setTileType: (type: MapTileType) => void;
}

const MapControlsContext = createContext<MapControlsContextType | undefined>(undefined);

export function MapControlsProvider({ children }: { children: ReactNode }) {
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<Set<string>>(
    new Set(['DRIVING', 'IDLE', 'STOPPED', 'BREAK', 'OFFLINE'])
  );
  const [tileType, setTileType] = useState<MapTileType>('streets');

  return (
    <MapControlsContext.Provider
      value={{
        selectedRouteIds,
        setSelectedRouteIds,
        statusFilters,
        setStatusFilters,
        tileType,
        setTileType,
      }}
    >
      {children}
    </MapControlsContext.Provider>
  );
}

export function useMapControls() {
  const context = useContext(MapControlsContext);
  if (context === undefined) {
    throw new Error('useMapControls must be used within a MapControlsProvider');
  }
  return context;
}
