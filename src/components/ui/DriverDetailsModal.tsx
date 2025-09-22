'use client';

import React, { useEffect, useRef } from 'react';
import { DriverPosition } from '@/hooks/useDriverPositions';
import { RouteDriverPosition } from '@/hooks/useRouteDriverPositions';
import L from 'leaflet';

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
  map?: L.Map | null; // Leaflet map instance
}

// Constante para determinar si un conductor está offline
const OFFLINE_THRESHOLD_MINUTES = 70; // 1 hora 10 minutos = 70 minutos

export function DriverDetailsModal({ selectedDriver, onClose, map }: DriverDetailsModalProps) {
  const popupRef = useRef<L.Popup | null>(null);

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

  // Crear popup de Leaflet cuando se selecciona un conductor
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
      <div class="w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
        <!-- Header con gradiente -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg" style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd);">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900">${selectedDriver.driverName}</h3>
                <p class="text-xs text-gray-500">${isRouteDriver ? 'Conductor de Ruta' : 'Conductor General'}</p>
              </div>
            </div>
            <button onclick="window.closeDriverPopup && window.closeDriverPopup()" class="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all duration-200">
              <svg class="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Status Badge -->
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm" style="background-color: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30;">
            <div class="w-2 h-2 rounded-full mr-2" style="background-color: ${statusColor}"></div>
            ${realStatus === 'DRIVING' ? 
              (isRouteDriver ? 'En ruta' : 'Manejando') : 
              realStatus === 'IDLE' || realStatus === 'STOPPED' ? 'Detenido' :
              realStatus === 'BREAK' ? 'En descanso' : 'Desconectado'}
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-4">
          <!-- Ruta -->
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div class="flex-1">
              <div class="text-xs text-gray-500 font-medium">Ruta asignada</div>
              <div class="text-sm font-semibold text-gray-900">${selectedDriver.routeName || 'Sin ruta asignada'}</div>
            </div>
          </div>

          <!-- Velocidad -->
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="flex-1">
              <div class="text-xs text-gray-500 font-medium">Velocidad actual</div>
              <div class="text-sm font-semibold text-green-600">${Math.round(selectedDriver.location.speed || 0)} km/h</div>
            </div>
          </div>

          <!-- Coordenadas -->
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <div class="text-xs text-gray-500 font-medium">Ubicación</div>
              <div class="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
                ${selectedDriver.location.latitude.toFixed(4)}, ${selectedDriver.location.longitude.toFixed(4)}
              </div>
            </div>
          </div>

          <!-- Última actualización -->
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <div class="text-xs text-gray-500 font-medium">Última actualización</div>
              <div class="text-xs text-gray-700">
                ${new Date(selectedDriver.transmission_timestamp || selectedDriver.timestamp).toLocaleString('es-ES', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Crear el popup de Leaflet
    const popup = L.popup({
      offset: [0, -10],
      closeButton: false,
      closeOnClick: false,
      autoClose: false,
      className: 'custom-driver-popup'
    })
      .setLatLng([selectedDriver.location.latitude, selectedDriver.location.longitude])
      .setContent(popupContent)
      .openOn(map);

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

  // El popup se maneja completamente a través de Leaflet
  return null;
}