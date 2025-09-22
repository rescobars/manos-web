'use client';

import React from 'react';
import { MobileMapControls } from './MobileMapControls';
import { useMapControls } from '@/contexts/MapControlsContext';
import { useUnifiedDriverPositions } from '@/hooks/useUnifiedDriverPositions';
import { useInProgressRoutes } from '@/hooks/useInProgressRoutes';
import { getRealDriverStatus } from '@/lib/leaflet/utils';

interface MobileMapControlsContainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMapControlsContainer({ isOpen, onClose }: MobileMapControlsContainerProps) {
  const {
    selectedRouteIds,
    setSelectedRouteIds,
    statusFilters,
    setStatusFilters,
    tileType,
    setTileType,
  } = useMapControls();

  const { inProgressRoutes, loading: routesLoading, error: routesError } = useInProgressRoutes();
  const { 
    driverPositions, 
    updateSelectedRoutes,
    wsConnected,
  } = useUnifiedDriverPositions();

  // Sincronizar rutas seleccionadas con el hook
  const handleRouteSelectionChange = (routeIds: string[]) => {
    setSelectedRouteIds(routeIds);
    updateSelectedRoutes(routeIds);
  };

  // Filtrar drivers por estado Y rutas seleccionadas (mismo filtrado que en DriverMap)
  const filteredDrivers = React.useMemo(() => {
    return driverPositions.filter(driver => {
      // Filtro por estado
      const realStatus = getRealDriverStatus(driver);
      const passesStatusFilter = statusFilters.has(realStatus);
      
      // Filtro por rutas
      let passesRouteFilter = true;
      if (selectedRouteIds.length > 0) {
        if ('routeId' in driver) {
          passesRouteFilter = selectedRouteIds.includes(driver.routeId);
        } else {
          passesRouteFilter = false;
        }
      }
      
      return passesStatusFilter && passesRouteFilter;
    });
  }, [driverPositions, statusFilters, selectedRouteIds]);

  // Calcular contadores por estado
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    driverPositions.forEach(driver => {
      const realStatus = getRealDriverStatus(driver);
      counts[realStatus] = (counts[realStatus] || 0) + 1;
    });
    return counts;
  }, [driverPositions]);

  return (
    <MobileMapControls
      isOpen={isOpen}
      onClose={onClose}
      inProgressRoutes={inProgressRoutes}
      selectedRouteIds={selectedRouteIds}
      onRouteSelectionChange={handleRouteSelectionChange}
      routesLoading={routesLoading}
      routesError={routesError}
      filteredDrivers={filteredDrivers}
      totalDrivers={driverPositions.length}
      wsConnected={wsConnected}
      statusCounts={statusCounts}
      statusFilters={statusFilters}
      onStatusFiltersChange={setStatusFilters}
      tileType={tileType}
      onTileTypeChange={setTileType}
    />
  );
}
