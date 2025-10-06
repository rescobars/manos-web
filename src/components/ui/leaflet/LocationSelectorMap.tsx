'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Target } from 'lucide-react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap } from 'react-leaflet';

// Importar Leaflet dinámicamente
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Fix para iconos de Leaflet en Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface LocationSelectorMapProps {
  startLocation: Location | null;
  endLocation: Location | null;
  onStartLocationSelect: (location: Location) => void;
  onEndLocationSelect: (location: Location) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Componente para manejar la lógica del mapa
function MapContent({
  startLocation,
  endLocation,
  onStartLocationSelect,
  onEndLocationSelect
}: {
  startLocation: Location | null;
  endLocation: Location | null;
  onStartLocationSelect: (location: Location) => void;
  onEndLocationSelect: (location: Location) => void;
}) {
  const map = useMap();
  const [isMapReady, setIsMapReady] = useState(false);

  // Marcar mapa como listo
  useEffect(() => {
    if (map) {
      setIsMapReady(true);
    }
  }, [map]);

  // Manejar clics en el mapa
  useEffect(() => {
    if (!isMapReady || !map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      console.log('🎯 Map clicked - lat:', lat, 'lng:', lng);
      
      try {
        // Reverse geocoding para obtener la dirección
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const data = await response.json();
        
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        const location: Location = { lat, lng, address };
        
        console.log('📍 Location created:', location);

        // Si endLocation es null, solo manejar ubicación inicial
        if (endLocation === null) {
          console.log('🚀 Setting start location');
          onStartLocationSelect(location);
        }
        // Si no hay ubicación de inicio, seleccionar como inicio
        else if (!startLocation) {
          console.log('🚀 Setting start location');
          onStartLocationSelect(location);
        }
        // Si hay inicio pero no fin, seleccionar como fin
        else if (!endLocation) {
          console.log('🏁 Setting end location');
          onEndLocationSelect(location);
        }
        // Si ambas están seleccionadas, reemplazar la de fin
        else {
          console.log('🔄 Updating end location');
          onEndLocationSelect(location);
        }
      } catch (error) {
        console.error('Error en reverse geocoding:', error);
        const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        const location: Location = { lat, lng, address };
        
        console.log('📍 Fallback location created:', location);
        
        if (!startLocation) {
          console.log('🚀 Setting start location (fallback)');
          onStartLocationSelect(location);
        } else if (!endLocation) {
          console.log('🏁 Setting end location (fallback)');
          onEndLocationSelect(location);
        } else {
          console.log('🔄 Updating end location (fallback)');
          onEndLocationSelect(location);
        }
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isMapReady, map, startLocation, endLocation, onStartLocationSelect, onEndLocationSelect]);

  return null; // Este componente no renderiza nada, solo maneja la lógica
}

export function LocationSelectorMap({
  startLocation,
  endLocation,
  onStartLocationSelect,
  onEndLocationSelect,
  className = 'w-full h-full',
  style = { height: '400px' }
}: LocationSelectorMapProps) {
  // Calcular centro del mapa
  const getMapCenter = (): [number, number] => {
    if (startLocation) {
      return [startLocation.lat, startLocation.lng];
    }
    if (endLocation) {
      return [endLocation.lat, endLocation.lng];
    }
    return [14.6349, -90.5069]; // Guatemala City por defecto
  };

  const mapCenter = getMapCenter();

  return (
    <div className={className} style={style}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Marcador de ubicación de inicio */}
        {startLocation && (
          <Marker position={[startLocation.lat, startLocation.lng]}>
            <Popup>
              <div className="text-center">
                <div className="w-4 h-4 mx-auto mb-1 rounded-full bg-green-500"></div>
                <p className="font-semibold text-green-600">Ubicación Inicial</p>
                <p className="text-xs text-gray-600">{startLocation.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador de ubicación de fin - solo si endLocation no es null */}
        {endLocation && endLocation !== null && (
          <Marker position={[endLocation.lat, endLocation.lng]}>
            <Popup>
              <div className="text-center">
                <div className="w-4 h-4 mx-auto mb-1 rounded-full bg-red-500"></div>
                <p className="font-semibold text-red-600">Punto de Fin</p>
                <p className="text-xs text-gray-600">{endLocation.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Lógica de selección */}
        <MapContent
          startLocation={startLocation}
          endLocation={endLocation}
          onStartLocationSelect={onStartLocationSelect}
          onEndLocationSelect={onEndLocationSelect}
        />
      </MapContainer>
    </div>
  );
}
