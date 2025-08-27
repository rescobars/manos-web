'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X, AlertCircle } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { MAPBOX_CONFIG, isMapboxConfigured, getMapboxToken } from '@/lib/mapbox';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface LocationSelectorProps {
  pickupLocation: Location;
  deliveryLocation: Location | null;
  onPickupChange: (location: Location) => void;
  onDeliveryChange: (location: Location) => void;
  onDeliveryClear: () => void;
}

export function LocationSelector({
  pickupLocation,
  deliveryLocation,
  onPickupChange,
  onDeliveryChange,
  onDeliveryClear
}: LocationSelectorProps) {
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mapboxError, setMapboxError] = useState<string>('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const deliveryMarkerRef = useRef<any>(null);

  // Verificar configuración de Mapbox
  useEffect(() => {
    if (!isMapboxConfigured()) {
      setMapboxError('Mapbox no está configurado. Agrega NEXT_PUBLIC_MAPBOX_TOKEN en .env.local');
      return;
    }
    setMapboxError('');
  }, []);

  // Inicializar mapa cuando el componente se monta
  useEffect(() => {
    if (!mapContainerRef.current || !isMapboxConfigured()) return;

    // Cargar Mapbox GL JS dinámicamente
    const loadMapbox = async () => {
      try {
        // Verificar si Mapbox ya está cargado
        if (window.mapboxgl) {
          initializeMap();
          return;
        }

        // Cargar CSS de Mapbox
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Cargar JS de Mapbox
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.onload = () => {
          window.mapboxgl.accessToken = getMapboxToken();
          initializeMap();
        };
        script.onerror = () => {
          setMapboxError('Error al cargar Mapbox. Verifica tu conexión a internet.');
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Mapbox:', error);
        setMapboxError('Error al cargar Mapbox');
      }
    };

    loadMapbox();
  }, []);

  const initializeMap = () => {
    if (!mapContainerRef.current || !window.mapboxgl) return;

    const map = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_CONFIG.defaultStyle,
      center: [pickupLocation.lng, pickupLocation.lat],
      zoom: MAPBOX_CONFIG.defaultZoom
    });

    mapRef.current = map;

    // Agregar controles de navegación
    map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

    // Agregar marcador de pickup (punto A - sucursal)
    const pickupMarker = new window.mapboxgl.Marker({ 
      color: MAPBOX_CONFIG.markerColors.pickup,
      element: createCustomMarker('Sucursal', MAPBOX_CONFIG.markerColors.pickup)
    })
      .setLngLat([pickupLocation.lng, pickupLocation.lat])
      .addTo(map);

    pickupMarkerRef.current = pickupMarker;

    // Agregar popup para pickup
    const pickupPopup = new window.mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="text-center">
          <div class="font-semibold text-blue-600">Sucursal</div>
          <div class="text-sm text-gray-600">${pickupLocation.address}</div>
        </div>
      `);
    pickupMarker.setPopup(pickupPopup);

    // Evento de clic en el mapa para seleccionar punto de entrega
    map.on('click', (e: any) => {
      const { lng, lat } = e.lngLat;
      
      // Buscar dirección usando coordenadas inversas
      searchAddressFromCoordinates(lng, lat);
    });

    // Agregar marcador de delivery si existe
    if (deliveryLocation) {
      addDeliveryMarker(deliveryLocation);
    }
  };

  const createCustomMarker = (label: string, color: string) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = `
      <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white" 
           style="background-color: ${color}">
        ${label.charAt(0)}
      </div>
    `;
    return el;
  };

  const searchAddressFromCoordinates = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${getMapboxToken()}&types=${MAPBOX_CONFIG.searchTypes}&country=${MAPBOX_CONFIG.searchCountry}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const newDeliveryLocation: Location = {
          lat,
          lng,
          address: feature.place_name
        };
        
        onDeliveryChange(newDeliveryLocation);
        addDeliveryMarker(newDeliveryLocation);
      }
    } catch (error) {
      console.error('Error searching address:', error);
    }
  };

  const addDeliveryMarker = (location: Location) => {
    if (!mapRef.current) return;

    // Remover marcador anterior si existe
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.remove();
    }

    // Agregar nuevo marcador de delivery
    const deliveryMarker = new window.mapboxgl.Marker({ 
      color: MAPBOX_CONFIG.markerColors.delivery,
      element: createCustomMarker('Entrega', MAPBOX_CONFIG.markerColors.delivery)
    })
      .setLngLat([location.lng, location.lat])
      .addTo(mapRef.current);

    deliveryMarkerRef.current = deliveryMarker;

    // Agregar popup para delivery
    const deliveryPopup = new window.mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="text-center">
          <div class="font-semibold text-green-600">Punto de Entrega</div>
          <div class="text-sm text-gray-600">${location.address}</div>
        </div>
      `);
    deliveryMarker.setPopup(deliveryPopup);

    // Centrar mapa en ambos puntos
    const bounds = new window.mapboxgl.LngLatBounds()
      .extend([pickupLocation.lng, pickupLocation.lat])
      .extend([location.lng, location.lat]);
    
    mapRef.current.fitBounds(bounds, { padding: 50 });
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddress)}.json?access_token=${getMapboxToken()}&country=${MAPBOX_CONFIG.searchCountry}&types=${MAPBOX_CONFIG.searchTypes}`
      );
      const data = await response.json();
      
      if (data.features) {
        setSearchResults(data.features);
      }
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (feature: any) => {
    const [lng, lat] = feature.center;
    const newDeliveryLocation: Location = {
      lat,
      lng,
      address: feature.place_name
    };
    
    onDeliveryChange(newDeliveryLocation);
    addDeliveryMarker(newDeliveryLocation);
    setSearchAddress('');
    setSearchResults([]);
  };

  // Si hay error de configuración, mostrar mensaje
  if (mapboxError) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Mapbox no configurado</h3>
        <p className="text-yellow-700 mb-4">{mapboxError}</p>
        <div className="bg-white border border-yellow-200 rounded-lg p-4 text-left">
          <p className="text-sm text-yellow-800 mb-2">Para configurar Mapbox:</p>
          <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
            <li>Ve a <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mapbox</a></li>
            <li>Crea una cuenta gratuita</li>
            <li>Obtén tu token de acceso público</li>
            <li>Agrega <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN=tu_token</code> en <code className="bg-yellow-100 px-1 rounded">.env.local</code></li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Búsqueda de dirección */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar dirección de entrega..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
            className="flex-1"
          />
          <Button
            onClick={handleSearchAddress}
            disabled={isSearching}
            className="px-4"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => selectSearchResult(result)}
                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900">{result.place_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mapa - Tamaño original */}
      <div className="relative">
        <div 
          ref={mapContainerRef} 
          className="w-full h-96 rounded-lg border border-gray-200"
        />
        
        {/* Instrucciones del mapa */}
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded-lg p-2 text-xs text-gray-600">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Punto A: Sucursal (fijo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Punto B: Hacer clic en el mapa</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Extender Window interface para Mapbox
declare global {
  interface Window {
    mapboxgl: any;
  }
}
