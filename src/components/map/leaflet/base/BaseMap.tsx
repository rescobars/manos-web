'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/lib/leaflet/styles.css';
import { MapTileType, getTileConfig } from '@/components/ui/leaflet';

// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface BaseMapProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  onMapReady?: (map: L.Map) => void;
  tileType?: MapTileType;
}

// Componente interno para manejar el mapa
function MapController({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
}

export function BaseMap({ 
  center, 
  zoom = 12, 
  className = 'w-full h-full',
  children,
  onMapReady,
  tileType = 'streets'
}: BaseMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  const tileConfig = getTileConfig(tileType);

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        attributionControl={true}
      >
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />
        <MapController onMapReady={onMapReady} />
        {children}
      </MapContainer>
    </div>
  );
}

// Hook para usar el mapa en componentes hijos
export function useMapInstance() {
  const map = useMap();
  return map;
}
