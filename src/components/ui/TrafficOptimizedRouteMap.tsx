'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Point, 
  VisitOrderItem, 
  RouteInfo, 
  RouteSummary, 
  Route as RouteType,
  TrafficOptimizationData 
} from '@/types/traffic-optimization';

// Configurar Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface TrafficOptimizedRouteMapProps {
  trafficOptimizedRoute: TrafficOptimizationData | null;
  showAlternatives?: boolean;
}

const TrafficOptimizedRouteMap: React.FC<TrafficOptimizedRouteMapProps> = ({
  trafficOptimizedRoute,
  showAlternatives = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
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
  const getAvailableRoutes = (): RouteType[] => {
    if (!trafficOptimizedRoute) return [];
    
    const routes: RouteType[] = [trafficOptimizedRoute.primary_route];
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
    console.log('🔄 Cambiando a ruta:', { 
      routeIndex, 
      routeId: newRoute.route_id,
      visitOrderLength: newRoute.visit_order?.length,
      visitOrder: newRoute.visit_order
    });
    
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
      maxZoom: 18,
      minZoom: 8,
      maxBounds: [
        [-90.8, 14.4], // Southwest coordinates
        [-90.4, 14.8]  // Northeast coordinates
      ],
      fitBoundsOptions: {
        padding: { top: 20, bottom: 20, left: 20, right: 20 }
      }
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

  const displayRoute = (route: RouteType, routeIndex: number) => {
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
    
    // Agregar marcador del origen (sucursal)
    addOriginMarker();
  };

  const addWaypointMarkers = (route: RouteType, routeIndex: number, routeColor: string) => {
    if (!map.current || !trafficOptimizedRoute || !isMapReady) return;

    // Usar el visit_order específico de esta ruta
    const { visit_order } = route;
    
    // Usar optimized_waypoints de la ruta si está disponible, sino del route_info
    const optimized_waypoints = route.optimized_waypoints || trafficOptimizedRoute.route_info.optimized_waypoints;
    
    console.log('📍 addWaypointMarkers - Waypoints utilizados:', {
      routeId: route.route_id,
      hasRouteWaypoints: !!route.optimized_waypoints,
      hasFallbackWaypoints: !!trafficOptimizedRoute.route_info.optimized_waypoints,
      waypointsCount: optimized_waypoints?.length
    });
    
    if (!optimized_waypoints) {
      console.warn('⚠️ No hay optimized_waypoints disponibles para la ruta:', route.route_id);
      return;
    }

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
          background: ${routeColor};
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: none !important;
          filter: none !important;
          position: relative;
        ">
          ${visitNumber}
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            border: 2px solid ${routeColor};
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
      padding: { top: 20, bottom: 20, left: 20, right: 20 },
      maxZoom: 15,
      duration: 1000,
      essential: true
    });
  };

  // Función para agregar marcador del origen (sucursal)
  const addOriginMarker = () => {
    if (!map.current || !isMapReady || !trafficOptimizedRoute) return;

    const { origin } = trafficOptimizedRoute.route_info;
    
    // Crear marcador del origen con ícono de casita
    const originMarkerId = 'origin-marker';
    const originMarkerElement = document.createElement('div');
    originMarkerElement.className = 'origin-marker';
    originMarkerElement.innerHTML = `
      <div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
        </svg>
      </div>
    `;

    // Crear popup con información de la sucursal
    const popup = new mapboxgl.Popup({ 
      offset: { 
        'top': [0, 0], 
        'top-left': [0, 0], 
        'top-right': [0, 0], 
        'bottom': [0, -10], 
        'bottom-left': [0, -10], 
        'bottom-right': [0, -10], 
        'left': [10, 0], 
        'right': [-10, 0] 
      },
      closeButton: true,
      closeOnClick: false
    }).setHTML(`
      <div style="padding: 12px; min-width: 200px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="width: 16px; height: 16px; background: #2563eb; border-radius: 50%; margin-right: 8px;"></div>
          <h4 style="margin: 0; color: #1f2937; font-weight: 600;">🏢 Sucursal</h4>
        </div>
        <p style="margin: 0 0 8px 0; color: #374151; font-weight: 500;">${origin.name}</p>
        <div style="font-size: 12px; color: #6b7280;">
          <p style="margin: 2px 0;">📍 Coordenadas: ${origin.lat.toFixed(4)}, ${origin.lon.toFixed(4)}</p>
          <p style="margin: 2px 0;">🚚 Punto de partida y llegada</p>
        </div>
      </div>
    `);

    const originMarker = new mapboxgl.Marker(originMarkerElement)
      .setLngLat([origin.lon, origin.lat])
      .setPopup(popup)
      .addTo(map.current);
    
    (originMarker as any).id = originMarkerId;
    setAddedSources(prev => [...prev, originMarkerId]);

    console.log('📍 Marcador de origen (sucursal) agregado:', {
      origin: { lat: origin.lat, lon: origin.lon, name: origin.name }
    });
  };

  const getVisitOrderDisplay = () => {
    if (!trafficOptimizedRoute || !selectedRoute) return null;

    // Usar el visit_order específico de la ruta seleccionada
    const { visit_order } = selectedRoute;
    
    // Usar optimized_waypoints de la ruta si está disponible, sino del route_info
    const optimized_waypoints = selectedRoute.optimized_waypoints || trafficOptimizedRoute.route_info.optimized_waypoints;
    
    if (!optimized_waypoints) {
      console.warn('⚠️ No hay optimized_waypoints disponibles para mostrar el orden de visita');
      return null;
    }

    return (
      <div className="space-y-2 sm:space-y-3">
        {visit_order.map((visitItem, index) => {
          const waypoint = optimized_waypoints.find(wp => wp.name === visitItem.name);
          if (!waypoint) return null;

          const visitNumber = index + 1;
          const color = index === 0 ? primaryColor : alternativeColors[index % alternativeColors.length];

          return (
            <div key={index} className="flex items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-200 hover:shadow-sm">
              {/* Número de orden */}
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg shadow-lg mr-2 sm:mr-3 md:mr-4"
                   style={{ backgroundColor: color }}>
                {visitNumber}
              </div>
              
              {/* Información de la parada */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg mb-1">{waypoint.name}</div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-600">
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
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
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
    <div className="space-y-3 sm:space-y-4">
      {/* Mapa */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 p-3 sm:p-4 md:p-6 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1">Mapa de Ruta Optimizada</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Ruta {selectedRouteIndex === 0 ? 'Principal' : `Alternativa ${selectedRouteIndex}`}
              </p>
            </div>
            
            {/* Stats de la ruta seleccionada */}
            {selectedRoute && (
              <div className="flex items-center justify-center sm:justify-start lg:justify-end space-x-2 sm:space-x-3 lg:space-x-4 xl:space-x-6">
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                    {Math.round(selectedRoute.summary.total_time / 60)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Min</div>
                </div>
                <div className="w-px h-8 sm:h-10 lg:h-12 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                    {(selectedRoute.summary.total_distance / 1000).toFixed(1)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Km</div>
                </div>
                {selectedRoute.summary.traffic_delay > 0 && (
                  <>
                    <div className="w-px h-8 sm:h-10 lg:h-12 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-red-600">
                        +{Math.round(selectedRoute.summary.traffic_delay / 60)}
                      </div>
                      <div className="text-xs sm:text-sm text-red-600 font-medium">Min tráfico</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Selector de Rutas con Diseño Card */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 sm:mr-3"></span>
              Seleccionar Ruta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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
                    {/* Card tipo botón */}
                    <div 
                      className={`w-full p-2 rounded-xl border-2 transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg border-blue-500' 
                          : 'shadow-md hover:shadow-lg border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        backgroundColor: isSelected ? routeColor : 'white',
                        color: isSelected ? 'white' : 'inherit',
                      }}
                    >
                      {/* Header del card */}
                      <div className="flex items-center justify-between mb-1">
                        <div 
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                            isSelected ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                          }`}
                          style={{
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : undefined,
                            color: isSelected ? 'white' : routeColor,
                          }}
                        >
                          {isPrimary ? 'P' : index}
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
                        )}
                      </div>
                      
                      {/* Título del card */}
                      <div className="text-center mb-1">
                        <div className={`font-semibold text-xs sm:text-sm mb-0.5 ${
                          isSelected ? 'text-white' : 'text-gray-800'
                        }`}>
                          {isPrimary ? 'Principal' : `Ruta ${index}`}
                        </div>
                        <div className={`text-xs ${
                          isSelected ? 'text-white text-opacity-90' : 'text-gray-500'
                        }`}>
                          {isPrimary ? 'Recomendada' : 'Alternativa'}
                        </div>
                      </div>
                      
                      {/* Información de la ruta */}
                      <div className={`space-y-0.5 text-center ${
                        isSelected ? 'text-white' : 'text-gray-700'
                      }`}>
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs">⏱️</span>
                          <span className="text-xs sm:text-sm font-medium">
                            {Math.round(route.summary.total_time / 60)}m
                          </span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs">📏</span>
                          <span className="text-xs sm:text-sm font-medium">
                            {(route.summary.total_distance / 1000).toFixed(1)}k
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden rounded-lg map-container">
          <div 
            ref={mapContainer} 
            className="w-full h-64 sm:h-80 md:h-96" 
            style={{ position: 'relative', overflow: 'hidden' }}
          />
          {!isMapReady && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm text-gray-600">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orden de visita con diseño moderno */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 sm:mr-3"></span>
              Orden de Visita de la Ruta {selectedRouteIndex === 0 ? 'Principal' : `Alternativa ${selectedRouteIndex}`}
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full self-start sm:self-auto sm:ml-auto">
              {selectedRoute?.visit_order.length || 0} paradas
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-blue-700 mt-2">
            🎯 Mostrando el orden específico de la ruta seleccionada
          </p>
        </div>
        <div className="p-3 sm:p-4 md:p-6">
          {getVisitOrderDisplay()}
        </div>
      </div>


    </div>
  );
};

export default TrafficOptimizedRouteMap;
