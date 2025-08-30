'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Configurar Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Point {
  lat: number;
  lon: number;
  name: string;
  waypoint_type?: string;
  waypoint_index?: number;
}

interface VisitOrderItem {
  name: string;
  waypoint_index: number;
}

interface RouteInfo {
  origin: Point;
  destination: Point;
  waypoints: Point[];
  total_waypoints: number;
  optimized_waypoints: Point[];
  visit_order: VisitOrderItem[];
}

interface RouteSummary {
  total_time: number;
  total_distance: number;
  traffic_delay: number;
  base_time: number;
  traffic_time: number;
  fuel_consumption: number | null;
}

interface PrimaryRoute {
  summary: RouteSummary;
  points: Point[];
  route_id: string;
}

interface TrafficOptimizedRoute {
  route_info: RouteInfo;
  primary_route: PrimaryRoute;
  alternative_routes: any[] | null;
  request_info: any;
  traffic_conditions: any;
}

interface TrafficOptimizedRouteMapProps {
  trafficOptimizedRoute: TrafficOptimizedRoute | null;
}

const TrafficOptimizedRouteMap: React.FC<TrafficOptimizedRouteMapProps> = ({
  trafficOptimizedRoute,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<PrimaryRoute | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [isMapReady, setIsMapReady] = useState(false);
  const [addedSources, setAddedSources] = useState<string[]>([]);
  const [addedLayers, setAddedLayers] = useState<string[]>([]);

  // Colores modernos y elegantes para las rutas
  const primaryColor = '#10b981'; // Verde esmeralda moderno
  const alternativeColors = [
    '#3b82f6', // Azul moderno
    '#8b5cf6', // Violeta moderno
    '#f59e0b', // Ámbar moderno
    '#ef4444', // Rojo moderno
    '#06b6d4', // Cian moderno
    '#84cc16', // Verde lima moderno
    '#f97316', // Naranja moderno
    '#ec4899', // Rosa moderno
    '#6366f1', // Índigo moderno
    '#14b8a6', // Teal moderno
  ];

  // Obtener todas las rutas disponibles
  const getAvailableRoutes = () => {
    if (!trafficOptimizedRoute) return [];
    
    const routes = [trafficOptimizedRoute.primary_route];
    if (trafficOptimizedRoute.alternative_routes) {
      routes.push(...trafficOptimizedRoute.alternative_routes);
    }
    return routes;
  };

  // Función para cambiar de ruta
  const changeRoute = (routeIndex: number) => {
    if (!map.current || !isMapReady) return;
    
    const routes = getAvailableRoutes();
    if (routeIndex < 0 || routeIndex >= routes.length) return;
    
    const newRoute = routes[routeIndex];
    console.log('🔄 Cambiando a ruta:', { routeIndex, routeId: newRoute.route_id });
    
    // Limpiar mapa actual
    clearMap();
    
    // Actualizar estado
    setSelectedRouteIndex(routeIndex);
    setSelectedRoute(newRoute);
    
    // Dibujar nueva ruta
    displayRoute(newRoute, routeIndex);
    
    // Ajustar mapa a la nueva ruta
    fitMapToRoute(newRoute.points);
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-90.606249, 14.631631], // Guatemala City
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    // Esperar a que el estilo del mapa esté completamente cargado
    map.current.on('style.load', () => {
      console.log('🎉 Evento style.load disparado - Mapa cargado completamente');
      setIsMapReady(true);
    });
    
    // También escuchar el evento load general
    map.current.on('load', () => {
      console.log('🚀 Evento load disparado - Mapa inicializado');
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // Limpiar estados
      setAddedSources([]);
      setAddedLayers([]);
      setIsMapReady(false);
    };
  }, []);

  useEffect(() => {
    console.log('🔄 useEffect ejecutado:', { 
      mapExists: !!map.current, 
      hasData: !!trafficOptimizedRoute, 
      isMapReady 
    });
    
    if (!map.current || !trafficOptimizedRoute || !isMapReady) {
      console.log('❌ useEffect: Condiciones no cumplidas');
      return;
    }

    console.log('✅ useEffect: Todas las condiciones cumplidas, procediendo...');

    // Limpiar mapas existentes
    clearMap();

    // Seleccionar la ruta principal por defecto
    setSelectedRouteIndex(0);
    setSelectedRoute(trafficOptimizedRoute.primary_route);

    // Dibujar la ruta principal
    displayRoute(trafficOptimizedRoute.primary_route, 0);

    // Ajustar el mapa para mostrar toda la ruta
    fitMapToRoute(trafficOptimizedRoute.primary_route.points);
  }, [trafficOptimizedRoute, isMapReady]);

  const clearMap = () => {
    console.log('🧹 clearMap llamado:', { mapExists: !!map.current, isMapReady });
    if (!map.current || !isMapReady) return;

    console.log('🗑️ Removiendo fuentes y capas personalizadas:', { addedSources, addedLayers });
    
    // Remover capas personalizadas primero
    addedLayers.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
        console.log('🗑️ Capa personalizada removida:', layerId);
      }
    });
    
    // Luego remover fuentes personalizadas
    addedSources.forEach(sourceId => {
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
        console.log('🗑️ Fuente personalizada removida:', sourceId);
      }
    });
    
    // Limpiar los estados
    setAddedSources([]);
    setAddedLayers([]);
  };

  const displayRoute = (route: PrimaryRoute, routeIndex: number) => {
    console.log('🚀 displayRoute llamado:', { route, routeIndex, isMapReady, mapExists: !!map.current });
    
    if (!map.current || !isMapReady) {
      console.log('❌ displayRoute: Mapa no está listo');
      return;
    }

    const routeId = `route-${routeIndex}`;
    const isPrimary = routeIndex === 0;
    const color = isPrimary ? primaryColor : alternativeColors[routeIndex % alternativeColors.length];
    
    console.log('🎨 Color de ruta:', { routeId, isPrimary, color });
    console.log('📍 Puntos de ruta:', route.points.length, route.points.slice(0, 3));

    // Agregar fuente para los puntos de la ruta
    const coordinates = route.points.map(point => [point.lon, point.lat]);
    console.log('🗺️ Coordenadas de la ruta:', coordinates.slice(0, 5));
    
    try {
      map.current.addSource(routeId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      });
      console.log('✅ Fuente agregada:', routeId);
      setAddedSources(prev => [...prev, routeId]);
    } catch (error) {
      console.error('❌ Error al agregar fuente:', error);
      return;
    }

    // Agregar capa para la línea de la ruta
    try {
      map.current.addLayer({
        id: `${routeId}-line`,
        type: 'line',
        source: routeId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': isPrimary ? 6 : 4,
          'line-opacity': 0.8,
        },
      });
      console.log('✅ Capa agregada:', `${routeId}-line`);
      setAddedLayers(prev => [...prev, `${routeId}-line`]);
    } catch (error) {
      console.error('❌ Error al agregar capa:', error);
      return;
    }

    // Agregar marcadores para los waypoints según el visit_order
    addWaypointMarkers(route, routeIndex, color);
  };

  const addWaypointMarkers = (route: PrimaryRoute, routeIndex: number, routeColor: string) => {
    if (!map.current || !trafficOptimizedRoute || !isMapReady) return;

    const { visit_order, optimized_waypoints } = trafficOptimizedRoute!.route_info;

    // Crear marcadores para cada waypoint en el orden de visita
    visit_order.forEach((visitItem, index) => {
      const waypoint = optimized_waypoints.find(wp => wp.name === visitItem.name);
      if (!waypoint) return;

      const markerId = `marker-${routeIndex}-${index}`;
      const visitNumber = index + 1; // Número de visita (1, 2, 3...)

      // Crear el elemento del marcador
      const markerElement = document.createElement('div');
      markerElement.className = 'waypoint-marker';
      markerElement.innerHTML = `
        <div style="
          background: white;
          color: ${routeColor};
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          border: 3px solid ${routeColor};
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          position: relative;
        ">
          ${visitNumber}
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 8px;
            height: 8px;
            background: ${routeColor};
            border-radius: 50%;
            border: 2px solid white;
          "></div>
        </div>
      `;

      // Crear el popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #333;">${waypoint.name}</h4>
          <p style="margin: 0; color: #666;">Orden de visita: <strong>#${visitNumber}</strong></p>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">
            Coordenadas: ${waypoint.lat.toFixed(4)}, ${waypoint.lon.toFixed(4)}
          </p>
        </div>
      `);

      // Crear y agregar el marcador
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([waypoint.lon, waypoint.lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Guardar referencia del marcador para poder removerlo después
      (marker as any).id = markerId;
    });
  };

  const fitMapToRoute = (points: Point[]) => {
    if (!map.current || points.length === 0 || !isMapReady) return;

    const bounds = new mapboxgl.LngLatBounds();
    points.forEach(point => {
      bounds.extend([point.lon, point.lat]);
    });

    map.current!.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
    });
  };

  const getVisitOrderDisplay = () => {
    if (!trafficOptimizedRoute) return null;

    const { visit_order, optimized_waypoints } = trafficOptimizedRoute!.route_info;

    return (
      <div className="space-y-3">
        {visit_order.map((visitItem, index) => {
          const waypoint = optimized_waypoints.find(wp => wp.name === visitItem.name);
          if (!waypoint) return null;

          const visitNumber = index + 1;
          const color = index === 0 ? primaryColor : alternativeColors[index % alternativeColors.length];

          return (
            <div key={index} className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-200 hover:shadow-sm">
              {/* Número de orden */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg mr-4"
                   style={{ backgroundColor: color }}>
                {visitNumber}
              </div>
              
              {/* Información de la parada */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-lg mb-1">{waypoint.name}</div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                    {waypoint.lat.toFixed(4)}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                    {waypoint.lon.toFixed(4)}
                  </span>
                </div>
              </div>
              
              {/* Indicador de estado */}
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!trafficOptimizedRoute) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No hay datos de ruta para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mapa */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 p-6 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Mapa de Ruta Optimizada</h2>
              <p className="text-gray-600">
                Ruta {selectedRouteIndex === 0 ? 'Principal' : `Alternativa ${selectedRouteIndex}`}
              </p>
            </div>
            
            {/* Stats de la ruta seleccionada */}
            {selectedRoute && (
              <div className="flex items-center space-x-4 lg:space-x-6">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {Math.round(selectedRoute.summary.total_time / 60)}
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600 font-medium">Minutos</div>
                </div>
                <div className="w-px h-10 lg:h-12 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {(selectedRoute.summary.total_distance / 1000).toFixed(1)}
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600 font-medium">Kilómetros</div>
                </div>
                {selectedRoute.summary.traffic_delay > 0 && (
                  <>
                    <div className="w-px h-10 lg:h-12 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-xl lg:text-2xl font-bold text-red-600">
                        +{Math.round(selectedRoute.summary.traffic_delay / 60)}
                      </div>
                      <div className="text-xs lg:text-sm text-red-600 font-medium">Min tráfico</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Selector de Rutas Compacto */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Seleccionar Ruta
            </h3>
            <div className="flex items-center space-x-3">
              {getAvailableRoutes().map((route, index) => {
                const isSelected = index === selectedRouteIndex;
                const isPrimary = index === 0;
                const routeColor = isPrimary ? primaryColor : alternativeColors[index % alternativeColors.length];
                

                
                return (
                  <button
                    key={index}
                    onClick={() => changeRoute(index)}
                    className={`group relative transition-all duration-200 ${
                      isSelected ? 'transform scale-105' : 'hover:scale-102'
                    }`}
                  >
                    {/* Botón compacto */}
                    <div 
                      className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 ring-offset-2 shadow-lg' 
                          : 'shadow-md hover:shadow-lg'
                      }`}
                      style={{
                        backgroundColor: routeColor,
                        color: 'white',
                      }}
                    >
                      <span className="text-sm font-bold mb-1">
                        {isPrimary ? 'P' : index}
                      </span>
                      <span className="text-xs opacity-90">
                        {isPrimary ? 'Principal' : 'Alt'}
                      </span>
                    </div>
                    
                    {/* Información compacta debajo */}
                    <div className="mt-2 text-center">
                      <div className="text-xs font-semibold text-gray-800">
                        {Math.round(route.summary.total_time / 60)} min
                      </div>
                      <div className="text-xs text-gray-500">
                        {(route.summary.total_distance / 1000).toFixed(1)} km
                      </div>
                    </div>
                    
                    {/* Indicador de selección */}
                    {isSelected && (
                      <div className="mt-1 text-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="relative w-full h-96">
          <div ref={mapContainer} className="w-full h-96" />
          {!isMapReady && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      

      {/* Orden de visita con diseño moderno */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Orden de Visita Optimizado
            <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {trafficOptimizedRoute?.route_info.visit_order.length || 0} paradas
            </span>
          </h3>
        </div>
        <div className="p-6">
          {getVisitOrderDisplay()}
        </div>
      </div>


    </div>
  );
};

export default TrafficOptimizedRouteMap;
