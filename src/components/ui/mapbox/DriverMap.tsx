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
    updateSelectedRoutes,
    wsConnected,
    setMapCentered,
    setMapCenteringComplete,
    wsReady
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
    console.log('📍 CALCULANDO BOUNDS - Drivers disponibles:', driverPositions.length);
    
    if (driverPositions.length === 0) {
      console.log('⚠️ BOUNDS - No hay drivers para calcular bounds');
      return null;
    }

    const lats = driverPositions.map(driver => driver.location.latitude);
    const lngs = driverPositions.map(driver => driver.location.longitude);

    console.log('📍 BOUNDS - Latitudes:', lats);
    console.log('📍 BOUNDS - Longitudes:', lngs);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add some padding to the bounds
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    const bounds = {
      north: maxLat + latPadding,
      south: minLat - latPadding,
      east: maxLng + lngPadding,
      west: minLng - lngPadding
    };

    console.log('📍 BOUNDS CALCULADOS:', bounds);
    return bounds;
  }, [driverPositions]);

  // Calcular el centro inicial basado en las posiciones de los drivers
  const initialCenter = useMemo(() => {
    if (driverPositions.length > 0 && driversBounds) {
      const centerLng = (driversBounds.west + driversBounds.east) / 2;
      const centerLat = (driversBounds.south + driversBounds.north) / 2;
      console.log('📍 CENTRO INICIAL - Calculado desde drivers:', [centerLng, centerLat]);
      return [centerLng, centerLat] as [number, number];
    }
    console.log('📍 CENTRO INICIAL - Usando centro por defecto:', defaultCenter);
    return defaultCenter;
  }, [driverPositions.length, driversBounds]);

  // PUNTO 3: Centrar el mapa con las posiciones (solo si es necesario)
  const [hasCentered, setHasCentered] = useState(false);
  
  useEffect(() => {
    console.log('🔍 PUNTO 3 - Verificando condiciones para centrar:', {
      map: !!map,
      isMapReady,
      driversBounds: !!driversBounds,
      driverPositionsLength: driverPositions.length,
      hasCentered,
      mapStyleLoaded: map?.isStyleLoaded?.()
    });

    if (map && isMapReady && driversBounds && driverPositions.length > 0 && !hasCentered) {
      // Verificar si el mapa ya está en la posición correcta
      const currentCenter = map.getCenter();
      const expectedCenter = {
        lng: (driversBounds.west + driversBounds.east) / 2,
        lat: (driversBounds.south + driversBounds.north) / 2
      };
      
      const distance = Math.sqrt(
        Math.pow(currentCenter.lng - expectedCenter.lng, 2) + 
        Math.pow(currentCenter.lat - expectedCenter.lat, 2)
      );
      
      console.log('📍 POSICIÓN ACTUAL - Centro actual:', currentCenter);
      console.log('📍 POSICIÓN ESPERADA - Centro esperado:', expectedCenter);
      console.log('📍 DISTANCIA - Distancia entre centros:', distance);
      
      // Solo centrar si la distancia es significativa (más de 0.01 grados)
      if (distance > 0.01) {
        if (map.isStyleLoaded()) {
          console.log('🎯 PUNTO 3 - Centrando mapa en drivers (distancia significativa)');
          console.log('🎯 PUNTO 3 - Bounds:', driversBounds);
          
          map.fitBounds([
            [driversBounds.west, driversBounds.south],
            [driversBounds.east, driversBounds.north]
          ], {
            padding: 50,
            maxZoom: 16,
            duration: 2000
          });
          
          setHasCentered(true);
          
          // Notificar que el mapa se centró
          setTimeout(() => {
            console.log('✅ PUNTO 3 - Mapa centrado correctamente');
            setMapCentered(true);
            setMapCenteringComplete(true);
          }, 2500);
        } else {
          console.log('⚠️ PUNTO 3 - Mapa no está listo, esperando...');
          // Esperar a que el mapa esté completamente listo
          const timer = setTimeout(() => {
            if (map.isStyleLoaded() && !hasCentered) {
              console.log('🎯 PUNTO 3 - Centrando mapa en drivers (retry)');
              map.fitBounds([
                [driversBounds.west, driversBounds.south],
                [driversBounds.east, driversBounds.north]
              ], {
                padding: 50,
                maxZoom: 16,
                duration: 2000
              });
              setHasCentered(true);
              setTimeout(() => {
                console.log('✅ PUNTO 3 - Mapa centrado correctamente (retry)');
                setMapCentered(true);
                setMapCenteringComplete(true);
              }, 2500);
            }
          }, 1000);
          
          return () => clearTimeout(timer);
        }
      } else {
        console.log('✅ PUNTO 3 - Mapa ya está en la posición correcta, no es necesario centrar');
        setHasCentered(true);
        setMapCentered(true);
        setMapCenteringComplete(true);
      }
    }
  }, [map, isMapReady, driversBounds, driverPositions.length, hasCentered, setMapCentered, setMapCenteringComplete]);

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
      {/* PUNTO 2: Cargar el mapa - solo cuando tengamos posiciones de drivers */}
      {driverPositions.length > 0 ? (
        <BaseMap
          center={initialCenter}
          zoom={12}
          onMapReady={handleMapReady}
          className={className}
        >
          {/* Driver markers - render when map is ready and we have driver data */}
          {isMapReady && map && driverPositions.length > 0 && (
            <DriverMarkers
              map={map}
              driverPositions={driverPositions}
              onDriverClick={handleDriverClick}
            />
          )}
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


      {/* Unified Controls Container - Route Selector and Driver Count */}
      {isMapReady && (
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
                      ) : (
                        <span className="ml-2 text-gray-500">
                          (Todos los conductores)
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-1">
                      <span className={`font-medium ${
                        wsConnected ? 'text-green-600' : 
                        wsReady ? 'text-yellow-600' : 
                        'text-gray-500'
                      }`}>
                        {wsConnected ? '🟢 Tiempo real' : 
                         wsReady ? '🟡 Conectando...' : 
                         '⏳ Esperando...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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