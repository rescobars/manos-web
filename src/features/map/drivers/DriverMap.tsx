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
  const [hasInitiallyCentered, setHasInitiallyCentered] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set(['DRIVING', 'IDLE', 'STOPPED', 'BREAK', 'OFFLINE']));

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

  // Filtrar drivers por estado
  const filteredDrivers = useMemo(() => {
    return driverPositions.filter(driver => {
      const realStatus = getRealDriverStatus(driver);
      return statusFilters.has(realStatus);
    });
  }, [driverPositions, statusFilters]);

  // Calcular contadores por estado
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    driverPositions.forEach(driver => {
      const realStatus = getRealDriverStatus(driver);
      counts[realStatus] = (counts[realStatus] || 0) + 1;
    });
    return counts;
  }, [driverPositions]);

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
      mapInstance.fitBounds(driversBounds, { padding: [20, 20] });
      setHasInitiallyCentered(true);
    }
  }, [mapInstance, driversBounds, hasInitiallyCentered]);

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
            drivers={filteredDrivers}
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
        <div className="absolute top-28 right-4 z-[1000] bg-red-50/95 backdrop-blur-sm border border-red-200 rounded-lg p-3 max-w-sm">
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
        <div className="absolute top-28 right-4 z-[1000] bg-blue-50/95 backdrop-blur-sm border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span className="text-xs text-blue-800">Actualizando...</span>
          </div>
        </div>
      )}

      {/* Controles unificados - Selector de rutas y conteo de conductores */}
      <div className="absolute top-4 right-4 z-[1000] w-80">
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
                    {filteredDrivers.length} de {driverPositions.length} conductor{driverPositions.length !== 1 ? 'es' : ''}
                  </div>
                  <div className="text-xs text-gray-600">
                    {wsConnected ? 'Conectado' : 'Desconectado'}
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

          {/* Status Filters */}
          <div className="px-4 pb-4">
            <div className="space-y-2">
              {[
                { status: 'DRIVING', label: 'Manejando', color: 'bg-green-500' },
                { status: 'IDLE', label: 'Inactivo', color: 'bg-yellow-500' },
                { status: 'STOPPED', label: 'Detenido', color: 'bg-orange-500' },
                { status: 'BREAK', label: 'En Parada', color: 'bg-purple-500' },
                { status: 'OFFLINE', label: 'Offline', color: 'bg-red-500' }
              ].map(({ status, label, color }) => (
                <label key={status} className="flex items-center space-x-2 cursor-pointer">
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
                      setStatusFilters(newFilters);
                    }}
                    className="sr-only"
                  />
                  <div className={`w-3 h-3 rounded-full ${color} ${statusFilters.has(status) ? 'opacity-100' : 'opacity-30'}`}></div>
                  <span className="text-xs text-gray-600">
                    {label} ({statusCounts[status] || 0})
                  </span>
                </label>
              ))}
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
