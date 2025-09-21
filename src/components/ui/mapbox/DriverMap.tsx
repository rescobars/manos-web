'use client';

import React, { useState, useCallback } from 'react';
import { BaseMap, useMap } from './BaseMap';
import { DriverMarkers } from './DriverMarkers';
import { MapControls } from './MapControls';
import { useDriverPositions } from '@/hooks/useDriverPositions';
import { DriverPosition } from '@/hooks/useDriverPositions';
import { useAuth } from '@/contexts/AuthContext';

interface DriverMapProps {
  className?: string;
  onDriverClick?: (driver: DriverPosition) => void;
}

export function DriverMap({ className = 'w-full h-full', onDriverClick }: DriverMapProps) {
  const { map, isMapReady, handleMapReady } = useMap();
  const { driverPositions, loading, error, refetch } = useDriverPositions();
  const [showDrivers, setShowDrivers] = useState(true);
  const { currentOrganization, isLoading: authLoading } = useAuth();

  const handleFitToDrivers = useCallback(() => {
    if (!map || !isMapReady || driverPositions.length === 0) return;

    try {
      const bounds = new window.mapboxgl.LngLatBounds();
      
      driverPositions.forEach((driver) => {
        if (driver.location && driver.location.latitude && driver.location.longitude) {
          bounds.extend([driver.location.longitude, driver.location.latitude]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      console.error('Error fitting bounds to drivers:', error);
    }
  }, [map, isMapReady, driverPositions]);

  const handleToggleDrivers = useCallback(() => {
    setShowDrivers(prev => !prev);
  }, []);

  const handleDriverClick = useCallback((driver: DriverPosition) => {
    if (onDriverClick) {
      onDriverClick(driver);
    }
  }, [onDriverClick]);

  // Default center to Guatemala City
  const defaultCenter: [number, number] = [-90.5069, 14.6349];

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
        {isMapReady && map && showDrivers && driverPositions.length > 0 && (
          <DriverMarkers
            map={map}
            driverPositions={driverPositions}
            onDriverClick={handleDriverClick}
          />
        )}
      </BaseMap>

      {/* Map controls */}
      {isMapReady && (
        <MapControls
          map={map}
          driverPositions={driverPositions}
          loading={loading}
          onRefresh={refetch}
          onFitToDrivers={handleFitToDrivers}
          onToggleDrivers={handleToggleDrivers}
          showDrivers={showDrivers}
        />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute top-4 left-4 z-10 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 text-red-600">⚠️</div>
            <div>
              <h3 className="text-sm font-semibold text-red-800">Error</h3>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && !authLoading && (
        <div className="absolute top-4 left-4 z-10 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-800">Actualizando posiciones...</span>
          </div>
        </div>
      )}

      {/* Driver count indicator */}
      {isMapReady && driverPositions.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-white border border-gray-200 rounded-xl p-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-30"></div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {driverPositions.length}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                conductor{driverPositions.length !== 1 ? 'es' : ''} en línea
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Activos</div>
              <div className="text-sm font-semibold text-green-600">
                {driverPositions.filter(d => d.status === 'DRIVING').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {isMapReady && driverPositions.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 bg-white border border-gray-200 rounded-xl p-4 shadow-xl max-w-xs">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Leyenda</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Conduciendo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Inactivo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">En descanso</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-gray-600">Desconectado</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
