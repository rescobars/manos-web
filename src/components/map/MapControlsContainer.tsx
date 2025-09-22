'use client';

import React, { useMemo } from 'react';
import { MapControls } from './MapControls';
import { useMapControls } from '@/contexts/MapControlsContext';
import { useUnifiedDriverPositions } from '@/hooks/useUnifiedDriverPositions';
import { useInProgressRoutes } from '@/hooks/useInProgressRoutes';
import { getRealDriverStatus } from '@/lib/leaflet/utils';

export function MapControlsContainer() {
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
    loading, 
    error,
    updateSelectedRoutes,
    wsConnected,
  } = useUnifiedDriverPositions();

  // Sincronizar rutas seleccionadas con el hook
  const handleRouteSelectionChange = (routeIds: string[]) => {
    setSelectedRouteIds(routeIds);
    updateSelectedRoutes(routeIds);
  };

  // Filtrar drivers por estado Y rutas seleccionadas (mismo filtrado que en DriverMap)
  const filteredDrivers = useMemo(() => {
    return driverPositions.filter(driver => {
      // Filtro por estado
      const realStatus = getRealDriverStatus(driver);
      const passesStatusFilter = statusFilters.has(realStatus);
      
      // Filtro por rutas (igual lógica que en DriverMarkers)
      let passesRouteFilter = true;
      if (selectedRouteIds.length > 0) {
        // Si hay rutas seleccionadas, solo mostrar conductores de esas rutas
        if ('routeId' in driver) {
          passesRouteFilter = selectedRouteIds.includes(driver.routeId);
        } else {
          // Si es un conductor de organización, no mostrarlo cuando hay rutas seleccionadas
          passesRouteFilter = false;
        }
      }
      
      return passesStatusFilter && passesRouteFilter;
    });
  }, [driverPositions, statusFilters, selectedRouteIds]);

  // Calcular contadores por estado
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    driverPositions.forEach(driver => {
      const realStatus = getRealDriverStatus(driver);
      counts[realStatus] = (counts[realStatus] || 0) + 1;
    });
    return counts;
  }, [driverPositions]);

  // Si está cargando o hay error, mostrar estado mínimo
  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-xs text-gray-600">Cargando controles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="text-center text-red-600">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-xs">Error al cargar datos</p>
        </div>
      </div>
    );
  }

    return (
      <MapControls
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
