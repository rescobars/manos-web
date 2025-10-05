'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Route } from 'lucide-react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap } from 'react-leaflet';

// Importar Leaflet dinámicamente
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });
// useMap ya está importado arriba

// Fix para iconos de Leaflet en Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface Point {
  lat: number;
  lng: number;
  name?: string;
}

interface RouteType {
  points: Point[];
  total_distance: number;
  total_duration: number;
  waypoints: Point[];
  visit_order: number[];
}

interface TrafficOptimizedRouteData {
  routes: RouteType[];
  summary: {
    total_distance: number;
    total_duration: number;
    total_orders: number;
  };
}

interface TrafficOptimizedRouteMapProps {
  trafficOptimizedRoute: TrafficOptimizedRouteData | null;
  showAlternatives?: boolean;
  className?: string;
}

// Componente para manejar la lógica del mapa
function MapContent({
  trafficOptimizedRoute,
  showAlternatives = true
}: {
  trafficOptimizedRoute: TrafficOptimizedRouteData | null;
  showAlternatives: boolean;
}) {
  const map = useMap();
  const [isMapReady, setIsMapReady] = useState(false);
  const [addedLayers, setAddedLayers] = useState<L.Layer[]>([]);

  // Marcar mapa como listo
  useEffect(() => {
    if (map) {
      setIsMapReady(true);
    }
  }, [map]);

  // Limpiar capas existentes
  const clearMap = () => {
    addedLayers.forEach(layer => {
      if (map && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    setAddedLayers([]);
  };

  // Obtener color de ruta por índice
  const getRouteColorByIndex = (index: number) => {
    const colors = [
      '#3B82F6', // Azul principal
      '#10B981', // Verde
      '#F59E0B', // Amarillo
      '#EF4444', // Rojo
      '#8B5CF6', // Púrpura
      '#F97316', // Naranja
      '#06B6D4', // Cian
      '#84CC16', // Lima
      '#EC4899', // Rosa
      '#6366F1'  // Índigo
    ];
    return colors[index % colors.length];
  };

  // Mostrar rutas en el mapa
  useEffect(() => {
    if (!isMapReady || !trafficOptimizedRoute || !map) return;

    clearMap();

    const routesToShow = showAlternatives ? trafficOptimizedRoute.routes : [trafficOptimizedRoute.routes[0]];
    const newLayers: L.Layer[] = [];

    routesToShow.forEach((route, routeIndex) => {
      const isPrimary = routeIndex === 0;
      const color = getRouteColorByIndex(routeIndex);
      
      // Crear polyline para la ruta
      if (route.points && route.points.length > 0) {
        const coordinates = route.points.map(point => [point.lat, point.lng] as [number, number]);
        const polyline = L.polyline(coordinates, {
          color: color,
          weight: isPrimary ? 6 : 4,
          opacity: isPrimary ? 0.9 : 0.35
        }).addTo(map);

        newLayers.push(polyline);
      }

      // Agregar marcadores para waypoints
      if (route.waypoints && route.visit_order) {
        route.waypoints.forEach((waypoint, waypointIndex) => {
          const orderNumber = route.visit_order[waypointIndex];
          const marker = L.marker([waypoint.lat, waypoint.lng], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `
                <div class="bg-white border-2 border-${color.replace('#', '')} rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold" style="border-color: ${color}; color: ${color};">
                  ${orderNumber}
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })
          }).addTo(map);

          marker.bindPopup(`
            <div class="text-center">
              <div class="font-semibold">Pedido #${orderNumber}</div>
              <div class="text-sm text-gray-600">${waypoint.name || 'Ubicación de entrega'}</div>
            </div>
          `);

          newLayers.push(marker);
        });
      }
    });

    setAddedLayers(newLayers);

    // Ajustar vista para mostrar todas las rutas
    if (trafficOptimizedRoute.routes.length > 0) {
      const allPoints = trafficOptimizedRoute.routes[0].points;
      if (allPoints.length > 0) {
        const group = new L.featureGroup(newLayers);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [isMapReady, trafficOptimizedRoute, showAlternatives, map]);

  return null; // Este componente no renderiza nada, solo maneja la lógica
}

export default function TrafficOptimizedRouteMap({
  trafficOptimizedRoute,
  showAlternatives = true,
  className = 'w-full h-full'
}: TrafficOptimizedRouteMapProps) {
  const [selectedRoute, setSelectedRoute] = useState(0);

  if (!trafficOptimizedRoute) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay rutas optimizadas disponibles</p>
        </div>
      </div>
    );
  }

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calcular centro del mapa
  const getMapCenter = (): [number, number] => {
    if (trafficOptimizedRoute.routes.length > 0 && trafficOptimizedRoute.routes[0].points.length > 0) {
      const points = trafficOptimizedRoute.routes[0].points;
      const avgLat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
      const avgLng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;
      return [avgLat, avgLng];
    }
    return [14.6349, -90.5069]; // Guatemala City por defecto
  };

  const mapCenter = getMapCenter();

  return (
    <div className={className}>
      {/* Información de rutas */}
      <div className="bg-white p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Rutas Optimizadas</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(trafficOptimizedRoute.summary.total_duration)}</span>
            <Navigation className="w-4 h-4 ml-2" />
            <span>{formatDistance(trafficOptimizedRoute.summary.total_distance)}</span>
          </div>
        </div>

        {/* Selector de rutas alternativas */}
        {showAlternatives && trafficOptimizedRoute.routes.length > 1 && (
          <div className="flex space-x-2">
            {trafficOptimizedRoute.routes.map((route, index) => (
              <button
                key={index}
                onClick={() => setSelectedRoute(index)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedRoute === index
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Ruta {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="flex-1">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Lógica de rutas */}
          <MapContent
            trafficOptimizedRoute={trafficOptimizedRoute}
            showAlternatives={showAlternatives}
          />
        </MapContainer>
      </div>

      {/* Estadísticas de la ruta seleccionada */}
      {trafficOptimizedRoute.routes[selectedRoute] && (
        <div className="bg-white p-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatDistance(trafficOptimizedRoute.routes[selectedRoute].total_distance)}
              </div>
              <div className="text-sm text-gray-600">Distancia</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatDuration(trafficOptimizedRoute.routes[selectedRoute].total_duration)}
              </div>
              <div className="text-sm text-gray-600">Tiempo</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {trafficOptimizedRoute.routes[selectedRoute].waypoints?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Pedidos</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
