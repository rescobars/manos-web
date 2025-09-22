'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseMap } from '@/components/map/leaflet/base/BaseMap';
import { DriverMarkers } from '@/components/map/leaflet/markers/DriverMarkers';
import { DriverDetailsModal } from '@/components/ui/DriverDetailsModal';
import { useUnifiedDriverPositions } from '@/hooks/useUnifiedDriverPositions';
import { CombinedDriverPosition } from '@/lib/leaflet/types';
import { useAuth } from '@/contexts/AuthContext';
import { useMapControls } from '@/contexts/MapControlsContext';
import L from 'leaflet';
import { calculateBounds, getRealDriverStatus } from '@/lib/leaflet/utils';

interface DriverMapProps {
  className?: string;
  onDriverClick?: (driver: CombinedDriverPosition) => void;
}

export function DriverMap({ className = 'w-full h-full', onDriverClick }: DriverMapProps) {
  const { currentOrganization, isLoading: authLoading } = useAuth();
  
  // Solo renderizar si la autenticación está lista
  if (authLoading || !currentOrganization) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  const { 
    driverPositions, 
    loading, 
    error,
    updateSelectedRoutes,
    wsConnected,
    setMapCentered,
    setMapCenteringComplete,
    wsReady,
    setWsReady
  } = useUnifiedDriverPositions();

  const {
    selectedRouteIds,
    statusFilters,
    tileType
  } = useMapControls();

  // Sincronizar rutas seleccionadas con el hook
  React.useEffect(() => {
    updateSelectedRoutes(selectedRouteIds);
  }, [selectedRouteIds, updateSelectedRoutes]);

  // Estado para el conductor seleccionado
  const [selectedDriver, setSelectedDriver] = useState<CombinedDriverPosition | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [hasInitiallyCentered, setHasInitiallyCentered] = useState(false);
  const [previousStatusFilters, setPreviousStatusFilters] = useState<Set<string>>(new Set(['DRIVING', 'IDLE', 'STOPPED', 'BREAK', 'OFFLINE']));
  const [previousSelectedRoutes, setPreviousSelectedRoutes] = useState<string[]>([]);

  const handleDriverClick = useCallback((driver: CombinedDriverPosition) => {
    setSelectedDriver(driver);
    if (onDriverClick) {
      onDriverClick(driver);
    }
  }, [onDriverClick]);

  const handleCloseDriverDetails = useCallback(() => {
    setSelectedDriver(null);
  }, []);

  // Default center to Guatemala City
  const defaultCenter: [number, number] = [-90.5069, 14.6349];

  // Filtrar drivers por estado Y rutas seleccionadas (filtrado unificado)
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


  // Calculate bounds for filtered drivers
  const driversBounds = useMemo(() => {
    if (filteredDrivers.length === 0) return null;
    
    const locations = filteredDrivers.map(driver => driver.location);
    return calculateBounds(locations);
  }, [filteredDrivers]);

  // Handle map ready
  const handleMapReady = useCallback((map: L.Map) => {
    console.log('🗺️ MAPA LEAFLET LISTO');
    setMapInstance(map);
    setMapCentered(true);
    setMapCenteringComplete(true);
    setWsReady(true);
  }, [setMapCentered, setMapCenteringComplete, setWsReady]);

  // Centrar el mapa solo una vez cuando esté listo y haya datos de drivers
  useEffect(() => {
    if (mapInstance && driversBounds && !hasInitiallyCentered) {
      console.log('🎯 CENTRANDO MAPA INICIAL - Una sola vez');
      mapInstance.fitBounds(driversBounds, { 
        padding: [20, 20],
        maxZoom: 16
      });
      setHasInitiallyCentered(true);
    }
  }, [mapInstance, driversBounds, hasInitiallyCentered]);

  // Función para centrar el mapa solo en marcadores visibles
  const centerMapToVisibleDrivers = useCallback(() => {
    if (mapInstance) {
      if (filteredDrivers.length > 0) {
        console.log('🎯 CENTRANDO MAPA A CONDUCTORES VISIBLES -', filteredDrivers.length, 'conductores filtrados');
        const locations = filteredDrivers.map(driver => ({
          latitude: driver.location.latitude,
          longitude: driver.location.longitude
        }));
        const filteredBounds = calculateBounds(locations);
        if (filteredBounds) {
          mapInstance.fitBounds(filteredBounds, { 
            padding: [20, 20],
            maxZoom: 16
          });
        }
      } else {
        // Si no hay conductores visibles, centrar en todos los conductores
        console.log('🎯 SIN CONDUCTORES VISIBLES - Centrando en todos los conductores');
        if (driverPositions.length > 0) {
          const allLocations = driverPositions.map(driver => ({
            latitude: driver.location.latitude,
            longitude: driver.location.longitude
          }));
          const allBounds = calculateBounds(allLocations);
          if (allBounds) {
            mapInstance.fitBounds(allBounds, { 
              padding: [20, 20],
              maxZoom: 16
            });
          }
        }
      }
    }
  }, [mapInstance, filteredDrivers, driverPositions]);

  // Detectar cambios en filtros de status y centrar el mapa
  useEffect(() => {
    // Comparar si los filtros de status han cambiado
    const statusFiltersChanged = !Array.from(statusFilters).every(status => previousStatusFilters.has(status)) ||
                                !Array.from(previousStatusFilters).every(status => statusFilters.has(status));
    
    if (statusFiltersChanged && hasInitiallyCentered) {
      console.log('🎯 FILTROS DE STATUS CAMBIARON - Centrando mapa a conductores visibles');
      centerMapToVisibleDrivers();
      setPreviousStatusFilters(new Set(statusFilters));
    }
  }, [statusFilters, previousStatusFilters, hasInitiallyCentered, centerMapToVisibleDrivers]);

  // Detectar cambios en rutas seleccionadas y centrar el mapa
  useEffect(() => {
    // Comparar si las rutas seleccionadas han cambiado
    const routesChanged = selectedRouteIds.length !== previousSelectedRoutes.length ||
                          !selectedRouteIds.every(routeId => previousSelectedRoutes.includes(routeId)) ||
                          !previousSelectedRoutes.every(routeId => selectedRouteIds.includes(routeId));
    
    if (routesChanged && hasInitiallyCentered) {
      console.log('🎯 RUTAS SELECCIONADAS CAMBIARON - Centrando mapa a conductores visibles');
      // Pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        centerMapToVisibleDrivers();
      }, 100);
      setPreviousSelectedRoutes([...selectedRouteIds]);
    }
  }, [selectedRouteIds, previousSelectedRoutes, hasInitiallyCentered, centerMapToVisibleDrivers]);

  // Loading state
  if (authLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-50`}>
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Mapa principal */}
      {driverPositions.length > 0 ? (
        <BaseMap
          center={defaultCenter}
          zoom={15}
          onMapReady={handleMapReady}
          className={className}
          tileType={tileType}
        >
          {/* Marcadores de conductores */}
          <DriverMarkers
            drivers={filteredDrivers}
            selectedDriver={selectedDriver}
            selectedRouteIds={[]} // Pasamos array vacío para evitar doble filtrado
            onDriverClick={handleDriverClick}
          />
        </BaseMap>
      ) : (
        <div className={`${className} flex items-center justify-center bg-gray-50`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando posiciones de conductores...</p>
          </div>
        </div>
      )}


      {/* Modal de detalles del conductor */}
      <DriverDetailsModal 
        selectedDriver={selectedDriver}
        onClose={handleCloseDriverDetails}
        map={mapInstance}
      />
    </div>
  );
}
