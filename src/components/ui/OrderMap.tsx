'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { createTruckIcon, createFinishFlagIcon } from '@/lib/leaflet/custom-icons';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

// Importar Leaflet dinámicamente
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

// Componente para manejar el autocentrado
const MapBounds = dynamic(() => 
  import('react-leaflet').then(mod => {
    const { useMap } = mod;
    return function MapBounds({ 
      pickupLocation, 
      deliveryLocation, 
      hasValidPickup, 
      hasValidDelivery,
      routePoints
    }: { 
      pickupLocation: Location; 
      deliveryLocation: Location; 
      hasValidPickup: boolean; 
      hasValidDelivery: boolean;
      routePoints?: RoutePoint[];
    }) {
      const map = useMap();
      
      useEffect(() => {
        if (!map) return;
        
        const bounds: [number, number][] = [];
        
        if (hasValidPickup) {
          bounds.push([pickupLocation.lat, pickupLocation.lng]);
        }
        
        if (hasValidDelivery) {
          bounds.push([deliveryLocation.lat, deliveryLocation.lng]);
        }
        
        // Si hay puntos de ruta, incluirlos en los bounds
        if (routePoints && routePoints.length > 0) {
          routePoints.forEach(point => {
            if (!isNaN(point.lat) && !isNaN(point.lng) && point.lat !== 0 && point.lng !== 0 && 
                point.lat >= -90 && point.lat <= 90 && point.lng >= -180 && point.lng <= 180) {
              bounds.push([point.lat, point.lng]);
            }
          });
        }
        
        if (bounds.length > 0) {
          // Ajustar el mapa para mostrar todos los marcadores
          map.fitBounds(bounds, { 
            padding: [20, 20] // Padding en píxeles
          });
        }
      }, [map, pickupLocation, deliveryLocation, hasValidPickup, hasValidDelivery, routePoints]);
      
      return null;
    };
  }), 
  { ssr: false }
);

// Inicializar iconos de Leaflet
if (typeof window !== 'undefined') {
  import('leaflet').then((L) => {
    // Fix para iconos de Leaflet en Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  });
}

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface RoutePoint {
  lat: number;
  lng: number;
  sequence: number;
  distance_from_previous: number;
  point_type: 'start' | 'waypoint' | 'end';
}

interface OrderMapProps {
  pickupLocation: Location;
  deliveryLocation: Location;
  routePoints?: RoutePoint[];
}

export function OrderMap({ pickupLocation, deliveryLocation, routePoints }: OrderMapProps) {
  const { colors } = useDynamicTheme();

  // Función para validar coordenadas
  const isValidCoordinate = (lat: number, lng: number): boolean => {
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && 
           lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  // Calcular el centro del mapa basado en las ubicaciones
  const getMapCenter = (): [number, number] => {
    const pickupValid = isValidCoordinate(pickupLocation.lat, pickupLocation.lng);
    const deliveryValid = isValidCoordinate(deliveryLocation.lat, deliveryLocation.lng);
    
    if (pickupValid && deliveryValid) {
      const centerLat = (pickupLocation.lat + deliveryLocation.lat) / 2;
      const centerLng = (pickupLocation.lng + deliveryLocation.lng) / 2;
      return [centerLat, centerLng];
    }
    
    if (pickupValid) {
      return [pickupLocation.lat, pickupLocation.lng];
    }
    
    if (deliveryValid) {
      return [deliveryLocation.lat, deliveryLocation.lng];
    }
    
    // Fallback a Guatemala City
    return [14.6349, -90.5069];
  };

  const mapCenter = getMapCenter();

  // Verificar si tenemos coordenadas válidas
  const hasValidPickup = isValidCoordinate(pickupLocation.lat, pickupLocation.lng);
  const hasValidDelivery = isValidCoordinate(deliveryLocation.lat, deliveryLocation.lng);

  // Validar que el centro del mapa sea válido
  const isValidMapCenter = isValidCoordinate(mapCenter[0], mapCenter[1]);
  const finalMapCenter: [number, number] = isValidMapCenter ? mapCenter : [14.6349, -90.5069];

  // Preparar puntos de ruta para la línea
  const routeLinePositions = routePoints && routePoints.length > 0 
    ? routePoints
        .filter(point => isValidCoordinate(point.lat, point.lng))
        .sort((a, b) => a.sequence - b.sequence)
        .map(point => [point.lat, point.lng] as [number, number])
    : [];

  return (
    <div className="w-full h-full">
      <MapContainer
        center={finalMapCenter}
        zoom={hasValidPickup || hasValidDelivery ? 13 : 10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Componente para autocentrado */}
        <MapBounds
          pickupLocation={pickupLocation}
          deliveryLocation={deliveryLocation}
          hasValidPickup={hasValidPickup}
          hasValidDelivery={hasValidDelivery}
          routePoints={routePoints}
        />
        
        {/* Línea de ruta */}
        {routeLinePositions.length > 0 && (
          <Polyline
            positions={routeLinePositions}
            pathOptions={{
              color: colors.buttonPrimary1 || '#3B82F6',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10'
            }}
          />
        )}
        
        {/* Marcador de punto de recogida - Camión */}
        {hasValidPickup && (
          <Marker 
            position={[pickupLocation.lat, pickupLocation.lng]}
            icon={createTruckIcon(colors.warning || '#F59E0B')}
          >
            <Popup>
              <div className="text-center min-w-[200px] theme-bg-3" style={{ backgroundColor: 'var(--theme-bg-3)' }}>
                <div className="w-4 h-4 mx-auto mb-2 rounded-full" style={{ backgroundColor: colors.warning || '#F59E0B' }}></div>
                <p className="font-semibold text-sm mb-1 theme-text-primary" style={{ color: 'var(--theme-text-primary)' }}>Punto de recogida</p>
                <p className="text-xs theme-text-secondary" style={{ color: 'var(--theme-text-secondary)' }}>{pickupLocation.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador de punto de entrega - Bandera de meta */}
        {hasValidDelivery && (
          <Marker 
            position={[deliveryLocation.lat, deliveryLocation.lng]}
            icon={createFinishFlagIcon(colors.success || '#10B981')}
          >
            <Popup>
              <div className="text-center min-w-[200px] theme-bg-3" style={{ backgroundColor: 'var(--theme-bg-3)' }}>
                <div className="w-4 h-4 mx-auto mb-2 rounded-full" style={{ backgroundColor: colors.success || '#10B981' }}></div>
                <p className="font-semibold text-sm mb-1 theme-text-primary" style={{ color: 'var(--theme-text-primary)' }}>Punto de entrega</p>
                <p className="text-xs theme-text-secondary" style={{ color: 'var(--theme-text-secondary)' }}>{deliveryLocation.address}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
