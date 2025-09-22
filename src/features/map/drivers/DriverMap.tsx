'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseMap } from '@/components/map/leaflet/base/BaseMap';
import { DriverMarkers } from '@/components/map/leaflet/markers/DriverMarkers';
import { DriverDetailsModal } from '@/components/ui/DriverDetailsModal';
import { useUnifiedDriverPositions } from '@/hooks/useUnifiedDriverPositions';
import { useInProgressRoutes } from '@/hooks/useInProgressRoutes';
import { RouteSelector } from '@/components/ui/RouteSelector';
import { DriverPosition } from '@/hooks/useDriverPositions';
import { RouteDriverPosition } from '@/hooks/useRouteDriverPositions';
import { CombinedDriverPosition } from '@/lib/leaflet/types';
import { useAuth } from '@/contexts/AuthContext';
import L from 'leaflet';
import { calculateBounds } from '@/lib/leaflet/utils';

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

  const { inProgressRoutes, loading: routesLoading, error: routesError } = useInProgressRoutes();
  const { 
    driverPositions, 
    selectedRouteIds, 
    loading, 
    error,
    updateSelectedRoutes,
    wsConnected,
    setMapCentered,
    setMapCenteringComplete,
    wsReady,
    setWsReady
  } = useUnifiedDriverPositions();

  // Estado para el conductor seleccionado
  const [selectedDriver, setSelectedDriver] = useState<CombinedDriverPosition | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

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

  // Calculate bounds for all drivers
  const driversBounds = useMemo(() => {
    if (driverPositions.length === 0) return null;
    
    const locations = driverPositions.map(driver => driver.location);
    return calculateBounds(locations);
  }, [driverPositions]);

  // Handle map ready
  const handleMapReady = useCallback((map: L.Map) => {
    console.log('🗺️ MAPA LEAFLET LISTO');
    setMapInstance(map);
    setMapCentered(true);
    setMapCenteringComplete(true);
    setWsReady(true);

    // Ajustar vista a los conductores si hay datos
    if (driversBounds) {
      map.fitBounds(driversBounds, { padding: [20, 20] });
    }
  }, [driversBounds, setMapCentered, setMapCenteringComplete, setWsReady]);

  // Ajustar vista cuando cambien los conductores
  useEffect(() => {
    if (mapInstance && driversBounds) {
      mapInstance.fitBounds(driversBounds, { padding: [20, 20] });
    }
  }, [mapInstance, driversBounds]);

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
          zoom={12}
          onMapReady={handleMapReady}
          className={className}
        >
          {/* Marcadores de conductores */}
          <DriverMarkers
            drivers={driverPositions}
            selectedDriver={selectedDriver}
            selectedRouteIds={selectedRouteIds}
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

      {/* Error state */}
      {error && (
        <div className="absolute top-28 left-4 z-10 bg-red-50/95 backdrop-blur-sm border border-red-200 rounded-lg p-3 max-w-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 text-red-600">⚠️</div>
            <div>
              <h3 className="text-xs font-semibold text-red-800">Error</h3>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && !authLoading && (
        <div className="absolute top-28 left-4 z-10 bg-blue-50/95 backdrop-blur-sm border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span className="text-xs text-blue-800">Actualizando...</span>
          </div>
        </div>
      )}

      {/* Controles unificados - Selector de rutas y conteo de conductores */}
      <div className="absolute top-16 left-4 z-30 w-80">
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg">
          {/* Route Selector - Top */}
          <div className="p-4 border-b border-gray-200">
            <RouteSelector
              routes={inProgressRoutes}
              selectedRouteIds={selectedRouteIds}
              onSelectionChange={updateSelectedRoutes}
              loading={routesLoading}
              error={routesError}
            />
          </div>
          
          {/* Driver Count - Bottom */}
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {wsConnected && (
                  <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-30"></div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {driverPositions.length} conductor{driverPositions.length !== 1 ? 'es' : ''}
                  </div>
                  <div className="text-xs text-gray-600">
                    {driverPositions.filter(d => d.status === 'DRIVING').length} activos
                    {selectedRouteIds.length > 0 ? (
                      <span className="ml-2 text-blue-600 font-medium">
                        (Solo rutas seleccionadas)
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalles del conductor */}
      <DriverDetailsModal 
        selectedDriver={selectedDriver}
        onClose={handleCloseDriverDetails}
        map={mapInstance}
      />
    </div>
  );
}
