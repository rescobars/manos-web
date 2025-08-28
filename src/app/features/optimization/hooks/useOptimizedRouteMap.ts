import { useState, useEffect, useRef } from 'react';
import { getMapboxToken, isMapboxConfigured } from '@/lib/mapbox';
import { Location, OptimizedRoute } from '../types';
import { generateStopColor, createPickupMarker } from '../utils';

export const useOptimizedRouteMap = (
  pickupLocation: Location,
  optimizedRoute: OptimizedRoute,
  showOptimizedRoute: boolean
) => {
  const [map, setMap] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Inicializar el mapa
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

  // Mostrar ruta optimizada cuando el mapa esté listo
  useEffect(() => {
    if (isMapReady && map && showOptimizedRoute && optimizedRoute) {
      getRouteGeometryFromMapbox();
    }
  }, [isMapReady, map, showOptimizedRoute, optimizedRoute, pickupLocation]);

  // Auto-enfoque del mapa cuando se muestra la ruta optimizada
  useEffect(() => {
    if (showOptimizedRoute && optimizedRoute && map && map.isStyleLoaded()) {
      // Pequeño delay para asegurar que el mapa esté completamente cargado
      const timer = setTimeout(() => {
        // Hacer zoom al mapa para mostrar toda la ruta optimizada
        if (map && pickupLocation) {
          try {
            const bounds = new window.mapboxgl.LngLatBounds();
            
            // Agregar la ubicación de pickup
            bounds.extend([pickupLocation.lng, pickupLocation.lat]);
            
            // Agregar todas las ubicaciones de entrega de la ruta optimizada
            optimizedRoute.optimized_route.stops.forEach((stop: any) => {
              bounds.extend([stop.order.delivery_location.lng, stop.order.delivery_location.lat]);
            });
            
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { 
                padding: 80,
                duration: 1000,
                essential: true
              });
            }
          } catch (error) {
            console.warn('Error en auto-enfoque:', error);
            // Fallback: centrar en pickup con zoom apropiado
            map.setCenter([pickupLocation.lng, pickupLocation.lat]);
            map.setZoom(11);
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [showOptimizedRoute, optimizedRoute, map, pickupLocation]);

  const initializeMap = () => {
    if (!mapContainerRef.current) return;

    const mapInstance = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [pickupLocation.lng, pickupLocation.lat],
      zoom: 11
    });

    mapInstance.on('load', () => {
      setMap(mapInstance);
      setIsMapReady(true);
    });
  };

  // Función para obtener la geometría de la ruta desde Mapbox usando el orden optimizado
  const getRouteGeometryFromMapbox = async () => {
    if (!map || !optimizedRoute?.optimized_route?.stops) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = getMapboxToken();
      if (!token) {
        throw new Error('Mapbox token no configurado');
      }

      // Construir coordenadas usando el orden optimizado
      let coordinates = `${pickupLocation.lng},${pickupLocation.lat}`;
      
      // Agregar coordenadas de los pedidos en el orden optimizado
      optimizedRoute.optimized_route.stops.forEach((stop: any) => {
        const deliveryLocation = stop.order.delivery_location;
        if (deliveryLocation.lat && deliveryLocation.lng) {
          coordinates += `;${deliveryLocation.lng},${deliveryLocation.lat}`;
        }
      });
      
      // Agregar regreso a sucursal
      coordinates += `;${pickupLocation.lng},${pickupLocation.lat}`;

      const baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';
      const profile = 'driving';
      
      const params = new URLSearchParams({
        access_token: token,
        geometries: 'geojson',
        overview: 'full',
        steps: 'true'
      });

      const url = `${baseUrl}/${profile}/${coordinates}?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error en la API Mapbox: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Mostrar la ruta completa en el mapa
        displayOptimizedRouteWithGeometry(route);
        
        // Ajustar vista para mostrar toda la ruta
        fitMapToOptimizedRouteWithGeometry(route);
      } else {
        throw new Error('No se pudo generar la geometría de la ruta desde Mapbox');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para mostrar la ruta optimizada con geometría completa
  const displayOptimizedRouteWithGeometry = (route: any) => {
    if (!map) return;
    
    try {
      // Limpiar marcadores anteriores
      if (map._markers) {
        map._markers.forEach((marker: any) => marker.remove());
        map._markers = [];
      }

      // Limpiar capas de ruta anteriores
      if (map.getLayer('optimized-route-layer')) {
        map.removeLayer('optimized-route-layer');
      }
      if (map.getSource('optimized-route')) {
        map.removeSource('optimized-route');
      }

      // Agregar la geometría de la ruta
      const routeGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: route.geometry
      };

      map.addSource('optimized-route', {
        type: 'geojson',
        data: routeGeoJSON
      });

      map.addLayer({
        id: 'optimized-route-layer',
        type: 'line',
        source: 'optimized-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#10B981',
          'line-width': 6,
          'line-opacity': 0.9
        }
      });

      // Agregar marcadores numerados para cada parada
      const stops = optimizedRoute.optimized_route.stops;
      
      stops.forEach((stop: any) => {
        const order = stop.order;
        const deliveryLocation = order.delivery_location;
        
        if (deliveryLocation.lat && deliveryLocation.lng) {
          const stopColor = generateStopColor(stop.stop_number, stops.length);
          
          // Crear marcador numerado
          const marker = new window.mapboxgl.Marker({
            element: createNumberedMarker(stop.stop_number, stopColor),
            anchor: 'bottom'
          })
          .setLngLat([deliveryLocation.lng, deliveryLocation.lat])
          .addTo(map);

          // Agregar popup con información del pedido
          const popup = new window.mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <div class="font-semibold text-sm">Parada #${stop.stop_number}</div>
                <div class="text-xs text-gray-600">Pedido: ${order.order_number}</div>
                <div class="text-xs text-gray-600">${order.description}</div>
                <div class="text-xs text-gray-500">Distancia: ${stop.distance_from_previous.toFixed(3)} km</div>
              </div>
            `);
          
          marker.setPopup(popup);
          
          // Guardar referencia del marcador
          if (!map._markers) map._markers = [];
          map._markers.push(marker);
        }
      });

      // Crear marcador para la ubicación de pickup
      const pickupMarker = new window.mapboxgl.Marker({
        element: createPickupMarker(),
        anchor: 'bottom'
      })
      .setLngLat([pickupLocation.lng, pickupLocation.lat])
      .addTo(map);

      if (!map._markers) map._markers = [];
      map._markers.push(pickupMarker);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error mostrando ruta optimizada');
    }
  };

  // Función para ajustar la vista del mapa a la ruta con geometría
  const fitMapToOptimizedRouteWithGeometry = (route: any) => {
    if (!map || !route.geometry || !route.geometry.coordinates) return;

    try {
      const bounds = new window.mapboxgl.LngLatBounds();
      
      // Agregar todas las coordenadas de la geometría de la ruta
      route.geometry.coordinates.forEach((coord: number[]) => {
        bounds.extend(coord);
      });
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      map.setCenter([pickupLocation.lng, pickupLocation.lat]);
      map.setZoom(12);
    }
  };

  const clearError = () => setError(null);

  return {
    map,
    isMapReady,
    isLoading,
    error,
    mapContainerRef,
    clearError
  };
};

// Función auxiliar para crear marcadores numerados
function createNumberedMarker(stopNumber: number, color: string) {
  const el = document.createElement('div');
  el.className = 'numbered-marker';
  el.style.cssText = `
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: ${color};
    color: white;
    font-weight: bold;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  `;
  el.textContent = stopNumber.toString();
  return el;
}
