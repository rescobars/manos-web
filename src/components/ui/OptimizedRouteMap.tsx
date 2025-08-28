'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { getMapboxToken, isMapboxConfigured } from '@/lib/mapbox';

interface Location {
  lat: number;
  lng: number;
  address: string;
  id?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  deliveryLocation: Location;
  description?: string;
  totalAmount?: number;
  createdAt?: string;
}

interface OptimizedRoute {
  optimized_route: {
    stops: Array<{
      stop_number: number;
      order: {
        id: string;
        order_number: string;
        description: string;
        delivery_location: Location;
      };
      distance_from_previous: number;
      cumulative_distance: number;
    }>;
    total_distance: number;
    total_time: number;
    optimization_metrics: {
      algorithm: string;
      locations_optimized: number;
      solver_time: number;
    };
  };
  processing_time: number;
}

interface OptimizedRouteMapProps {
  pickupLocation: Location;
  optimizedRoute: OptimizedRoute;
  showOptimizedRoute: boolean;
}

export function OptimizedRouteMap({
  pickupLocation,
  optimizedRoute,
  showOptimizedRoute
}: OptimizedRouteMapProps) {
  const [map, setMap] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Generar color verde que va de claro a oscuro según el número de parada
  const generateStopColor = (stopNumber: number, totalStops: number) => {
    // Verde claro al inicio (no tan extremo)
    const startGreen = [187, 247, 208]; // #BBF7D0 - verde claro suave
    
    // Verde medio-oscuro al final (no tan extremo)
    const endGreen = [34, 197, 94]; // #22C55E - verde medio
    
    // Calcular qué tan oscuro debe ser (0 = claro, 1 = oscuro)
    const darknessFactor = (stopNumber - 1) / Math.max(totalStops - 1, 1);
    
    // Interpolación lineal entre el color claro y oscuro
    const red = Math.round(startGreen[0] + (endGreen[0] - startGreen[0]) * darknessFactor);
    const green = Math.round(startGreen[1] + (endGreen[1] - startGreen[1]) * darknessFactor);
    const blue = Math.round(startGreen[2] + (endGreen[2] - startGreen[2]) * darknessFactor);
    
    return `rgb(${red}, ${green}, ${blue})`;
  };

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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  if (!isMapboxConfigured()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Mapbox no configurado</h3>
        <p className="text-yellow-700">Configura tu token de Mapbox para usar la visualización de rutas.</p>
      </div>
    );
  }

  // Solo retornar null si no hay datos de ruta optimizada
  if (!optimizedRoute) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-500">
          <p className="text-sm">No hay datos de ruta optimizada disponibles</p>
          <p className="text-xs mt-1">showOptimizedRoute: {String(showOptimizedRoute)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🚀</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Ruta Optimizada con IA
            </h3>
            <p className="text-sm text-gray-600">
              Algoritmo: {optimizedRoute.optimized_route.optimization_metrics.algorithm}
            </p>
          </div>
        </div>
      </div>

      {/* MAPA - Ruta Optimizada */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          🗺️ Mapa de la Ruta Optimizada
        </h4>
        <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="relative">
            {/* Indicador de estado del mapa */}
            {!isMapReady && (
              <div className="absolute inset-0 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Inicializando mapa...</p>
                </div>
              </div>
            )}
            
            <div 
              ref={mapContainerRef} 
              className={`w-full h-96 rounded-lg overflow-hidden ${
                !isMapReady ? 'opacity-50' : 'opacity-100'
              } transition-opacity duration-300`}
              style={{ minHeight: '400px' }}
            />
            
            {/* Loading overlay para rutas */}
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando ruta optimizada...</p>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center z-20">
                <div className="text-center p-4">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-700 mb-2">{error}</p>
                  <button 
                    onClick={clearError}
                    className="px-3 py-1 text-xs border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 text-center text-sm text-gray-600">
            Mapa dedicado mostrando la ruta optimizada con {optimizedRoute.optimized_route.stops.length} paradas
          </div>
        </div>
      </div>
      
      {/* DETALLES - Métricas principales en tarjetas elegantes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700">
              {optimizedRoute.optimized_route.stops.length}
            </div>
            <div className="text-sm font-medium text-green-800">Paradas</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-700">
              {optimizedRoute.optimized_route.total_distance.toFixed(1)}
            </div>
            <div className="text-sm font-medium text-blue-800">km Total</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="text-3xl font-bold text-purple-700">
            {optimizedRoute.optimized_route.total_time.toFixed(0)}
          </div>
          <div className="text-sm font-medium text-purple-800">min Total</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-700">
              {optimizedRoute.optimized_route.optimization_metrics.solver_time}
            </div>
            <div className="text-sm font-medium text-orange-800">ms Solver</div>
          </div>
        </div>
      </div>
      
      {/* Lista detallada de paradas con mejor diseño */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Secuencia de Paradas Optimizada
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {optimizedRoute.optimized_route.stops.map((stop: any) => (
            <div key={stop.order.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div 
                  className="w-10 h-10 text-white text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: generateStopColor(stop.stop_number, optimizedRoute.optimized_route.stops.length) }}
                >
                  {stop.stop_number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">
                      #{stop.order.order_number}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      +{stop.distance_from_previous.toFixed(2)} km
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mb-1 line-clamp-2">
                    {stop.order.description}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    {stop.order.delivery_location.address}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 flex-shrink-0">
                  <div className="font-medium text-gray-700">
                    {stop.cumulative_distance.toFixed(2)} km
                  </div>
                  <div className="text-gray-500">acumulado</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Información adicional */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span className="text-sm font-medium text-gray-700">Información de la Optimización</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">Algoritmo:</span> {optimizedRoute.optimized_route.optimization_metrics.algorithm}
          </div>
          <div>
            <span className="font-medium">Locaciones optimizadas:</span> {optimizedRoute.optimized_route.optimization_metrics.locations_optimized}
          </div>
          <div>
            <span className="font-medium">Tiempo de procesamiento:</span> {optimizedRoute.processing_time.toFixed(3)}s
          </div>
        </div>
      </div>
    </div>
  );
}

// Funciones auxiliares para crear marcadores
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

function createPickupMarker() {
  const el = document.createElement('div');
  el.className = 'pickup-marker';
  el.style.cssText = `
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #3B82F6;
    color: white;
    font-weight: bold;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  `;
  el.innerHTML = '��';
  return el;
}
