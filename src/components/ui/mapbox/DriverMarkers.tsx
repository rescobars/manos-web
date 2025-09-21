'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DriverPosition } from '@/hooks/useDriverPositions';

interface DriverMarkersProps {
  map: any;
  driverPositions: DriverPosition[];
  onDriverClick?: (driver: DriverPosition) => void;
  onMarkersLoaded?: () => void;
}

export function DriverMarkers({ map, driverPositions, onDriverClick, onMarkersLoaded }: DriverMarkersProps) {
  const markersRef = useRef<Map<string, any>>(new Map());
  const [markersLoading, setMarkersLoading] = useState(false);

  const getStatusColor = (status: DriverPosition['status']) => {
    switch (status) {
      case 'DRIVING':
        return '#10B981'; // Green
      case 'IDLE':
        return '#F59E0B'; // Yellow
      case 'ON_BREAK':
        return '#8B5CF6'; // Purple
      case 'OFFLINE':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: DriverPosition['status']) => {
    switch (status) {
      case 'DRIVING':
        return '🚗';
      case 'IDLE':
        return '⏸️';
      case 'ON_BREAK':
        return '☕';
      case 'OFFLINE':
        return '📴';
      default:
        return '🚗';
    }
  };

  const createDriverMarker = (driver: DriverPosition) => {
    const el = document.createElement('div');
    el.className = 'driver-marker';
    
    const statusColor = getStatusColor(driver.status);
    const statusIcon = getStatusIcon(driver.status);
    
    el.innerHTML = `
      <div class="relative">
        <div class="w-12 h-12 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-110 transition-transform duration-200" 
             style="background-color: ${statusColor};">
          ${statusIcon}
        </div>
        <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold" 
             style="background-color: ${driver.batteryLevel > 20 ? '#10B981' : '#EF4444'};">
          ${Math.round(driver.batteryLevel)}%
        </div>
      </div>
    `;
    
    return el;
  };

  const addDriverMarker = (driver: DriverPosition) => {
    if (!map || !map.isStyleLoaded || !driver.location) {
      console.log('Map not ready for marker:', { map: !!map, styleLoaded: map?.isStyleLoaded, location: !!driver.location });
      return;
    }

    // Additional check to ensure map container is ready
    const container = map.getContainer();
    if (!container || !container.parentNode) {
      console.log('Map container not ready');
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
      const popup = new window.mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div class="p-2 min-w-[200px]">
          <div class="flex items-center space-x-2 mb-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" 
                 style="background-color: ${getStatusColor(driver.status)};">
              ${getStatusIcon(driver.status)}
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">${driver.driverName}</h3>
              <p class="text-xs text-gray-600">${driver?.vehicleId || 'N/A'}</p>
            </div>
          </div>
          
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-600">Estado:</span>
              <span class="font-medium" style="color: ${getStatusColor(driver.status)};">
                ${driver.status === 'DRIVING' ? 'Conduciendo' : 
                  driver.status === 'IDLE' ? 'Inactivo' :
                  driver.status === 'ON_BREAK' ? 'En descanso' : 'Desconectado'}
              </span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Ruta:</span>
              <span class="font-medium">${driver.routeName}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Velocidad:</span>
              <span class="font-medium">${Math.round(driver.location.speed)} km/h</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Batería:</span>
              <span class="font-medium ${driver.batteryLevel > 20 ? 'text-green-600' : 'text-red-600'}">
                ${Math.round(driver.batteryLevel)}%
              </span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Señal:</span>
              <span class="font-medium">${Math.round(driver.signalStrength)}%</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Red:</span>
              <span class="font-medium">${driver.networkType}</span>
            </div>
            
            <div class="text-gray-500 text-xs mt-2 pt-2 border-t">
              Última actualización: ${new Date(driver.timestamp).toLocaleTimeString()}
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
    if (!map || !map.isStyleLoaded || driverPositions.length === 0) {
      return;
    }

    // Add a small delay to ensure map is completely ready
    const addMarkersWithDelay = () => {
      setMarkersLoading(true);
      
      // Clear existing markers
      clearAllMarkers();

      // Add new markers with a small delay between each
      let markersAdded = 0;
      const totalMarkers = driverPositions.filter(driver => 
        driver.location && driver.location.latitude && driver.location.longitude
      ).length;

      driverPositions.forEach((driver, index) => {
        if (driver.location && driver.location.latitude && driver.location.longitude) {
          setTimeout(() => {
            addDriverMarker(driver);
            markersAdded++;
            
            // Notify when all markers are loaded
            if (markersAdded === totalMarkers) {
              setMarkersLoading(false);
              if (onMarkersLoaded) {
                onMarkersLoaded();
              }
            }
          }, index * 100); // 100ms delay between each marker
        }
      });

      // If no markers to add, stop loading immediately
      if (totalMarkers === 0) {
        setMarkersLoading(false);
        if (onMarkersLoaded) {
          onMarkersLoaded();
        }
      }
    };

    // Wait for map to be completely ready
    if (map.isStyleLoaded()) {
      addMarkersWithDelay();
    } else {
      // Wait for the 'idle' event which indicates the map is fully loaded
      const handleMapIdle = () => {
        addMarkersWithDelay();
        map.off('idle', handleMapIdle);
      };
      
      map.on('idle', handleMapIdle);
      
      // Fallback timeout
      setTimeout(() => {
        map.off('idle', handleMapIdle);
        addMarkersWithDelay();
      }, 2000);
    }
  }, [map, driverPositions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllMarkers();
    };
  }, [map]);

  return null; // This component doesn't render anything visual
}
