'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DriverPosition } from '@/hooks/useDriverPositions';
import { RouteDriverPosition } from '@/hooks/useRouteDriverPositions';

type CombinedDriverPosition = DriverPosition | RouteDriverPosition;

interface DriverMarkersProps {
  map: any;
  driverPositions: CombinedDriverPosition[];
  onDriverClick?: (driver: CombinedDriverPosition) => void;
  onMarkersLoaded?: () => void;
}

export function DriverMarkers({ map, driverPositions, onDriverClick, onMarkersLoaded }: DriverMarkersProps) {
  const markersRef = useRef<Map<string, any>>(new Map());
  const [markersLoading, setMarkersLoading] = useState(false);

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
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
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

  const createDriverMarker = (driver: CombinedDriverPosition) => {
    const el = document.createElement('div');
    el.className = 'driver-marker';
    
    const statusColor = getStatusColor(driver.status);
    const statusIcon = getStatusIcon(driver.status);
    
    // Check if it's a RouteDriverPosition (has different structure)
    const isRouteDriver = 'routeName' in driver;
    const batteryLevel = 'batteryLevel' in driver ? driver.batteryLevel : 100;
    const batteryColor = batteryLevel > 20 ? '#10B981' : batteryLevel > 10 ? '#F59E0B' : '#EF4444';
    
    el.innerHTML = `
      <div class="relative group">
        <!-- Main marker -->
        <div class="w-14 h-14 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:scale-110 transition-all duration-300 transform hover:shadow-2xl" 
             style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd);">
          ${statusIcon}
        </div>
                
        <!-- Pulse animation for active drivers -->
        ${driver.status === 'DRIVING' ? `
          <div class="absolute inset-0 rounded-full animate-ping" style="background-color: ${statusColor}; opacity: 0.3;"></div>
        ` : ''}
        
        <!-- Route indicator for route drivers -->
        ${isRouteDriver ? `
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
            <span class="text-xs text-white font-bold">R</span>
          </div>
        ` : ''}
      </div>
    `;
    
    return el;
  };

  const addDriverMarker = (driver: CombinedDriverPosition) => {
    if (!map || !map.isStyleLoaded || !driver.location) {
      console.log('Map not ready for marker:', { map: !!map, styleLoaded: map?.isStyleLoaded, location: !!driver.location });
      return;
    }

    // Check if mapboxgl is available
    if (!window.mapboxgl || !window.mapboxgl.Marker) {
      console.log('MapboxGL not available');
      return;
    }

    // Additional check to ensure map container is ready
    const container = map.getContainer();
    if (!container || !container.parentNode) {
      console.log('Map container not ready');
      return;
    }

    // Check if map is fully loaded and ready
    if (!map.loaded() || !map.getStyle()) {
      console.log('Map not fully loaded');
      return;
    }

    try {
      const markerId = `driver-${driver.driverId}`;
      
      // Remove existing marker if it exists
      if (markersRef.current.has(markerId)) {
        const existingMarker = markersRef.current.get(markerId);
        if (existingMarker && typeof existingMarker.remove === 'function') {
          existingMarker.remove();
        }
        markersRef.current.delete(markerId);
      }

      const marker = new window.mapboxgl.Marker({ 
        element: createDriverMarker(driver)
      })
        .setLngLat([driver.location.longitude, driver.location.latitude])
        .addTo(map);

      // Add click handler
      marker.getElement().addEventListener('click', () => {
        if (onDriverClick) {
          onDriverClick(driver);
        }
      });

      // Create popup
      const isRouteDriver = 'routeName' in driver;
      const popup = new window.mapboxgl.Popup({ 
        offset: 30,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '320px'
      }).setHTML(`
        <div class="p-4 min-w-[280px] bg-white rounded-lg shadow-xl">
          <!-- Header -->
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg" 
                 style="background: linear-gradient(135deg, ${getStatusColor(driver.status)}, ${getStatusColor(driver.status)}dd);">
              ${getStatusIcon(driver.status)}
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-gray-900 text-lg">${driver.driverName}</h3>
              <p class="text-sm text-gray-600 font-medium">${'vehicleId' in driver ? (driver.vehicleId || 'N/A') : 'N/A'}</p>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500">Estado</div>
              <div class="font-semibold text-sm" style="color: ${getStatusColor(driver.status)};">
                ${driver.status === 'DRIVING' ? 'Conduciendo' : 
                  driver.status === 'IDLE' || driver.status === 'STOPPED' ? 'Inactivo' :
                  driver.status === 'ON_BREAK' ? 'En descanso' : 'Desconectado'}
              </div>
            </div>
          </div>
          
          <!-- Route Info -->
          <div class="bg-gray-50 rounded-lg p-3 mb-4">
            <div class="flex items-center space-x-2 mb-2">
              <div class="w-2 h-2 ${driver.routeId ? 'bg-blue-500' : 'bg-gray-400'} rounded-full"></div>
              <span class="text-sm font-medium text-gray-700">
                ${driver.routeId ? (isRouteDriver ? 'Ruta Específica' : 'Ruta Asignada') : 'Sin Ruta Asignada'}
              </span>
            </div>
            <p class="text-sm text-gray-600 font-medium">
              ${driver.routeName || 'No hay ruta asignada'}
            </p>
            ${isRouteDriver ? `
              <div class="mt-2 text-xs text-blue-600 font-medium">
                📍 Posición específica de ruta
              </div>
            ` : `
              <div class="mt-2 text-xs text-gray-500 italic">
                El conductor está disponible para asignación
              </div>
            `}
          </div>
          
          
          <!-- Signal & Network (only for regular drivers) -->
          ${'signalStrength' in driver ? `
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 ${driver.signalStrength > 70 ? 'bg-green-500' : driver.signalStrength > 40 ? 'bg-yellow-500' : 'bg-red-500'} rounded-full"></div>
                <span class="text-sm text-gray-600">Señal: ${Math.round(driver.signalStrength)}%</span>
              </div>
              <div class="text-sm text-gray-600 font-medium">${driver.networkType}</div>
            </div>
          ` : ''}
          
          <!-- Footer -->
          <div class="border-t pt-3">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>Última actualización</span>
              <span class="font-medium">${new Date(driver.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      `);

      marker.setPopup(popup);
      markersRef.current.set(markerId, marker);
    } catch (error) {
      console.error('Error adding driver marker:', error);
    }
  };

  const clearAllMarkers = () => {
    if (!map || !map.isStyleLoaded) {
      return;
    }

    try {
      markersRef.current.forEach((marker) => {
        if (marker && typeof marker.remove === 'function') {
          marker.remove();
        }
      });
      markersRef.current.clear();
    } catch (error) {
      console.error('Error clearing markers:', error);
    }
  };

  // Update markers when driver positions change
  useEffect(() => {
    // More robust validation
    if (!map || !map.isStyleLoaded || !map.loaded() || !map.getStyle()) {
      console.log('Map not ready for markers update');
      return;
    }

    // Check if mapboxgl is available
    if (!window.mapboxgl || !window.mapboxgl.Marker) {
      console.log('MapboxGL not available for markers');
      return;
    }

    if (driverPositions.length === 0) {
      clearAllMarkers();
      return;
    }

    const addMarkers = () => {
      console.log('Updating markers, count:', driverPositions.length);
      setMarkersLoading(true);
      
      // Get current driver IDs
      const currentDriverIds = new Set(driverPositions.map(d => d.driverId));
      
      // Remove markers that are no longer in the list
      const markersToRemove: string[] = [];
      markersRef.current.forEach((marker, markerId) => {
        if (!currentDriverIds.has(markerId)) {
          markersToRemove.push(markerId);
        }
      });
      
      console.log('Removing markers:', markersToRemove.length);
      
      // Remove outdated markers
      markersToRemove.forEach(markerId => {
        const marker = markersRef.current.get(markerId);
        if (marker && typeof marker.remove === 'function') {
          marker.remove();
        }
        markersRef.current.delete(markerId);
      });

      // Add or update markers for current drivers
      let addedCount = 0;
      driverPositions.forEach((driver) => {
        if (driver.location && driver.location.latitude && driver.location.longitude) {
          const markerId = driver.driverId;
          
          // Remove existing marker if it exists
          const existingMarker = markersRef.current.get(markerId);
          if (existingMarker && typeof existingMarker.remove === 'function') {
            existingMarker.remove();
          }
          
          // Add new marker
          try {
            addDriverMarker(driver);
            addedCount++;
          } catch (error) {
            console.error('Error adding marker:', error);
          }
        }
      });

      console.log('Added markers:', addedCount);

      setMarkersLoading(false);
      if (onMarkersLoaded) {
        onMarkersLoaded();
      }
    };

    // Execute immediately - no delays
    addMarkers();
  }, [map, driverPositions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllMarkers();
    };
  }, [map]);

  return null; // This component doesn't render anything visual
}
