'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Importar Leaflet dinámicamente
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Componente para manejar clics usando useMapEvents
const MapClickHandler = dynamic(() => 
  import('react-leaflet').then(mod => {
    const { useMapEvents } = mod;
    return function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
      useMapEvents({
        click: (e) => {
          if (onMapClick) {
            const { lat, lng } = e.latlng;
            onMapClick(lat, lng);
          }
        },
      });
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

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  deliveryLocation?: Location | null;
  onMapClick?: (lat: number, lng: number) => void;
  colors: any;
}

export function LeafletMap({ 
  center, 
  zoom = 15, 
  deliveryLocation, 
  onMapClick, 
  colors 
}: LeafletMapProps) {
  return (
    <div className="w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapClickHandler onMapClick={onMapClick} />
        
        {/* Marcador de punto de entrega */}
        {deliveryLocation && (
          <Marker position={[deliveryLocation.lat, deliveryLocation.lng]}>
            <Popup>
              <div className="text-center">
                <div className="w-4 h-4 mx-auto mb-1 rounded-full" style={{ backgroundColor: colors.success }}></div>
                <p className="font-semibold">Punto de entrega</p>
                <p className="text-xs text-gray-600">{deliveryLocation.address}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
