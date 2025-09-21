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

// Constante para determinar si un conductor está offline
const OFFLINE_THRESHOLD_MINUTES = 70; // 1 hora 10 minutos = 70 minutos

export function DriverMarkers({ map, driverPositions, onDriverClick }: DriverMarkersProps) {
  const markersRef = useRef<Map<string, any>>(new Map());

  // Función para determinar si un conductor está offline basado en el tiempo
  const isDriverOffline = (driver: CombinedDriverPosition): boolean => {
    if (!driver.timestamp) return true;
    
    const lastTransmissionTime = new Date(driver.timestamp).getTime();
    const currentTime = new Date().getTime();
    const timeDifferenceMinutes = (currentTime - lastTransmissionTime) / (1000 * 60);
    
    return timeDifferenceMinutes > OFFLINE_THRESHOLD_MINUTES;
  };

  // Función para obtener el status real del conductor (considerando offline)
  const getRealStatus = (driver: CombinedDriverPosition): CombinedDriverPosition['status'] => {
    const isOffline = isDriverOffline(driver);
    
    // Debug logs
    console.log(`🔍 DRIVER STATUS DEBUG - ${driver.driverId}:`, {
      originalStatus: driver.status,
      timestamp: driver.timestamp,
      isOffline: isOffline,
      finalStatus: isOffline ? 'OFFLINE' : (driver.status || 'IDLE')
    });
    
    if (isOffline) {
      return 'OFFLINE';
    }
    return driver.status || 'IDLE';
  };

  const getStatusColor = (driver: CombinedDriverPosition, isRouteDriver: boolean = false) => {
    const realStatus = getRealStatus(driver);
    
    switch (realStatus) {
      case 'DRIVING':
        return isRouteDriver ? '#059669' : '#10B981'; // Verde oscuro para en ruta, verde claro para manejando
      case 'IDLE':
      case 'STOPPED':
        return '#F59E0B'; // Yellow
      case 'BREAK':
        return '#8B5CF6'; // Purple
      case 'OFFLINE':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  };

  // Componentes de iconos para cada estado
  const DrivingIcon = (isRouteDriver: boolean = false) => `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      <path d="M7 13h2v2H7z" fill="white" opacity="0.9"/>
      <path d="M15 13h2v2h-2z" fill="white" opacity="0.9"/>
      <path d="M12 8h-1v2h2V8z" fill="white" opacity="0.7"/>
      <circle cx="6.5" cy="16" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="17.5" cy="16" r="1.5" fill="white" opacity="0.8"/>
      ${isRouteDriver ? `
        <path d="M12 2l2 4h-4l2-4z" fill="white" opacity="0.9"/>
        <path d="M12 6h-1v2h2V6z" fill="white" opacity="0.7"/>
      ` : ''}
    </svg>
  `;

  const IdleIcon = () => `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      <path d="M7 13h2v2H7z" fill="white" opacity="0.6"/>
      <path d="M15 13h2v2h-2z" fill="white" opacity="0.6"/>
      <path d="M12 8h-1v2h2V8z" fill="white" opacity="0.4"/>
      <circle cx="6.5" cy="16" r="1.5" fill="white" opacity="0.5"/>
      <circle cx="17.5" cy="16" r="1.5" fill="white" opacity="0.5"/>
    </svg>
  `;

  const OnBreakIcon = () => `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      <path d="M7 13h2v2H7z" fill="white" opacity="0.6"/>
      <path d="M15 13h2v2h-2z" fill="white" opacity="0.6"/>
      <path d="M12 8h-1v2h2V8z" fill="white" opacity="0.4"/>
      <path d="M8 4h8v2H8z" fill="white" opacity="0.7"/>
      <circle cx="6.5" cy="16" r="1.5" fill="white" opacity="0.5"/>
      <circle cx="17.5" cy="16" r="1.5" fill="white" opacity="0.5"/>
    </svg>
  `;

  const OfflineIcon = () => `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      <path d="M7 13h2v2H7z" fill="white" opacity="0.3"/>
      <path d="M15 13h2v2h-2z" fill="white" opacity="0.3"/>
      <path d="M12 8h-1v2h2V8z" fill="white" opacity="0.2"/>
      <path d="M8 4l8 8M16 4l-8 8" stroke="white" stroke-width="2" fill="none" opacity="0.9"/>
      <circle cx="6.5" cy="16" r="1.5" fill="white" opacity="0.3"/>
      <circle cx="17.5" cy="16" r="1.5" fill="white" opacity="0.3"/>
    </svg>
  `;

  const DefaultIcon = () => `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      <path d="M7 13h2v2H7z" fill="white" opacity="0.6"/>
      <path d="M15 13h2v2h-2z" fill="white" opacity="0.6"/>
      <circle cx="6.5" cy="16" r="1.5" fill="white" opacity="0.5"/>
      <circle cx="17.5" cy="16" r="1.5" fill="white" opacity="0.5"/>
    </svg>
  `;

  const getStatusIcon = (driver: CombinedDriverPosition, isRouteDriver: boolean = false) => {
    const realStatus = getRealStatus(driver);
    
    switch (realStatus) {
      case 'DRIVING':
        return DrivingIcon(isRouteDriver);
      case 'IDLE':
      case 'STOPPED':
        return IdleIcon();
      case 'BREAK':
        return OnBreakIcon();
      case 'OFFLINE':
        return OfflineIcon();
      default:
        return DefaultIcon();
    }
  };

  const createMarkerElement = (driver: CombinedDriverPosition) => {
    const el = document.createElement('div');
    el.className = 'driver-marker';
    
    const isRouteDriver = 'routeName' in driver;
    const realStatus = getRealStatus(driver);
    const statusColor = getStatusColor(driver, isRouteDriver);
    const statusIcon = getStatusIcon(driver, isRouteDriver);
    
    el.innerHTML = `
      <div class="relative group">
        <div class="w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-110 transition-all duration-300 transform hover:shadow-xl" 
             style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd);">
          ${statusIcon}
        </div>
        ${realStatus === 'DRIVING' ? `
          <div class="absolute inset-0 rounded-full animate-ping" style="background-color: ${statusColor}; opacity: 0.3;"></div>
        ` : ''}
        ${isRouteDriver && realStatus === 'DRIVING' ? `
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
    const realStatus = getRealStatus(driver);
    const statusColor = getStatusColor(driver, isRouteDriver);
    const statusIcon = getStatusIcon(driver, isRouteDriver);
    
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
               style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd);">
            ${statusIcon}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-900 text-sm truncate">${driver.driverName}</h3>
            <p class="text-xs text-gray-600 truncate">${'vehicleId' in driver ? (driver.vehicleId || 'N/A') : 'N/A'}</p>
          </div>
          <div class="text-right">
            <div class="text-xs font-semibold" style="color: ${statusColor};">
              ${realStatus === 'DRIVING' ? 
                (isRouteDriver ? 'En ruta' : 'Manejando') : 
                realStatus === 'IDLE' || realStatus === 'STOPPED' ? 'Detenido' :
                realStatus === 'BREAK' ? 'En descanso' : 'Desconectado'}
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
            <div class="font-medium">Última transmisión:</div>
            <div>${new Date(driver.timestamp).toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}</div>
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

  // Función para animar el movimiento suave del marker
  const animateMarkerToPosition = (marker: any, newLngLat: [number, number], duration: number = 2000) => {
    const startLngLat = marker.getLngLat();
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing suave para movimiento natural
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      // Interpolar entre posición actual y nueva
      const currentLng = startLngLat.lng + (newLngLat[0] - startLngLat.lng) * easedProgress;
      const currentLat = startLngLat.lat + (newLngLat[1] - startLngLat.lat) * easedProgress;
      
      // Actualizar posición del marker
      marker.setLngLat([currentLng, currentLat]);
      
      // Continuar animación si no ha terminado
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };

  // Crear markers iniciales cuando cambie el mapa
  useEffect(() => {
    if (!map || !window.mapboxgl) {
      return;
    }

    // Clear all existing markers
    clearAllMarkers();

    // Add new markers
    if (driverPositions.length > 0) {
      driverPositions.forEach((driver) => {
        if (driver.location && driver.location.latitude && driver.location.longitude) {
          addMarker(driver);
        }
      });
    }
  }, [map]); // Solo cuando cambie el mapa

  // Actualizar posiciones de markers existentes con animación suave
  useEffect(() => {
    if (!map || !window.mapboxgl || driverPositions.length === 0) {
      return;
    }

    driverPositions.forEach((driver) => {
      if (driver.location && driver.location.latitude && driver.location.longitude) {
        const markerId = `driver-${driver.driverId}`;
        const marker = markersRef.current.get(markerId);
        
        if (marker) {
          // Obtener posición actual del marker
          const currentLngLat = marker.getLngLat();
          const newLngLat = [driver.location.longitude, driver.location.latitude];
          
          // Solo animar si la posición cambió significativamente
          const distance = Math.sqrt(
            Math.pow(currentLngLat.lng - newLngLat[0], 2) + 
            Math.pow(currentLngLat.lat - newLngLat[1], 2)
          );
          
          if (distance > 0.0001) { // Solo animar si hay movimiento significativo
            animateMarkerToPosition(marker, newLngLat as [number, number]);
          }
        } else {
          // Si no existe el marker, crearlo
          addMarker(driver);
        }
      }
    });
  }, [driverPositions]); // Cuando cambien las posiciones


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllMarkers();
    };
  }, []);

  return null;
}