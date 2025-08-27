'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Route, Clock, Car, AlertCircle, X } from 'lucide-react';
import { Button } from './Button';
import { useRouteOptimization } from '@/hooks/useRouteOptimization';
import { getMapboxToken, isMapboxConfigured } from '@/lib/mapbox';

interface Location {
  lat: number;
  lng: number;
  address: string;
  id?: string;
}

interface OptimizedRouteMapProps {
  pickupLocation: Location;
  deliveryLocations: Location[];
  onRouteOptimized?: (route: any) => void;
}

export function OptimizedRouteMap({
  pickupLocation,
  deliveryLocations,
  onRouteOptimized
}: OptimizedRouteMapProps) {
  const [map, setMap] = useState<any>(null);
  const [routeLayer, setRouteLayer] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
  const [showRoute, setShowRoute] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { optimizeRoute, getRouteSummary, isOptimizing, error, clearError } = useRouteOptimization();

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || !isMapboxConfigured()) return;

    const loadMapbox = async () => {
      try {
        if (window.mapboxgl) {
          initializeMap();
          return;
        }

        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.onload = () => {
          window.mapboxgl.accessToken = getMapboxToken();
          initializeMap();
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Mapbox:', error);
      }
    };

    loadMapbox();
  }, []);

  const initializeMap = () => {
    if (!mapContainerRef.current || !window.mapboxgl) return;

    try {
      const newMap = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [pickupLocation.lng, pickupLocation.lat],
        zoom: 12,
        // Deshabilitar eventos de analytics que pueden causar problemas
        trackResize: false,
        attributionControl: false
      });

      newMap.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
      setMap(newMap);

      // Agregar marcador de pickup
      addPickupMarker(newMap);
    } catch (error) {
      console.error('Error initializing Mapbox map:', error);
    }
  };

  const addPickupMarker = (mapInstance: any) => {
    const pickupMarker = new window.mapboxgl.Marker({ color: '#3B82F6' })
      .setLngLat([pickupLocation.lng, pickupLocation.lat])
      .addTo(mapInstance);

    const pickupPopup = new window.mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="text-center">
          <div class="font-semibold text-blue-600">Sucursal</div>
          <div class="text-sm text-gray-600">${pickupLocation.address}</div>
        </div>
      `);
    pickupMarker.setPopup(pickupPopup);

    setMarkers(prev => [...prev, pickupMarker]);
  };

  const addDeliveryMarkers = (mapInstance: any, waypoints: Location[]) => {
    // Limpiar marcadores anteriores
    markers.forEach(marker => marker.remove());
    setMarkers([]);

    // Agregar marcador de pickup
    addPickupMarker(mapInstance);

    // Agregar marcadores de entrega numerados
    waypoints.slice(1).forEach((location, index) => {
      const marker = new window.mapboxgl.Marker({ color: '#10B981' })
        .setLngLat([location.lng, location.lat])
        .addTo(mapInstance);

      const popup = new window.mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="text-center">
            <div class="font-semibold text-green-600">Entrega #${index + 1}</div>
            <div class="text-sm text-gray-600">${location.address}</div>
          </div>
        `);
      marker.setPopup(popup);

      setMarkers(prev => [...prev, marker]);
    });
  };

  const handleOptimizeRoute = async () => {
    if (deliveryLocations.length === 0) return;

    const route = await optimizeRoute(pickupLocation, deliveryLocations);
    if (route) {
      setOptimizedRoute(route);
      onRouteOptimized?.(route);
      setShowRoute(true);
      displayRouteOnMap(route);
    }
  };

  const displayRouteOnMap = (route: any) => {
    if (!map) return;

    // Debug: Ver qué contiene route.route
    console.log('🔍 Route object completo:', route);
    console.log('🔍 route.route:', route.route);
    console.log('🔍 route.route.geometry:', route.route?.geometry);

    // Remover capa anterior si existe
    if (routeLayer) {
      map.removeLayer(routeLayer);
      map.removeSource(routeLayer);
    }

    // Agregar la ruta al mapa
    map.addSource('route', {
      type: 'geojson',
      data: route.route
    });

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3B82F6',
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    setRouteLayer('route');

    // Agregar marcadores numerados en el orden optimizado
    addDeliveryMarkers(map, route.waypoints);

    // Ajustar vista para mostrar toda la ruta
    const bounds = new window.mapboxgl.LngLatBounds();
    route.waypoints.forEach(waypoint => {
      bounds.extend([waypoint.lng, waypoint.lat]);
    });
    
    map.fitBounds(bounds, { padding: 50 });
  };

  const clearRoute = () => {
    if (!map) return;

    if (routeLayer) {
      map.removeLayer(routeLayer);
      map.removeSource(routeLayer);
      setRouteLayer(null);
    }

    setShowRoute(false);
    setOptimizedRoute(null);
    
    // Limpiar marcadores y volver a mostrar solo pickup
    markers.forEach(marker => marker.remove());
    setMarkers([]);
    addPickupMarker(map);
    
    // Centrar en pickup
    map.flyTo({
      center: [pickupLocation.lng, pickupLocation.lat],
      zoom: 12
    });
  };

  if (!isMapboxConfigured()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Mapbox no configurado</h3>
        <p className="text-yellow-700">Configura tu token de Mapbox para usar la optimización de rutas.</p>
      </div>
    );
  }

  const routeSummary = optimizedRoute ? getRouteSummary(optimizedRoute) : null;

  return (
    <div className="space-y-4">
      {/* Controles de optimización */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button
          onClick={handleOptimizeRoute}
          disabled={isOptimizing || deliveryLocations.length === 0}
          className="flex items-center gap-2"
        >
          <Route className="w-4 h-4" />
          {isOptimizing ? 'Optimizando...' : 'Optimizar Ruta'}
        </Button>

        {showRoute && (
          <Button
            onClick={clearRoute}
            variant="outline"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Limpiar Ruta
          </Button>
        )}

        {deliveryLocations.length > 0 && (
          <span className="text-sm text-gray-600">
            {deliveryLocations.length} punto{deliveryLocations.length !== 1 ? 's' : ''} de entrega
          </span>
        )}
      </div>

      {/* Resumen de la ruta optimizada */}
      {routeSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Ruta Optimizada</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">{routeSummary.totalDistance}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">{routeSummary.totalDuration}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">{routeSummary.waypointCount} paradas</span>
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="relative">
        <div 
          ref={mapContainerRef} 
          className="w-full h-96 rounded-lg border border-gray-200"
        />
        
        {/* Instrucciones */}
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded-lg p-2 text-xs text-gray-600">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Sucursal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Puntos de entrega</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          <Button
            onClick={clearError}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Cerrar
          </Button>
        </div>
      )}
    </div>
  );
}

// Extender Window interface para Mapbox
declare global {
  interface Window {
    mapboxgl: any;
  }
}
