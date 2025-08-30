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
  const [isMapReady, setIsMapReady] = useState(false);
  const [addedSources, setAddedSources] = useState<string[]>([]);
  const [addedLayers, setAddedLayers] = useState<string[]>([]);

  // Colores para las rutas
  const primaryColor = '#00d4aa'; // Verde moderno para ruta principal
  const alternativeColors = [
    '#ff6b6b', // Rojo
    '#4ecdc4', // Turquesa
    '#45b7d1', // Azul
    '#96ceb4', // Verde claro
    '#feca57', // Amarillo
    '#ff9ff3', // Rosa
    '#54a0ff', // Azul claro
    '#5f27cd', // Púrpura
    '#00d2d3', // Cian
    '#ff9f43', // Naranja
  ];

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
          background: ${routeColor};
          color: white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${visitNumber}
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
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          📍 Orden de Visita Optimizado - {visit_order.length} paradas
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          El orden en que se deben visitar las paradas según la optimización del backend:
        </p>
        <div className="space-y-2">
          {visit_order.map((visitItem, index) => {
            const waypoint = optimized_waypoints.find(wp => wp.name === visitItem.name);
            if (!waypoint) return null;

            const visitNumber = index + 1;
            const color = index === 0 ? primaryColor : alternativeColors[index % alternativeColors.length];

            return (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: color }}
                >
                  {visitNumber}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{waypoint.name}</div>
                  <div className="text-sm text-gray-500">
                    Coordenadas: {waypoint.lat.toFixed(4)}, {waypoint.lon.toFixed(4)}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Orden #{visitNumber}
                </div>
              </div>
            );
          })}
        </div>
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
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Mapa de Ruta Optimizada</h2>
          <p className="text-sm text-gray-600 mt-1">
            Visualización del orden de visita optimizado según el backend
          </p>
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

      {/* Información del orden de visita */}
      {getVisitOrderDisplay()}

      {/* Leyenda del mapa */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Leyenda del Mapa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Ruta Principal</h4>
            <div className="flex items-center space-x-2">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: primaryColor }}
              ></div>
              <span className="text-sm text-gray-600">Ruta optimizada (verde moderno)</span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Marcadores de Paradas</h4>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                1
              </div>
              <span className="text-sm text-gray-600">Número indica orden de visita</span>
            </div>
          </div>
        </div>
      </div>

      {/* Información de la ruta */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Información de la Ruta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(trafficOptimizedRoute.primary_route.summary.total_time / 60)}
            </div>
            <div className="text-sm text-blue-600">Minutos</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(trafficOptimizedRoute.primary_route.summary.total_distance / 1000)}
            </div>
            <div className="text-sm text-green-600">Kilómetros</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {trafficOptimizedRoute.primary_route.summary.traffic_delay}
            </div>
            <div className="text-sm text-purple-600">Segundos de retraso</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficOptimizedRouteMap;
