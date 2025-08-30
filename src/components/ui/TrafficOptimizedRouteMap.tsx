'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, MapPin, Clock, Navigation, Car } from 'lucide-react';
import { getMapboxToken, isMapboxConfigured } from '@/lib/mapbox';

// Declaración de tipos para Mapbox
declare global {
  interface Window {
    mapboxgl: any;
  }
}

interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

interface Order {
  id: string;
  orderNumber: string;
  deliveryLocation: {
    lat: number;
    lng: number;
    address: string;
    id: string;
  };
  description?: string;
  totalAmount: number;
  createdAt: string;
}

interface TrafficOptimizedRouteMapProps {
  pickupLocation: PickupLocation;
  trafficOptimizedRoute: any; // Respuesta de TomTom
  orders: Order[];
}

export function TrafficOptimizedRouteMap({
  pickupLocation,
  trafficOptimizedRoute,
  orders
}: TrafficOptimizedRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState<any>(null);

  useEffect(() => {
    // Verificar si la solución ya está lista
    if ('routes' in trafficOptimizedRoute || 'optimized_route' in trafficOptimizedRoute) {
      setSolution(trafficOptimizedRoute);
      setIsLoading(false);
    } else {
      // La solución aún está procesándose, hacer polling
      pollForSolution(trafficOptimizedRoute.id);
    }
  }, [trafficOptimizedRoute]);

  const pollForSolution = async (id: string) => {
    try {
      const response = await fetch(`/api/route-optimization-mapbox?id=${id}`);
      const result = await response.json();
      
      if (result.success && ('routes' in result.data || 'optimized_route' in result.data)) {
        setSolution(result.data);
        setIsLoading(false);
      } else if (result.success && result.data.status === 'processing') {
        // Esperar 5 segundos y verificar de nuevo
        setTimeout(() => pollForSolution(id), 5000);
      } else {
        setError('Error al obtener la solución de optimización');
        setIsLoading(false);
      }
    } catch (error) {
      setError('Error de conexión');
      setIsLoading(false);
    }
  };

  // Función auxiliar para encontrar el punto más cercano en la geometría
  const findClosestPointIndex = (geometry: [number, number][], targetPoint: [number, number]): number => {
    let closestIndex = -1;
    let minDistance = Infinity;
    
    geometry.forEach((point, index) => {
      const distance = Math.sqrt(
        Math.pow(point[0] - targetPoint[0], 2) + 
        Math.pow(point[1] - targetPoint[1], 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  };

  // Inicializar el mapa de Mapbox
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
        setError('Error al cargar Mapbox');
      }
    };

    loadMapbox();
  }, []);

  // Mostrar ruta optimizada cuando el mapa esté listo
  useEffect(() => {
    if (isMapReady && map && solution) {
      displayOptimizedRoute();
    }
  }, [isMapReady, map, solution, pickupLocation, orders]);

  const initializeMap = () => {
    if (!mapContainerRef.current) return;

    const mapInstance = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [pickupLocation.lng, pickupLocation.lat],
      zoom: 12,
      attributionControl: false
    });

    // Agregar controles de navegación
    mapInstance.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
    mapInstance.addControl(new window.mapboxgl.FullscreenControl(), 'top-right');

    // Agregar capa de tráfico en tiempo real
    mapInstance.on('load', () => {
      // Agregar capa de tráfico de Mapbox
      if (mapInstance.getSource('mapbox-traffic')) {
        mapInstance.addLayer({
          id: 'traffic-layer',
          type: 'line',
          source: 'mapbox-traffic',
          'source-layer': 'traffic',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'congestion'], 'low'], '#4ade80', // Verde para tráfico bajo
              ['==', ['get', 'congestion'], 'moderate'], '#fbbf24', // Amarillo para tráfico moderado
              ['==', ['get', 'congestion'], 'heavy'], '#f97316', // Naranja para tráfico pesado
              ['==', ['get', 'congestion'], 'severe'], '#dc2626', // Rojo para tráfico severo
              '#6b7280' // Gris por defecto
            ],
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 1,
              15, 3
            ],
            'line-opacity': 0.8
          }
        });
      }

      setIsMapReady(true);
    });

    setMap(mapInstance);
  };

  const displayOptimizedRoute = async () => {
    if (!map || !solution) return;

    // Limpiar capas existentes
    if (map.getLayer('route-line')) map.removeLayer('route-line');
    if (map.getSource('route-source')) map.removeSource('route-source');
    if (map.getLayer('stops-layer')) map.removeLayer('stops-layer');
    if (map.getLayer('stops-text')) map.removeLayer('stops-text');
    if (map.getSource('stops-source')) map.removeSource('stops-source');
    if (map.getLayer('traffic-segments')) map.removeLayer('traffic-segments');
    if (map.getSource('traffic-segments-source')) map.removeSource('traffic-segments-source');

    const routes = solution.routes || solution.optimized_route?.routes || [];
    
    if (routes.length > 0) {
      const firstRoute = routes[0];
      const stops: any[] = [];
      let deliveryStopNumber = 1;

      // Procesar paradas con numeración correcta
      firstRoute.stops.forEach((stop: any, stopIndex: number) => {
        if (stop.coordinates) {
          let title = '';
          let stopNumber = 0;
          
          if (stop.type === 'start') {
            title = 'Almacén (Inicio)';
            stopNumber = 0;
          } else if (stop.type === 'dropoff') {
            title = `Parada ${deliveryStopNumber}`;
            stopNumber = deliveryStopNumber;
            deliveryStopNumber++;
          } else if (stop.type === 'end') {
            title = 'Almacén (Fin)';
            stopNumber = deliveryStopNumber;
          }
          
          stops.push({
            type: stop.type,
            coordinates: [stop.coordinates.lng, stop.coordinates.lat],
            properties: {
              title: title,
              description: stop.address || 'Sin dirección',
              eta: stop.eta,
              distance: stop.odometer,
              stopNumber: stopNumber,
              location: stop.location
            }
          });
        }
      });

      // Obtener rutas reales usando Mapbox Directions API
      const waypoints = stops.map(stop => stop.coordinates.join(','));
      const profile = 'driving'; // o 'driving-traffic' para datos de tráfico en tiempo real
      
      try {
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${waypoints.join(';')}?geometries=geojson&overview=full&steps=true&access_token=${getMapboxToken()}`;
        
        const response = await fetch(directionsUrl);
        const directionsData = await response.json();
        
        if (directionsData.routes && directionsData.routes.length > 0) {
          const route = directionsData.routes[0];
          const routeGeometry = route.geometry.coordinates;
          
          // Agregar fuente de la ruta real
          map.addSource('route-source', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeGeometry
              }
            }
          });

          // Agregar capa de la ruta real
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route-source',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 6,
              'line-opacity': 0.9
            }
          });

          // Agregar capa de segmentos con tráfico usando la geometría real
          if (firstRoute.segments) {
            const trafficFeatures = firstRoute.segments.map((segment: any, segmentIndex: number) => {
              // Encontrar los puntos de inicio y fin del segmento en la geometría real
              const fromStop = stops.find(s => s.properties.location === segment.from_stop);
              const toStop = stops.find(s => s.properties.location === segment.to_stop);
              
              if (fromStop && toStop) {
                // Buscar los índices en la geometría de la ruta
                const fromIndex = findClosestPointIndex(routeGeometry, fromStop.coordinates);
                const toIndex = findClosestPointIndex(routeGeometry, toStop.coordinates);
                
                if (fromIndex !== -1 && toIndex !== -1) {
                  // Extraer la geometría del segmento de la ruta real
                  const segmentGeometry = routeGeometry.slice(
                    Math.min(fromIndex, toIndex),
                    Math.max(fromIndex, toIndex) + 1
                  );
                  
                  return {
                    type: 'Feature',
                    properties: {
                      traffic_status: segment.traffic_status,
                      traffic_factor: segment.traffic_factor,
                      distance: segment.distance_meters,
                      travel_time: segment.travel_time_seconds,
                      from_stop: segment.from_stop,
                      to_stop: segment.to_stop
                    },
                    geometry: {
                      type: 'LineString',
                      coordinates: segmentGeometry
                    }
                  };
                }
              }
              return null;
            }).filter(Boolean);

            if (trafficFeatures.length > 0) {
              map.addSource('traffic-segments-source', {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: trafficFeatures
                }
              });

              // Capa de segmentos con colores de tráfico
              map.addLayer({
                id: 'traffic-segments',
                type: 'line',
                source: 'traffic-segments-source',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': [
                    'case',
                    ['==', ['get', 'traffic_status'], 'light'], '#4ade80', // Verde para tráfico ligero
                    ['==', ['get', 'traffic_status'], 'normal'], '#fbbf24', // Amarillo para tráfico normal
                    ['==', ['get', 'traffic_status'], 'heavy'], '#f97316', // Naranja para tráfico pesado
                    ['==', ['get', 'traffic_status'], 'severe'], '#dc2626', // Rojo para tráfico severo
                    '#6b7280' // Gris por defecto
                  ],
                  'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    10, 3,
                    15, 5
                  ],
                  'line-opacity': 0.8
                }
              });

              // Agregar popups para segmentos de tráfico
              map.on('click', 'traffic-segments', (e: any) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const properties = e.features[0].properties;

                const popupContent = `
                  <div class="text-sm">
                    <b>Segmento de Ruta</b><br/>
                    <b>De:</b> ${properties.from_stop}<br/>
                    <b>A:</b> ${properties.to_stop}<br/>
                    <b>Distancia:</b> ${(properties.distance / 1000).toFixed(1)} km<br/>
                    <b>Tiempo:</b> ${Math.round(properties.travel_time / 60)} min<br/>
                    <b>Tráfico:</b> ${properties.traffic_status}<br/>
                    <b>Factor:</b> ${properties.traffic_factor}x
                  </div>
                `;

                new window.mapboxgl.Popup()
                  .setLngLat(coordinates[Math.floor(coordinates.length / 2)])
                  .setHTML(popupContent)
                  .addTo(map);
              });

              // Cambiar cursor al pasar sobre segmentos
              map.on('mouseenter', 'traffic-segments', () => {
                map.getCanvas().style.cursor = 'pointer';
              });

              map.on('mouseleave', 'traffic-segments', () => {
                map.getCanvas().style.cursor = '';
              });
            }
          }

          // Ajustar vista para mostrar toda la ruta
          const bounds = new window.mapboxgl.LngLatBounds();
          routeGeometry.forEach((coord: [number, number]) => bounds.extend(coord));
          
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { 
              padding: 80,
              duration: 1000,
              essential: true
            });
          }
        }
      } catch (error) {
        console.error('Error obteniendo rutas de Mapbox:', error);
        // Fallback: usar la geometría de TomTom si falla Mapbox
        const fallbackRouteCoordinates: [number, number][] = [];
        
        if (firstRoute.segments) {
          firstRoute.segments.forEach((segment: any) => {
            if (segment.geometry && segment.geometry.length > 0) {
              segment.geometry.forEach((point: any) => {
                fallbackRouteCoordinates.push([point.lng, point.lat]);
              });
            }
          });
        }

        // Agregar fuente de la ruta fallback
        map.addSource('route-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: fallbackRouteCoordinates
            }
          }
        });

        // Agregar capa de la ruta fallback
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 6,
            'line-opacity': 0.9
          }
        });

        // Ajustar vista para mostrar toda la ruta fallback
        if (fallbackRouteCoordinates.length > 0) {
          const bounds = new window.mapboxgl.LngLatBounds();
          fallbackRouteCoordinates.forEach((coord: [number, number]) => bounds.extend(coord));
          
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { 
              padding: 80,
              duration: 1000,
              essential: true
            });
          }
        }
      }

      // Agregar fuente de las paradas
      map.addSource('stops-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stops.map(stop => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: stop.coordinates
            },
            properties: stop.properties
          }))
        }
      });

      // Agregar capa de las paradas
      map.addLayer({
        id: 'stops-layer',
        type: 'circle',
        source: 'stops-source',
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'type'], 'start'], 12,
            ['==', ['get', 'type'], 'end'], 12,
            10
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'type'], 'start'], '#059669', // Verde para inicio
            ['==', ['get', 'type'], 'end'], '#dc2626', // Rojo para fin
            '#10b981' // Verde para paradas intermedias
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3
        }
      });

      // Agregar capa de texto para los números de parada
      map.addLayer({
        id: 'stops-text',
        type: 'symbol',
        source: 'stops-source',
        layout: {
          'text-field': [
            'case',
            ['==', ['get', 'type'], 'start'], '🏢',
            ['==', ['get', 'type'], 'end'], '🏢',
            ['to-string', ['get', 'stopNumber']]
          ],
          'text-size': 12,
          'text-font': ['Open Sans Bold'],
          'text-offset': [0, 0],
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });

      // Agregar popups para las paradas
      map.on('click', 'stops-layer', (e: any) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;

        let popupContent = '';
        if (properties.type === 'start' || properties.type === 'end') {
          popupContent = `
            <div class="text-sm">
              <b>${properties.title}</b><br/>
              <b>Dirección:</b> ${properties.description}<br/>
              <b>ETA:</b> ${properties.eta ? new Date(properties.eta).toLocaleTimeString() : 'N/A'}<br/>
              <b>Distancia acumulada:</b> ${properties.distance ? (properties.distance / 1000).toFixed(1) + ' km' : 'N/A'}
            </div>
          `;
        } else {
          const eta = properties.eta ? new Date(properties.eta).toLocaleTimeString() : 'N/A';
          const distance = properties.distance ? (properties.distance / 1000).toFixed(1) + ' km' : 'N/A';
          
          popupContent = `
            <div class="text-sm">
              <b>${properties.title}</b><br/>
              <b>Dirección:</b> ${properties.description}<br/>
              <b>ETA:</b> ${eta}<br/>
              <b>Distancia acumulada:</b> ${distance}
            </div>
          `;
        }

        new window.mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map);
      });

      // Cambiar cursor al pasar sobre las paradas
      map.on('mouseenter', 'stops-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'stops-layer', () => {
        map.getCanvas().style.cursor = '';
      });
    }
  };

  if (!isMapboxConfigured()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Mapbox no configurado</h3>
        <p className="text-yellow-700">Configura tu token de Mapbox para usar la visualización de rutas con tráfico.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error en el mapa</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🚦</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Ruta Optimizada con TomTom + Tráfico
            </h3>
            <p className="text-sm text-gray-600">
              Optimización usando TomTom con visualización de tráfico en tiempo real
            </p>
          </div>
        </div>
      </div>

      {/* Información de la optimización */}
      {solution && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">Rutas generadas</p>
                <p className="text-lg font-bold text-orange-700">
                  {solution.routes?.length || solution.optimized_route?.routes?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">Vehículos utilizados</p>
                <p className="text-lg font-bold text-orange-700">
                  {solution.routes?.length || solution.optimized_route?.routes?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">Estado</p>
                <p className="text-lg font-bold text-orange-700">Optimizado con TomTom</p>
              </div>
            </div>
          </div>
          
          {/* Información adicional de la ruta */}
          {solution.routes && solution.routes[0] && (
            <div className="mt-4 pt-4 border-t border-orange-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-orange-700 font-medium">Total de paradas</p>
                  <p className="text-orange-900 font-bold">{solution.routes[0].stops.length}</p>
                </div>
                <div>
                  <p className="text-orange-700 font-medium">Distancia total</p>
                  <p className="text-orange-900 font-bold">
                    {solution.routes[0].total_distance_meters 
                      ? (solution.routes[0].total_distance_meters / 1000).toFixed(1) + ' km'
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-orange-700 font-medium">Tiempo total</p>
                  <p className="text-orange-900 font-bold">
                    {solution.routes[0].total_travel_time_seconds 
                      ? Math.round(solution.routes[0].total_travel_time_seconds / 60) + ' min'
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-orange-700 font-medium">Pedidos optimizados</p>
                  <p className="text-orange-900 font-bold">
                    {solution.routes[0].stops.filter((stop: any) => stop.type === 'dropoff').length}
                  </p>
                </div>
              </div>
              
              {/* Resumen de tráfico */}
              {solution.routes[0].traffic_summary && (
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <h6 className="text-sm font-semibold text-orange-700 mb-2">Resumen de Tráfico</h6>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-orange-600">Estado general</p>
                      <p className="text-orange-800 font-bold capitalize">{solution.routes[0].traffic_summary.overall_traffic}</p>
                    </div>
                    <div>
                      <p className="text-orange-600">Impacto del tráfico</p>
                      <p className="text-orange-800 font-bold">{solution.routes[0].traffic_summary.traffic_impact}</p>
                    </div>
                    <div>
                      <p className="text-orange-600">Segmentos con tráfico</p>
                      <p className="text-orange-800 font-bold">{solution.routes[0].traffic_summary.segments_with_traffic}</p>
                    </div>
                    <div>
                      <p className="text-orange-600">Factor promedio</p>
                      <p className="text-orange-800 font-bold">{solution.routes[0].traffic_summary.average_traffic_factor}x</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mapa */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
          🗺️ Mapa de Rutas Optimizadas con Tráfico
        </h4>
        <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="relative">
            {/* Indicador de estado del mapa */}
            {!isMapReady && (
              <div className="absolute inset-0 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando ruta optimizada...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

              {/* Leyenda del mapa */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-3">Leyenda del Mapa</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">🏢</div>
              <span>Inicio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
              <span>Parada 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
              <span>Parada 2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">🏢</div>
              <span>Fin</span>
            </div>
          </div>
          
          {/* Leyenda de tráfico */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h6 className="text-xs font-semibold text-gray-600 mb-2">Segmentos de Tráfico</h6>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Ligero</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>Pesado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Severo</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Haz clic en cualquier segmento de la ruta para ver detalles del tráfico
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Los números indican el orden de entrega optimizado por TomTom
            </p>
          </div>
        </div>
    </div>
  );
}
