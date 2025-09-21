'use client';

import React, { useEffect, useRef } from 'react';
import { DriverPosition } from '@/hooks/useDriverPositions';
import { RouteDriverPosition } from '@/hooks/useRouteDriverPositions';

type CombinedDriverPosition = DriverPosition | RouteDriverPosition;

interface DriverMarkersProps {
  map: any;
  driverPositions: CombinedDriverPosition[];
  onDriverClick?: (driver: CombinedDriverPosition) => void;
}

export function DriverMarkers({ map, driverPositions, onDriverClick }: DriverMarkersProps) {
  const markersRef = useRef<Map<string, any>>(new Map());

  const getStatusColor = (status: CombinedDriverPosition['status']) => {
    switch (status) {
      case 'DRIVING':
        return '#10B981'; // Green
      case 'IDLE':
      case 'STOPPED':
        return '#F59E0B'; // Yellow
      case 'ON_BREAK':
        return '#8B5CF6'; // Purple
      case 'OFFLINE':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: CombinedDriverPosition['status']) => {
    switch (status) {
      case 'DRIVING':
        return `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        `;
      case 'IDLE':
      case 'STOPPED':
        return `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        `;
      case 'ON_BREAK':
        return `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        `;
      case 'OFFLINE':
        return `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        `;
      default:
        return `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        `;
    }
  };

  const createMarkerElement = (driver: CombinedDriverPosition) => {
    const el = document.createElement('div');
    el.className = 'driver-marker';
    
    const statusColor = getStatusColor(driver.status);
    const statusIcon = getStatusIcon(driver.status);
    const isRouteDriver = 'routeName' in driver;
    
    el.innerHTML = `
      <div class="relative group">
        <div class="w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-110 transition-all duration-300 transform hover:shadow-xl" 
             style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd);">
          ${statusIcon}
        </div>
        ${driver.status === 'DRIVING' ? `
          <div class="absolute inset-0 rounded-full animate-ping" style="background-color: ${statusColor}; opacity: 0.3;"></div>
        ` : ''}
        ${isRouteDriver ? `
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
            <span class="text-xs text-white font-bold">R</span>
          </div>
        ` : ''}
      </div>
    `;
    
    return el;
  };

  const addMarker = (driver: CombinedDriverPosition) => {
    if (!map || !driver.location || !driver.location.latitude || !driver.location.longitude) {
      console.log('⚠️ ADD_MARKER - Datos inválidos para driver:', driver.driverId);
      return;
    }

    if (!window.mapboxgl || !window.mapboxgl.Marker) {
      console.log('⚠️ ADD_MARKER - MapboxGL no disponible');
      return;
    }

    console.log('➕ ADD_MARKER - Creando marker para driver:', driver.driverId, 'en:', driver.location.latitude, driver.location.longitude);

    const markerId = `driver-${driver.driverId}`;
    
    // Remove existing marker
    if (markersRef.current.has(markerId)) {
      const existingMarker = markersRef.current.get(markerId);
      if (existingMarker && typeof existingMarker.remove === 'function') {
        existingMarker.remove();
      }
      markersRef.current.delete(markerId);
    }

    // Create new marker
    const marker = new window.mapboxgl.Marker({ 
      element: createMarkerElement(driver)
    })
      .setLngLat([driver.location.longitude, driver.location.latitude])
      .addTo(map);

    console.log('✅ MARKER_ADDED - Marker agregado al mapa para driver:', driver.driverId);

    // Create popup with mobile-optimized driver information
    const isRouteDriver = 'routeName' in driver;
    const popup = new window.mapboxgl.Popup({ 
      offset: 15,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '280px',
      className: 'mobile-popup'
    }).setHTML(`
      <div class="p-3 bg-white rounded-lg shadow-xl max-w-[260px]">
        <!-- Header - Compact -->
        <div class="flex items-center space-x-2 mb-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg" 
               style="background: linear-gradient(135deg, ${getStatusColor(driver.status)}, ${getStatusColor(driver.status)}dd);">
            ${getStatusIcon(driver.status)}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-900 text-sm truncate">${driver.driverName}</h3>
            <p class="text-xs text-gray-600 truncate">${'vehicleId' in driver ? (driver.vehicleId || 'N/A') : 'N/A'}</p>
          </div>
          <div class="text-right">
            <div class="text-xs font-semibold" style="color: ${getStatusColor(driver.status)};">
              ${driver.status === 'DRIVING' ? 'Conduciendo' : 
                driver.status === 'IDLE' || driver.status === 'STOPPED' ? 'Inactivo' :
                driver.status === 'ON_BREAK' ? 'En descanso' : 'Desconectado'}
            </div>
          </div>
        </div>
        
        <!-- Route Info - Compact -->
        <div class="bg-gray-50 rounded p-2 mb-2">
          <div class="flex items-center space-x-1 mb-1">
            <div class="w-1.5 h-1.5 ${driver.routeId ? 'bg-blue-500' : 'bg-gray-400'} rounded-full"></div>
            <span class="text-xs font-medium text-gray-700">
              ${driver.routeId ? (isRouteDriver ? 'Ruta Específica' : 'Ruta Asignada') : 'Sin Ruta'}
            </span>
          </div>
          <p class="text-xs text-gray-600 truncate">
            ${driver.routeName || 'No hay ruta asignada'}
          </p>
        </div>
        
        <!-- Location & Speed - Inline -->
        <div class="flex items-center justify-between text-xs text-gray-600 mb-2">
          <div class="flex items-center space-x-1">
            <span class="text-blue-600">📍</span>
            <span>${driver.location.latitude.toFixed(1)}, ${driver.location.longitude.toFixed(1)}</span>
          </div>
          <div class="flex items-center space-x-1">
            <span class="text-green-600">⚡</span>
            <span>${Math.round(driver.location.speed || 0)} km/h</span>
          </div>
        </div>

        <!-- Signal & Battery - Compact Row -->
        ${'signalStrength' in driver || 'batteryLevel' in driver ? `
          <div class="flex items-center justify-between text-xs text-gray-600 mb-2">
            ${'signalStrength' in driver ? `
              <div class="flex items-center space-x-1">
                <div class="w-1.5 h-1.5 ${(driver as any).signalStrength > 70 ? 'bg-green-500' : (driver as any).signalStrength > 40 ? 'bg-yellow-500' : 'bg-red-500'} rounded-full"></div>
                <span>Señal: ${Math.round((driver as any).signalStrength)}%</span>
              </div>
            ` : ''}
            ${'batteryLevel' in driver ? `
              <div class="flex items-center space-x-1">
                <span>🔋</span>
                <span>${Math.round((driver as any).batteryLevel)}%</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <!-- Footer - Compact -->
        <div class="border-t pt-2">
          <div class="text-xs text-gray-500 text-center">
            ${new Date(driver.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    `);

    marker.setPopup(popup);

    // Add click handler
    marker.getElement().addEventListener('click', () => {
      if (onDriverClick) {
        onDriverClick(driver);
      }
    });

    markersRef.current.set(markerId, marker);
  };

  const clearAllMarkers = () => {
    markersRef.current.forEach((marker) => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });
    markersRef.current.clear();
  };

  // PUNTO 3: Crear markers solo cuando cambie el mapa o la cantidad de drivers
  useEffect(() => {
    if (!map || !window.mapboxgl) {
      return;
    }

    console.log('🔄 MARKERS - Creando/actualizando markers, total drivers:', driverPositions.length);
    
    // Clear all existing markers
    clearAllMarkers();

    // Add new markers
    if (driverPositions.length > 0) {
      driverPositions.forEach((driver, index) => {
        if (driver.location && driver.location.latitude && driver.location.longitude) {
          console.log(`📍 MARKER ${index + 1} - Agregando driver:`, driver.driverId, 'en:', driver.location.latitude, driver.location.longitude);
          addMarker(driver);
        } else {
          console.log(`⚠️ MARKER ${index + 1} - Driver sin ubicación válida:`, driver.driverId);
        }
      });
    }
  }, [map, driverPositions.length]); // Solo cuando cambie el mapa o la cantidad de drivers

  // Actualizar posiciones de markers existentes cuando cambien las coordenadas
  useEffect(() => {
    if (!map || !window.mapboxgl || driverPositions.length === 0) {
      return;
    }

    console.log('🔄 POSICIONES - Actualizando posiciones de markers existentes');
    console.log('🔄 POSICIONES - Drivers a actualizar:', driverPositions.map(d => ({
      id: d.driverId,
      lat: d.location?.latitude,
      lng: d.location?.longitude
    })));
    
    driverPositions.forEach((driver) => {
      if (driver.location && driver.location.latitude && driver.location.longitude) {
        const markerId = `driver-${driver.driverId}`;
        const marker = markersRef.current.get(markerId);
        if (marker) {
          console.log(`📍 MOVIENDO - Marker ${driver.driverId} a:`, driver.location.latitude, driver.location.longitude);
          // Actualizar posición del marker existente
          marker.setLngLat([driver.location.longitude, driver.location.latitude]);
        } else {
          console.log(`⚠️ MARKER NO ENCONTRADO - Para driver:`, driver.driverId, 'con markerId:', markerId);
          console.log(`🔍 MARKERS DISPONIBLES - IDs:`, Array.from(markersRef.current.keys()));
        }
      }
    });
  }, [driverPositions.map(d => `${d.location?.latitude}-${d.location?.longitude}`).join(',')]); // Solo cuando cambien las coordenadas

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllMarkers();
    };
  }, []);

  return null;
}