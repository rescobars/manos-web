'use client';

import React, { useEffect, useRef } from 'react';
import { DriverPosition } from '@/hooks/useDriverPositions';
import { RouteDriverPosition } from '@/hooks/useRouteDriverPositions';

// Declarar función global para TypeScript
declare global {
  interface Window {
    closeDriverPopup?: () => void;
  }
}

type CombinedDriverPosition = DriverPosition | RouteDriverPosition;

interface DriverDetailsModalProps {
  selectedDriver: CombinedDriverPosition | null;
  onClose: () => void;
  map?: any; // Mapbox map instance
}

// Constante para determinar si un conductor está offline
const OFFLINE_THRESHOLD_MINUTES = 70; // 1 hora 10 minutos = 70 minutos

export function DriverDetailsModal({ selectedDriver, onClose, map }: DriverDetailsModalProps) {
  const popupRef = useRef<any>(null);
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

  // Crear popup de Mapbox cuando se selecciona un conductor
  useEffect(() => {
    if (!selectedDriver || !map) return;

    // Cerrar popup anterior si existe
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    const isRouteDriver = 'routeName' in selectedDriver;
    const realStatus = getRealStatus(selectedDriver);
    const statusColor = getStatusColor(selectedDriver, isRouteDriver);

    // Crear el contenido HTML del popup
    const popupContent = `
      <div class="p-4 max-w-xs">
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 class="text-lg font-bold text-gray-900">${selectedDriver.driverName}</h3>
          </div>
          <button onclick="window.closeDriverPopup && window.closeDriverPopup()" class="p-1 hover:bg-gray-100 rounded-full">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Status -->
        <div class="mb-3">
          <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold" style="background-color: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30;">
            ${realStatus === 'DRIVING' ? 
              (isRouteDriver ? 'En ruta' : 'Manejando') : 
              realStatus === 'IDLE' || realStatus === 'STOPPED' ? 'Detenido' :
              realStatus === 'BREAK' ? 'En descanso' : 'Desconectado'}
          </div>
        </div>

        <!-- Info -->
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Tipo:</span>
            <span class="font-medium">${isRouteDriver ? 'Conductor de Ruta' : 'Conductor General'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Ruta:</span>
            <span class="font-medium">${selectedDriver.routeName || 'Sin ruta asignada'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Velocidad:</span>
            <span class="font-medium text-green-600">${Math.round(selectedDriver.location.speed || 0)} km/h</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Coordenadas:</span>
            <span class="font-mono text-xs">${selectedDriver.location.latitude.toFixed(4)}, ${selectedDriver.location.longitude.toFixed(4)}</span>
          </div>
        </div>

        <!-- Last transmission -->
        <div class="mt-3 pt-3 border-t border-gray-200">
          <div class="text-xs text-gray-500">
            Última actualización: ${new Date(selectedDriver.transmission_timestamp || selectedDriver.timestamp).toLocaleString('es-ES', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    `;

    // Crear el popup de Mapbox
    const popup = new window.mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false,
      closeOnMove: false
    })
      .setLngLat([selectedDriver.location.longitude, selectedDriver.location.latitude])
      .setHTML(popupContent)
      .addTo(map);

    popupRef.current = popup;

    // Configurar función global para cerrar el popup
    window.closeDriverPopup = () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      onClose();
    };

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      delete window.closeDriverPopup;
    };
  }, [selectedDriver, map, onClose]);

  if (!selectedDriver) return null;

  // El popup se maneja completamente a través de Mapbox
  return null;
}
