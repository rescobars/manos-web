'use client';

import React, { useEffect, useRef } from 'react';
import { DriverPosition } from '@/hooks/useDriverPositions';
import { RouteDriverPosition } from '@/hooks/useRouteDriverPositions';

type CombinedDriverPosition = DriverPosition | RouteDriverPosition;

interface DriverMarkersProps {
  map: any;
  driverPositions: CombinedDriverPosition[];
  onDriverClick?: (driver: CombinedDriverPosition) => void;
  selectedDriver?: CombinedDriverPosition | null;
  onCloseDriverDetails?: () => void;
  selectedRouteIds?: string[];
}

// Constante para determinar si un conductor está offline
const OFFLINE_THRESHOLD_MINUTES = 70; // 1 hora 10 minutos = 70 minutos

export function DriverMarkers({ map, driverPositions, onDriverClick, selectedDriver, onCloseDriverDetails, selectedRouteIds = [] }: DriverMarkersProps) {
  const markersRef = useRef<Map<string, any>>(new Map());

  // Filtrar conductores basado en las rutas seleccionadas
  const filteredDriverPositions = driverPositions.filter(driver => {
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

  // Función para determinar si un conductor está offline basado en el tiempo
  const isDriverOffline = (driver: CombinedDriverPosition): boolean => {
    // Usar transmission_timestamp si está disponible, sino timestamp como fallback
    const transmissionTime = driver.transmission_timestamp || driver.timestamp;
    
    if (!transmissionTime) return true;
    
    const lastTransmissionTime = new Date(transmissionTime).getTime();
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
      transmission_timestamp: driver.transmission_timestamp,
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

    // No popup needed - using modal instead

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
    if (filteredDriverPositions.length > 0) {
      filteredDriverPositions.forEach((driver) => {
        if (driver.location && driver.location.latitude && driver.location.longitude) {
          addMarker(driver);
        }
      });
    }
  }, [map, filteredDriverPositions]); // Cuando cambie el mapa o los conductores filtrados

  // Actualizar posiciones de markers existentes con animación suave
  useEffect(() => {
    if (!map || !window.mapboxgl || filteredDriverPositions.length === 0) {
      return;
    }

    filteredDriverPositions.forEach((driver) => {
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