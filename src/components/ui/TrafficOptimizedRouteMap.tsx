'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, MapPin, Clock, Navigation, Car, Route } from 'lucide-react';
import { getMapboxToken, isMapboxConfigured } from '@/lib/mapbox';

// Declaración de tipos para Mapbox
declare global {
  interface Window {
    mapboxgl: any;
  }
}

interface Point {
  lat: number;
  lon: number;
  name: string;
}

interface RouteSummary {
  total_time: number;
  total_distance: number;
  traffic_delay: number;
  base_time?: number;
  traffic_time?: number;
  fuel_consumption?: number | null;
}

interface RoutePoint {
  lat: number;
  lon: number;
  traffic_delay: number;
  speed: number | null;
  congestion_level: string;
  waypoint_type: 'origin' | 'destination' | 'waypoint' | 'route';
  waypoint_index: number | null;
}

interface Route {
  summary: RouteSummary;
  points: RoutePoint[];
  route_id: string;
}

interface TrafficOptimizationData {
  route_info: {
    origin: Point;
    destination: Point;
    waypoints: Point[];
    total_waypoints: number;
  };
  primary_route: Route;
  alternative_routes: Route[] | null;
  request_info: any;
  traffic_conditions: any;
}

interface TrafficOptimizedRouteMapProps {
  origin: Point;
  destination: Point;
  waypoints: Point[];
  trafficOptimizedRoute: TrafficOptimizationData;
  showAlternatives?: boolean;
}

export function TrafficOptimizedRouteMap({
  origin,
  destination,
  waypoints,
  trafficOptimizedRoute,
  showAlternatives = false
}: TrafficOptimizedRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route>(trafficOptimizedRoute.primary_route);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Colores para cada ruta
  const getRouteColor = (routeId: string, isPrimary: boolean) => {
    if (isPrimary) return '#10b981'; // Verde para ruta primaria
    
    // 10 colores únicos para rutas alternativas (1-10)
    const alternativeColors = [
      '#3b82f6', // Azul - Alternativa 1
      '#8b5cf6', // Púrpura - Alternativa 2
      '#f59e0b', // Naranja - Alternativa 3
      '#ef4444', // Rojo - Alternativa 4
      '#06b6d4', // Cian - Alternativa 5
      '#84cc16', // Verde lima - Alternativa 6
      '#f97316', // Naranja oscuro - Alternativa 7
      '#a855f7', // Violeta - Alternativa 8
      '#ec4899', // Rosa - Alternativa 9
      '#14b8a6'  // Verde azulado - Alternativa 10
    ];
    
    // Si routeId es un número, usarlo directamente
    if (typeof routeId === 'number') {
      return alternativeColors[routeId % alternativeColors.length];
    }
    
    // Si es string, intentar parsearlo
    const numericId = parseInt(routeId);
    if (!isNaN(numericId)) {
      return alternativeColors[numericId % alternativeColors.length];
    }
    
    // Si no se puede parsear, usar un color por defecto basado en el string
    const hash = routeId.split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
      return a;
    }, 0);
    return alternativeColors[Math.abs(hash) % alternativeColors.length];
  };

  useEffect(() => {
    // Preparar todas las rutas disponibles
    const routes = [trafficOptimizedRoute.primary_route];
    if (trafficOptimizedRoute.alternative_routes) {
      routes.push(...trafficOptimizedRoute.alternative_routes);
    }
    setAvailableRoutes(routes);
    setSelectedRoute(trafficOptimizedRoute.primary_route);
  }, [trafficOptimizedRoute]);

  // Inicializar el mapa de Mapbox
  useEffect(() => {
    if (!mapContainerRef.current || !isMapboxConfigured()) return;

    const allPoints = [origin, ...waypoints, destination];

    if (!allPoints || allPoints.length === 0) {
      setInitializationError('No hay puntos disponibles para mostrar en el mapa');
      return;
    }

    const validPoints = allPoints.filter(point => 
      typeof point.lat === 'number' && 
      typeof point.lon === 'number' && 
      !isNaN(point.lat) && 
      !isNaN(point.lon) &&
      point.lat !== 0 && 
      point.lon !== 0
    );

    if (validPoints.length === 0) {
      setInitializationError('Los puntos proporcionados no tienen coordenadas válidas');
      return;
    }

    setIsInitializing(true);
    setInitializationError(null);

    const loadMapbox = async () => {
      try {
        if (window.mapboxgl) {
          initializeMap(validPoints);
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
          initializeMap(validPoints);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Mapbox:', error);
        setInitializationError('Error al cargar Mapbox');
        setIsInitializing(false);
      }
    };

    loadMapbox();
  }, [origin, destination, waypoints]);

  // Mostrar ruta cuando el mapa esté listo
  useEffect(() => {
    if (isMapReady && map && selectedRoute) {
      displayRoute();
    }
  }, [isMapReady, map, selectedRoute]);

  const initializeMap = (validPoints: Point[]) => {
    if (!mapContainerRef.current) return;

    const centerLat = validPoints.reduce((sum, point) => sum + point.lat, 0) / validPoints.length;
    const centerLon = validPoints.reduce((sum, point) => sum + point.lon, 0) / validPoints.length;

    if (isNaN(centerLat) || isNaN(centerLon)) {
      setInitializationError('Error al calcular el centro del mapa');
      setIsInitializing(false);
      return;
    }

    const mapInstance = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLon, centerLat],
      zoom: 12,
      attributionControl: false
    });

    mapInstance.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
    mapInstance.addControl(new window.mapboxgl.FullscreenControl(), 'top-right');

    mapInstance.on('load', () => {
      setIsMapReady(true);
      setIsInitializing(false);
    });

    setMap(mapInstance);
  };

  const displayRoute = async () => {
    if (!map || !selectedRoute) return;

    // Limpiar capas existentes
    if (map.getLayer('route-line')) map.removeLayer('route-line');
    if (map.getSource('route-source')) map.removeSource('route-source');
    if (map.getLayer('waypoints-layer')) map.removeLayer('waypoints-layer');
    if (map.getLayer('waypoints-text')) map.removeLayer('waypoints-text');
    if (map.getSource('waypoints-source')) map.removeSource('waypoints-source');

    // Usar los puntos reales de la ruta seleccionada de TomTom
    if (selectedRoute.points && selectedRoute.points.length > 0) {
      const routeCoordinates = selectedRoute.points.map(point => [point.lon, point.lat]);
      
      // Agregar fuente de la ruta
      map.addSource('route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            route_id: selectedRoute.route_id,
            route_type: selectedRoute.route_id === 'primary' ? 'primary' : 'alternative'
          },
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          }
        }
      });

      // Agregar capa de la ruta con color específico
      const isPrimary = selectedRoute.route_id === 'primary';
      const routeColor = getRouteColor(selectedRoute.route_id, isPrimary);
      
      // Debug: Verificar el color generado
      console.log('🎨 Debug - Color de ruta:', {
        routeId: selectedRoute.route_id,
        isPrimary,
        routeColor,
        type: typeof selectedRoute.route_id
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': routeColor,
          'line-width': isPrimary ? 5 : 4,
          'line-opacity': 0.8
        }
      });

      // Ajustar vista para mostrar toda la ruta
      const bounds = new window.mapboxgl.LngLatBounds();
      routeCoordinates.forEach((coord: number[]) => bounds.extend(coord as [number, number]));
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { 
          padding: 80,
          duration: 1000,
          essential: true
        });
      }
    }

    // Agregar fuente de los waypoints
    const allPoints = [origin, ...waypoints, destination];
    map.addSource('waypoints-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: allPoints.map((point: Point, index: number) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.lon, point.lat]
          },
          properties: {
            index: index,
            title: point.name || `Punto ${index + 1}`,
            isStart: index === 0,
            isEnd: index === allPoints.length - 1,
            pointType: index === 0 ? 'origin' : index === allPoints.length - 1 ? 'destination' : 'waypoint'
          }
        }))
      }
    });

    // Agregar capa de los waypoints
    map.addLayer({
      id: 'waypoints-layer',
      type: 'circle',
      source: 'waypoints-source',
      paint: {
        'circle-radius': [
          'case',
          ['==', ['get', 'isStart'], true], 12,
          ['==', ['get', 'isEnd'], true], 12,
          10
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'isStart'], true], '#059669',
          ['==', ['get', 'isEnd'], true], '#dc2626',
          '#10b981'
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3
      }
    });

    // Agregar capa de texto para los waypoints
    map.addLayer({
      id: 'waypoints-text',
      type: 'symbol',
      source: 'waypoints-source',
      layout: {
        'text-field': [
          'case',
          ['==', ['get', 'isStart'], true], '🏁',
          ['==', ['get', 'isEnd'], true], '🎯',
          ['to-string', ['+', ['get', 'index'], 1]]
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

    // Agregar popups para los waypoints
    map.on('click', 'waypoints-layer', (e: any) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;

      const popupContent = `
        <div class="text-sm">
          <b>${properties.title}</b><br/>
          <b>Coordenadas:</b> ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}<br/>
          <b>Tipo:</b> ${properties.isStart ? 'Inicio' : properties.isEnd ? 'Fin' : 'Intermedio'}
        </div>
      `;

      new window.mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    });

    // Cambiar cursor al pasar sobre los waypoints
    map.on('mouseenter', 'waypoints-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'waypoints-layer', () => {
      map.getCanvas().style.cursor = '';
    });
  };

  const handleRouteChange = (route: Route) => {
    setSelectedRoute(route);
    if (map && route) {
      setTimeout(() => {
        displayRoute();
      }, 100);
    }
  };

  // Función para obtener el orden real de las paradas basado en la ruta del endpoint
  const getRealStopOrder = () => {
    if (!selectedRoute || !selectedRoute.points) return [];
    
    // Filtrar SOLO los puntos con waypoint_type: "waypoint" (estas son las paradas reales)
    // Los puntos con waypoint_type: "route" son solo coordenadas para pintar la ruta
    const waypointPoints = selectedRoute.points.filter(point => 
      point.waypoint_type === 'waypoint'
    );
    
    // Ordenar por waypoint_index (orden de atención) y agregar número de parada
    return waypointPoints
      .sort((a, b) => (a.waypoint_index || 0) - (b.waypoint_index || 0))
      .map((point, index) => ({
        ...point,
        stopNumber: index + 2 // Comenzar en 2
      }));
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

  const realStopOrder = getRealStopOrder();
  
  // Debug: Mostrar información de los datos recibidos
  console.log('🔍 Debug - Datos de entrada:', {
    origin,
    waypoints: waypoints.length,
    destination,
    selectedRoutePoints: selectedRoute?.points?.length || 0,
    waypointTypes: selectedRoute?.points?.map(p => p.waypoint_type) || [],
    waypointIndexes: selectedRoute?.points?.map(p => p.waypoint_index) || [],
    realStopOrder: realStopOrder.length,
    waypointPoints: selectedRoute?.points?.filter(p => p.waypoint_type === 'waypoint').length || 0
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🚦</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Optimización de Ruta con Tráfico
            </h3>
            <p className="text-sm text-gray-600">
              Visualización de rutas optimizadas considerando condiciones de tráfico
            </p>
          </div>
        </div>
      </div>

      {/* Selector de rutas */}
      {showAlternatives && availableRoutes.length > 1 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Seleccionar Ruta</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableRoutes.map((route, index) => {
              const isPrimary = route.route_id === 'primary';
              const routeColor = getRouteColor(route.route_id, isPrimary);
              
              return (
                <button
                  key={route.route_id}
                  onClick={() => handleRouteChange(route)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedRoute.route_id === route.route_id
                      ? 'border-blue-600 bg-blue-100'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: routeColor }}
                      ></div>
                      <span className="font-medium text-sm">
                        {isPrimary ? 'Ruta Principal' : `Alternativa ${index}`}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Tiempo: {Math.round(route.summary.total_time / 60)} min</div>
                      <div>Distancia: {(route.summary.total_distance / 1000).toFixed(1)} km</div>
                      <div>Retraso: {route.summary.traffic_delay}s</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Información de la ruta seleccionada */}
      {selectedRoute && (
        <div className={`mb-6 p-4 border rounded-lg ${
          selectedRoute.route_id === 'primary' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getRouteColor(selectedRoute.route_id, selectedRoute.route_id === 'primary') }}
            ></div>
            <h4 className="font-semibold text-gray-900">
              {selectedRoute.route_id === 'primary' ? 'Ruta Principal' : 'Ruta Alternativa'}
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Tiempo Total</p>
                <p className="text-lg font-bold text-blue-700">
                  {Math.round(selectedRoute.summary.total_time / 60)} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Distancia Total</p>
                <p className="text-lg font-bold text-blue-700">
                  {(selectedRoute.summary.total_distance / 1000).toFixed(1)} km
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Retraso por Tráfico</p>
                <p className="text-lg font-bold text-blue-700">
                  {selectedRoute.summary.traffic_delay}s
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          🗺️ Mapa de Ruta
        </h4>
        <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="relative">
            {isInitializing && (
              <div className="absolute inset-0 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Inicializando mapa...</p>
                </div>
              </div>
            )}
            {initializationError && (
              <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-800 mb-2">{initializationError}</h3>
                  <p className="text-red-700">Por favor, verifica los waypoints proporcionados.</p>
                </div>
              </div>
            )}
            
            <div 
              ref={mapContainerRef} 
              className={`w-full h-96 rounded-lg overflow-hidden ${
                isInitializing || initializationError ? 'opacity-50' : 'opacity-100'
              } transition-opacity duration-300`}
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>
      </div>

      {/* Orden de paradas real */}
      {realStopOrder.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            📍 Orden de Paradas (Según Ruta Optimizada) - {realStopOrder.length} paradas
          </h4>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Total de paradas detectadas:</strong> {realStopOrder.length} 
                {waypoints.length !== realStopOrder.length && (
                  <span className="text-orange-600 ml-2">
                    (Esperado: {waypoints.length}, Detectado: {realStopOrder.length})
                  </span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {realStopOrder.map((stop, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {stop.stopNumber}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {stop.waypoint_index !== null ? `Waypoint ${stop.waypoint_index + 1}` : 'Parada'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Coord: {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Congestión: {stop.congestion_level}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leyenda del mapa */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-3">Leyenda del Mapa</h5>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">🏁</div>
            <span>Inicio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <span>Waypoint 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
            <span>Waypoint 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">🎯</div>
            <span>Destino</span>
          </div>
        </div>
        
        {/* Leyenda de colores de rutas */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h6 className="text-xs font-semibold text-gray-600 mb-2">Colores de Rutas</h6>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-green-600 rounded"></div>
              <span>Ruta Principal (Verde)</span>
            </div>
            {availableRoutes.filter(r => r.route_id !== 'primary').map((route, index) => {
              const routeColor = getRouteColor(route.route_id, false);
              return (
                <div key={route.route_id} className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded" style={{ backgroundColor: routeColor }}></div>
                  <span>Ruta Alternativa {index + 1}</span>
                </div>
              );
            })}
          </div>
          
          {/* Mostrar todos los colores disponibles para referencia */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h6 className="text-xs font-semibold text-gray-500 mb-2">Paleta de Colores Disponibles</h6>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { color: '#3b82f6', name: 'Azul' },
                { color: '#8b5cf6', name: 'Púrpura' },
                { color: '#f59e0b', name: 'Naranja' },
                { color: '#ef4444', name: 'Rojo' },
                { color: '#06b6d4', name: 'Cian' },
                { color: '#84cc16', name: 'Verde Lima' },
                { color: '#f97316', name: 'Naranja Oscuro' },
                { color: '#a855f7', name: 'Violeta' },
                { color: '#ec4899', name: 'Rosa' },
                { color: '#14b8a6', name: 'Verde Azulado' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
