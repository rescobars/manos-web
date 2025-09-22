'use client';

import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { CombinedDriverPosition } from '@/lib/leaflet/types';
import { 
  createDriverIcon, 
  toLeafletLatLng, 
  getRealDriverStatus,
  isDriverOffline 
} from '@/lib/leaflet/utils';

interface DriverMarkersProps {
  drivers: CombinedDriverPosition[];
  selectedDriver?: CombinedDriverPosition | null;
  selectedRouteIds?: string[];
  onDriverClick?: (driver: CombinedDriverPosition) => void;
}

export function DriverMarkers({ 
  drivers, 
  selectedDriver, 
  selectedRouteIds = [], 
  onDriverClick 
}: DriverMarkersProps) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Filtrar conductores basado en las rutas seleccionadas
  const filteredDrivers = drivers.filter(driver => {
    // Si no hay rutas seleccionadas, mostrar todos los conductores
    if (selectedRouteIds.length === 0) {
      return true;
    }
    
    // Si es un conductor de ruta, verificar si su ruta está seleccionada
    if ('routeId' in driver) {
      return selectedRouteIds.includes(driver.routeId);
    }
    
    // Si es un conductor de organización, no mostrarlo cuando hay rutas seleccionadas
    return false;
  });

  // Crear marcador para un conductor
  const createDriverMarker = (driver: CombinedDriverPosition): L.Marker => {
    const realStatus = getRealDriverStatus(driver);
    const isSelected = selectedDriver?.driverId === driver.driverId;
    const icon = createDriverIcon(realStatus, isSelected);
    
    const marker = L.marker(toLeafletLatLng(driver.location), { icon });
    
    // Agregar datos del conductor al marcador
    (marker as any).driverData = driver;
    
    // Agregar evento de clic
    marker.on('click', () => {
      if (onDriverClick) {
        onDriverClick(driver);
      }
    });
    
    // Agregar popup básico
    const popupContent = `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${driver.driverName}</h3>
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">
          ${'routeName' in driver ? driver.routeName : 'Conductor General'}
        </p>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #888;">
          Estado: ${realStatus}
        </p>
        <p style="margin: 0; font-size: 12px; color: #888;">
          Velocidad: ${Math.round(driver.location.speed || 0)} km/h
        </p>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    
    return marker;
  };

  // Actualizar marcadores existentes
  const updateExistingMarkers = () => {
    filteredDrivers.forEach(driver => {
      const markerId = `driver-${driver.driverId}`;
      const existingMarker = markersRef.current.get(markerId);
      
      if (existingMarker) {
        // Actualizar posición del marcador
        const newPosition = toLeafletLatLng(driver.location);
        existingMarker.setLatLng(newPosition);
        
        // Actualizar icono si cambió el estado
        const realStatus = getRealDriverStatus(driver);
        const isSelected = selectedDriver?.driverId === driver.driverId;
        const newIcon = createDriverIcon(realStatus, isSelected);
        existingMarker.setIcon(newIcon);
        
        // Actualizar datos del conductor
        (existingMarker as any).driverData = driver;
      }
    });
  };

  // Limpiar marcadores que ya no están en la lista filtrada
  const cleanupMarkers = () => {
    const currentDriverIds = new Set(filteredDrivers.map(driver => driver.driverId));
    
    markersRef.current.forEach((marker, markerId) => {
      const driverId = markerId.replace('driver-', '');
      if (!currentDriverIds.has(driverId)) {
        map.removeLayer(marker);
        markersRef.current.delete(markerId);
      }
    });
  };

  // Agregar nuevos marcadores
  const addNewMarkers = () => {
    filteredDrivers.forEach(driver => {
      const markerId = `driver-${driver.driverId}`;
      
      if (!markersRef.current.has(markerId)) {
        const marker = createDriverMarker(driver);
        marker.addTo(map);
        markersRef.current.set(markerId, marker);
      }
    });
  };

  // Efecto principal para manejar marcadores
  useEffect(() => {
    if (!map || filteredDrivers.length === 0) {
      // Limpiar todos los marcadores si no hay conductores
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current.clear();
      return;
    }

    // Limpiar marcadores que ya no están
    cleanupMarkers();
    
    // Actualizar marcadores existentes
    updateExistingMarkers();
    
    // Agregar nuevos marcadores
    addNewMarkers();
  }, [map, filteredDrivers, selectedDriver]);

  // Limpiar marcadores al desmontar
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current.clear();
    };
  }, [map]);

  return null; // Este componente no renderiza nada visualmente
}
