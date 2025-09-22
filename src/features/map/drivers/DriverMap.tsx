'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseMap } from '@/components/map/leaflet/base/BaseMap';
import { DriverMarkers } from '@/components/map/leaflet/markers/DriverMarkers';
import { DriverDetailsModal } from '@/components/ui/DriverDetailsModal';
import { MapTileSelector, MapTileType } from '@/components/ui/leaflet';
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
  const [previousStatusFilters, setPreviousStatusFilters] = useState<Set<string>>(new Set(['DRIVING', 'IDLE', 'STOPPED', 'BREAK', 'OFFLINE']));
  const [previousSelectedRoutes, setPreviousSelectedRoutes] = useState<string[]>([]);
  const [tileType, setTileType] = useState<MapTileType>('streets');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

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
      mapInstance.fitBounds(driversBounds, { 
        padding: [20, 20],
        maxZoom: 16
      });
      setHasInitiallyCentered(true);
    }
  }, [mapInstance, driversBounds, hasInitiallyCentered]);

  // Función para centrar el mapa solo en marcadores visibles
  const centerMapToVisibleDrivers = useCallback(() => {
    if (mapInstance && filteredDrivers.length > 0) {
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
    }
  }, [mapInstance, filteredDrivers]);

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
                          !selectedRouteIds.every(routeId => previousSelectedRoutes.includes(routeId));
    
    if (routesChanged && hasInitiallyCentered) {
      console.log('🎯 RUTAS SELECCIONADAS CAMBIARON - Centrando mapa a conductores visibles');
      centerMapToVisibleDrivers();
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

      {/* Controles unificados - Selector de rutas, conteo de conductores y cartografía */}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  {wsConnected && (
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-30"></div>
                  )}
                </div>
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
              
              {/* Botón para expandir/colapsar filtros */}
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title={filtersExpanded ? 'Ocultar filtros' : 'Mostrar filtros'}
              >
                <span>{filtersExpanded ? 'Ocultar' : 'Filtros'}</span>
                <svg 
                  className={`w-3 h-3 transition-transform duration-200 ${filtersExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

            {/* Status Filters - Collapsible */}
            {filtersExpanded && (
              <div className="px-4 pb-4 border-b border-gray-200 animate-in slide-in-from-top-1 duration-200">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    Filtrar por Estado
                  </div>
                  {[
                    { status: 'DRIVING', label: 'Manejando', color: '#10B981' },
                    { status: 'IDLE', label: 'Inactivo', color: '#F59E0B' },
                    { status: 'STOPPED', label: 'Detenido', color: '#EF4444' },
                    { status: 'BREAK', label: 'En Parada', color: '#8B5CF6' },
                    { status: 'OFFLINE', label: 'Offline', color: '#6B7280' }
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
                      <div 
                        className={`w-3 h-3 rounded-full ${statusFilters.has(status) ? 'opacity-100' : 'opacity-30'}`}
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-xs text-gray-600">
                        {label} ({statusCounts[status] || 0})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de cartografía */}
            <div className="p-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 block">
                  Tipo de Mapa
                </label>
                <div className="w-full">
                  <MapTileSelector
                    onTileChange={setTileType}
                    className="w-full"
                  />
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
