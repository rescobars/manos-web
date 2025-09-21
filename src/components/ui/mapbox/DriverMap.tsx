'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { BaseMap, useMap } from './BaseMap';
import { DriverMarkers } from './DriverMarkers';
import { useDriverPositions } from '@/hooks/useDriverPositions';
import { useRouteDriverPositions } from '@/hooks/useRouteDriverPositions';
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
  const { driverPositions, loading, error } = useDriverPositions();
  const { inProgressRoutes, loading: routesLoading, error: routesError } = useInProgressRoutes();
  const { 
    routeDriverPositions, 
    selectedRouteIds, 
    loading: routeDriversLoading, 
    error: routeDriversError,
    updateSelectedRoutes 
  } = useRouteDriverPositions();
  const { currentOrganization, isLoading: authLoading } = useAuth();

  const handleDriverClick = useCallback((driver: DriverPosition | RouteDriverPosition) => {
    if (onDriverClick) {
      onDriverClick(driver);
    }
  }, [onDriverClick]);

  const handleRouteDriverClick = useCallback((driver: RouteDriverPosition) => {
    if (onDriverClick) {
      onDriverClick(driver);
    }
  }, [onDriverClick]);

  // Default center to Guatemala City
  const defaultCenter: [number, number] = [-90.5069, 14.6349];

  // Combine all driver positions (both general and route-specific)
  const allDriverPositions = useMemo(() => {
    const combined: (DriverPosition | RouteDriverPosition)[] = [...driverPositions];
    
    // Add route-specific drivers if any routes are selected
    if (selectedRouteIds.length > 0) {
      combined.push(...routeDriverPositions);
    }
    
    return combined;
  }, [driverPositions, routeDriverPositions, selectedRouteIds]);

  // Calculate bounds for all drivers
  const driversBounds = useMemo(() => {
    if (allDriverPositions.length === 0) return null;

    const lats = allDriverPositions.map(driver => driver.location.latitude);
    const lngs = allDriverPositions.map(driver => driver.location.longitude);

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
  }, [allDriverPositions]);

  // Center map on drivers when drivers are loaded and map is ready
  useEffect(() => {
    if (map && isMapReady && driversBounds && allDriverPositions.length > 0) {
      // Add a small delay to ensure markers are rendered first
      const centerMap = () => {
        if (map && map.isStyleLoaded()) {
          // Use fitBounds to center and zoom the map to show all drivers
          map.fitBounds([
            [driversBounds.west, driversBounds.south], // Southwest corner
            [driversBounds.east, driversBounds.north]  // Northeast corner
          ], {
            padding: 50, // Add padding around the bounds
            maxZoom: 16, // Don't zoom in too much
            duration: 1000 // Smooth animation
          });
        }
      };

      // Try immediately, then with delays if needed
      centerMap();
      setTimeout(centerMap, 500);
      setTimeout(centerMap, 1000);
    }
  }, [map, isMapReady, driversBounds, allDriverPositions.length]);

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
        {isMapReady && map && allDriverPositions.length > 0 && (
          <DriverMarkers
            map={map}
            driverPositions={allDriverPositions}
            onDriverClick={handleDriverClick}
          />
        )}
      </BaseMap>

      {/* Route Selector Dropdown */}
      <div className="absolute top-4 right-4 z-30">
        <RouteSelector
          routes={inProgressRoutes}
          selectedRouteIds={selectedRouteIds}
          onSelectionChange={updateSelectedRoutes}
          loading={routesLoading}
          error={routesError}
        />
      </div>


      {/* Error state */}
      {(error || routeDriversError) && (
        <div className="absolute top-28 left-4 z-10 bg-red-50/95 backdrop-blur-sm border border-red-200 rounded-lg p-3 max-w-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 text-red-600">⚠️</div>
            <div>
              <h3 className="text-xs font-semibold text-red-800">Error</h3>
              <p className="text-xs text-red-700">{error || routeDriversError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {(loading || routeDriversLoading) && !authLoading && (
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
                  {allDriverPositions.length} conductor{allDriverPositions.length !== 1 ? 'es' : ''}
                </div>
                <div className="text-xs text-gray-600">
                  {allDriverPositions.filter(d => d.status === 'DRIVING').length} activos
                  {selectedRouteIds.length > 0 && (
                    <span className="ml-2 text-blue-600">
                      ({selectedRouteIds.length} ruta{selectedRouteIds.length !== 1 ? 's' : ''} seleccionada{selectedRouteIds.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend - more compact */}
      {isMapReady && allDriverPositions.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Leyenda</h4>
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
        </div>
      )}
    </div>
  );
}
