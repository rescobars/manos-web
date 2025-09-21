'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseMap, useMap } from './BaseMap';
import { DriverMarkers } from './DriverMarkers';
import { useUnifiedDriverPositions } from '@/hooks/useUnifiedDriverPositions';
import { useInProgressRoutes } from '@/hooks/useInProgressRoutes';
import { RouteSelector } from '@/components/ui/RouteSelector';
import { DriverPosition } from '@/hooks/useDriverPositions';
import { RouteDriverPosition } from '@/hooks/useRouteDriverPositions';
import { useAuth } from '@/contexts/AuthContext';

interface DriverMapProps {
  className?: string;
  onDriverClick?: (driver: DriverPosition | RouteDriverPosition) => void;
}

export function DriverMap({ className = 'w-full h-full', onDriverClick }: DriverMapProps) {
  const { map, isMapReady, handleMapReady } = useMap();
  const { inProgressRoutes, loading: routesLoading, error: routesError } = useInProgressRoutes();
  const { 
    driverPositions, 
    selectedRouteIds, 
    loading, 
    error,
    updateSelectedRoutes 
  } = useUnifiedDriverPositions();
  const { currentOrganization, isLoading: authLoading } = useAuth();

  const handleDriverClick = useCallback((driver: DriverPosition | RouteDriverPosition) => {
    if (onDriverClick) {
      onDriverClick(driver);
    }
  }, [onDriverClick]);

  // Default center to Guatemala City
  const defaultCenter: [number, number] = [-90.5069, 14.6349];

  // Calculate bounds for all drivers
  const driversBounds = useMemo(() => {
    if (driverPositions.length === 0) return null;

    const lats = driverPositions.map(driver => driver.location.latitude);
    const lngs = driverPositions.map(driver => driver.location.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add some padding to the bounds
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    return {
      north: maxLat + latPadding,
      south: minLat - latPadding,
      east: maxLng + lngPadding,
      west: minLng - lngPadding
    };
  }, [driverPositions]);

  // Center map on drivers when drivers are loaded and map is ready
  useEffect(() => {
    if (map && isMapReady && driversBounds && driverPositions.length > 0) {
      if (map.isStyleLoaded()) {
        map.fitBounds([
          [driversBounds.west, driversBounds.south],
          [driversBounds.east, driversBounds.north]
        ], {
          padding: 50,
          maxZoom: 16,
          duration: 1000
        });
      }
    }
  }, [map, isMapReady, driversBounds, driverPositions.length]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando organización...</p>
        </div>
      </div>
    );
  }

  // Show message if no organization
  if (!currentOrganization) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <div className="w-16 h-16 text-gray-400 mx-auto mb-4">🏢</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay organización seleccionada</h3>
          <p className="text-gray-600">Selecciona una organización para ver las posiciones de los conductores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <BaseMap
        center={defaultCenter}
        zoom={12}
        onMapReady={handleMapReady}
        className={className}
      >
        {/* Driver markers - only render when map is fully ready and we have driver data */}
        {isMapReady && map && driverPositions.length > 0 && (
          <DriverMarkers
            map={map}
            driverPositions={driverPositions}
            onDriverClick={handleDriverClick}
          />
        )}
      </BaseMap>

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


      {/* Driver count indicator - always visible */}
      {isMapReady && (
        <div className="absolute top-16 left-4 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-30"></div>
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
                  ) : (
                    <span className="ml-2 text-gray-500">
                      (Todos los conductores)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Selector Dropdown - below driver count */}
      {isMapReady && (
        <div className="absolute top-32 left-4 z-30">
          <RouteSelector
            routes={inProgressRoutes}
            selectedRouteIds={selectedRouteIds}
            onSelectionChange={updateSelectedRoutes}
            loading={routesLoading}
            error={routesError}
          />
        </div>
      )}

      {/* Legend - more compact */}
      {isMapReady && driverPositions.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">
            {selectedRouteIds.length > 0 ? 'Leyenda - Rutas Seleccionadas' : 'Leyenda - Todos los Conductores'}
          </h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Conduciendo</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Inactivo</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Descanso</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-gray-600">Offline</span>
            </div>
          </div>
          {selectedRouteIds.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Conductores de ruta específica</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}