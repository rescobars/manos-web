'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Route, Package, Truck } from 'lucide-react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap } from 'react-leaflet';
import { RoutePoint } from '@/hooks/useMultiDeliveryOptimization';

// Importar Leaflet dinámicamente
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

// Fix para iconos de Leaflet en Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface DeliveryOrder {
  id: string;
  order_number: string;
  origin: Location;
  destination: Location;
  description: string;
  total_amount: number;
  priority: number;
  estimated_pickup_time: number;
  estimated_delivery_time: number;
}

// RoutePoint interface is imported from useMultiDeliveryOptimization hook

interface OptimizedRoute {
  total_distance: number;
  total_time: number;
  total_traffic_delay: number;
  stops: Array<{
    stop_number: number;
    stop_type: 'start' | 'pickup' | 'delivery' | 'end';
    order: DeliveryOrder | null;
    location: Location;
    distance_from_previous: number;
    cumulative_distance: number;
    estimated_time: number;
    cumulative_time: number;
    traffic_delay: number;
  }>;
  route_points: RoutePoint[];
  orders_delivered: number;
  optimization_metrics: {
    algorithm: string;
    locations_optimized: number;
    traffic_enabled: boolean;
    orders_processed: number;
  };
  route_efficiency: number;
}

interface MultiDeliveryRouteMapProps {
  optimizedRoute: OptimizedRoute | null;
  className?: string;
  style?: React.CSSProperties;
}

// Componente para manejar la lógica del mapa
function MapContent({
  optimizedRoute
}: {
  optimizedRoute: OptimizedRoute | null;
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

  // Obtener color por tipo de parada
  const getStopColor = (stopType: string) => {
    switch (stopType) {
      case 'start':
        return '#10B981'; // Verde
      case 'pickup':
        return '#3B82F6'; // Azul
      case 'delivery':
        return '#F59E0B'; // Amarillo
      case 'end':
        return '#EF4444'; // Rojo
      default:
        return '#6B7280'; // Gris
    }
  };

  // Obtener ícono por tipo de parada
  const getStopIcon = (stopType: string) => {
    switch (stopType) {
      case 'start':
        return '🚀';
      case 'pickup':
        return '🛒';
      case 'delivery':
        return '🏁';
      case 'end':
        return '🏁';
      default:
        return '📍';
    }
  };

  // Mostrar ruta optimizada
  useEffect(() => {
    if (!isMapReady || !optimizedRoute || !map) {
      return;
    }

    clearMap();

    const newLayers: L.Layer[] = [];

    // Crear polylines para la ruta completa usando route_points
    if (optimizedRoute.route_points && optimizedRoute.route_points.length > 0) {
      const routeCoordinates = optimizedRoute.route_points.map(point => 
        [point.lat, point.lng] as [number, number]
      );
      
      const routePolyline = L.polyline(routeCoordinates, {
        color: '#3B82F6',
        weight: 6,
        opacity: 0.9
      }).addTo(map);

      newLayers.push(routePolyline);
    } else if (optimizedRoute.stops.length > 1) {
      // Fallback: conectar solo las paradas si no hay route_points
      const coordinates = optimizedRoute.stops.map(stop => 
        [stop.location.lat, stop.location.lng] as [number, number]
      );
      
      const polyline = L.polyline(coordinates, {
        color: '#3B82F6',
        weight: 6,
        opacity: 0.9
      }).addTo(map);

      newLayers.push(polyline);
      console.log('✅ Stops polyline added');
    }

    // Marcador de ruta removido - solo se muestran las paradas reales

    // Crear marcadores para cada parada
    optimizedRoute.stops.forEach((stop, index) => {
      const color = getStopColor(stop.stop_type);
      const icon = getStopIcon(stop.stop_type);
      
      const marker = L.marker([stop.location.lat, stop.location.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="bg-white border-2 rounded-full w-14 h-14 flex items-center justify-center text-lg font-bold shadow-lg" style="border-color: ${color};">
              <span class="text-2xl">${icon}</span>
            </div>
          `,
          iconSize: [56, 56],
          iconAnchor: [28, 28]
        })
      }).addTo(map);

      // Crear popup con información de la parada
      let popupContent = `
        <div class="text-center min-w-[250px]">
          <div class="font-semibold text-sm mb-2">Parada #${stop.stop_number}</div>
          <div class="text-xs text-gray-600 mb-2">${stop.location.address || 'Dirección no disponible'}</div>
      `;

      if (stop.order) {
        popupContent += `
          <div class="border-t pt-2 mt-2">
            <div class="font-medium text-xs">Pedido: ${stop.order.order_number || 'N/A'}</div>
            <div class="text-xs text-gray-600">${stop.order.description || 'Sin descripción'}</div>
            <div class="text-xs text-green-600 font-medium">$${stop.order.total_amount || 0}</div>
          </div>
        `;
      }

      popupContent += `
          <div class="border-t pt-2 mt-2 text-xs text-gray-500">
            <div>Distancia: ${(stop.distance_from_previous || 0).toFixed(1)} km</div>
            <div>Tiempo: ${(stop.estimated_time || 0).toFixed(1)} min</div>
            <div>Total: ${(stop.cumulative_time || 0).toFixed(1)} min</div>
            <div>Retraso: ${stop.traffic_delay || 0}s</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      newLayers.push(marker);
    });

    setAddedLayers(newLayers);

    // Ajustar vista para mostrar toda la ruta
    if (optimizedRoute.stops.length > 0) {
      const group = L.featureGroup(newLayers);
      const bounds = group.getBounds();
      map.fitBounds(bounds.pad(0.1));
    }
  }, [isMapReady, optimizedRoute, map]);

  return null; // Este componente no renderiza nada, solo maneja la lógica
}

export function MultiDeliveryRouteMap({
  optimizedRoute,
  className = 'w-full h-full',
  style = { height: '400px' }
}: MultiDeliveryRouteMapProps) {
  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 60);
    const minutes = Math.floor(duration % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!optimizedRoute) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`} style={style}>
        <div className="text-center">
          <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay ruta optimizada disponible</p>
        </div>
      </div>
    );
  }

  // Calcular centro del mapa
  const getMapCenter = (): [number, number] => {
    if (optimizedRoute.stops.length > 0) {
      const avgLat = optimizedRoute.stops.reduce((sum, stop) => sum + stop.location.lat, 0) / optimizedRoute.stops.length;
      const avgLng = optimizedRoute.stops.reduce((sum, stop) => sum + stop.location.lng, 0) / optimizedRoute.stops.length;
      return [avgLat, avgLng];
    }
    return [14.6349, -90.5069]; // Guatemala City por defecto
  };

  const mapCenter = getMapCenter();

  return (
    <div className={className} style={style}>
      {/* Información de la ruta */}
      <div className="bg-white p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Ruta Optimizada Multi-Delivery</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{formatDuration(optimizedRoute.total_time)}</span>
            </div>
            <div className="flex items-center">
              <Navigation className="w-4 h-4 mr-1" />
              <span>{formatDistance(optimizedRoute.total_distance)}</span>
            </div>
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-1" />
              <span>{optimizedRoute.orders_delivered} pedidos</span>
            </div>
          </div>
        </div>

        {/* Métricas de la ruta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Eficiencia</span>
              <span className="text-lg font-bold text-blue-600">{optimizedRoute.route_efficiency.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">Puntos de Ruta</span>
              <span className="text-lg font-bold text-green-600">{optimizedRoute.route_points?.length || 0}</span>
            </div>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-800">Retraso Tráfico</span>
              <span className="text-lg font-bold text-orange-600">{Math.round(optimizedRoute.total_traffic_delay / 60)}min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1" style={{ minHeight: '400px' }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%', minHeight: '400px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Lógica de la ruta */}
          <MapContent optimizedRoute={optimizedRoute} />
        </MapContainer>
      </div>

      {/* Lista de paradas */}
      <div className="bg-white p-4 border-t overflow-y-auto">
        <h4 className="font-medium mb-3">Paradas de la Ruta ({optimizedRoute.stops.length})</h4>
        <div className="space-y-2">
          {optimizedRoute.stops.map((stop) => (
            <div
              key={stop.stop_number}
              className="flex items-center p-2 rounded-lg border"
              style={{ 
                borderColor: getStopColor(stop.stop_type) + '20',
                backgroundColor: getStopColor(stop.stop_type) + '05'
              }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                style={{ backgroundColor: getStopColor(stop.stop_type) }}
              >
                {stop.stop_number}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {stop.stop_type === 'start' && 'Inicio'}
                    {stop.stop_type === 'pickup' && 'Recogida'}
                    {stop.stop_type === 'delivery' && 'Entrega'}
                    {stop.stop_type === 'end' && 'Fin'}
                    {stop.order && ` - ${stop.order.order_number}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDuration(stop.cumulative_time)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">{stop.location.address}</p>
                {stop.order && (
                  <p className="text-xs text-gray-500">${stop.order.total_amount}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Función auxiliar para obtener color (necesaria para el JSX)
function getStopColor(stopType: string): string {
  switch (stopType) {
    case 'start':
      return '#10B981';
    case 'pickup':
      return '#3B82F6';
    case 'delivery':
      return '#F59E0B';
    case 'end':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}
