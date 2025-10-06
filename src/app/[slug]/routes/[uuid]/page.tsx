'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Package, Route, Navigation, CheckCircle, AlertCircle } from 'lucide-react';
import { useRoute } from '@/hooks/useRoute';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { Page } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import dynamic from 'next/dynamic';

// Importar Leaflet dinámicamente
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

// Fix para iconos de Leaflet en Next.js
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Componente para manejar la lógica del mapa
function MapContent({ route }: { route: any }) {
  const map = require('react-leaflet').useMap();
  const [isMapReady, setIsMapReady] = useState(false);
  const [addedLayers, setAddedLayers] = useState<any[]>([]);

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
  const getStopColor = (type: string) => {
    switch (type) {
      case 'origin':
        return '#10B981'; // Verde
      case 'destination':
        return '#EF4444'; // Rojo
      case 'waypoint':
        return '#3B82F6'; // Azul
      default:
        return '#6B7280'; // Gris
    }
  };

  // Obtener ícono por tipo de parada
  const getStopIcon = (type: string) => {
    switch (type) {
      case 'origin':
        return '🚀';
      case 'destination':
        return '🏁';
      case 'waypoint':
        return '📍';
      default:
        return '📍';
    }
  };

  // Mostrar ruta
  useEffect(() => {
    if (!isMapReady || !route || !map) {
      return;
    }

    clearMap();

    const newLayers: any[] = [];

    // Crear polylines para la ruta usando route_points
    if (route.route_points && route.route_points.length > 0) {
      const routeCoordinates = route.route_points.map((point: any) => 
        [point.lat, point.lon] as [number, number]
      );
      
      const routePolyline = require('leaflet').polyline(routeCoordinates, {
        color: '#3B82F6',
        weight: 6,
        opacity: 0.9
      }).addTo(map);

      newLayers.push(routePolyline);
    } else if (route.waypoints.length > 1) {
      // Fallback: conectar waypoints si no hay route_points
      const coordinates = [
        [route.origin_lat, route.origin_lon],
        ...route.waypoints
          .filter((wp: any) => wp.location && wp.location.lat && wp.location.lng)
          .map((wp: any) => [wp.location.lat, wp.location.lng] as [number, number]),
        [route.destination_lat, route.destination_lon]
      ];
      
      const polyline = require('leaflet').polyline(coordinates, {
        color: '#3B82F6',
        weight: 6,
        opacity: 0.9
      }).addTo(map);

      newLayers.push(polyline);
    }

    // Marcador de origen
    const originMarker = require('leaflet').marker([route.origin_lat, route.origin_lon], {
      icon: require('leaflet').divIcon({
        className: 'custom-marker',
        html: `
          <div class="bg-white border-2 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold shadow-lg" style="border-color: ${getStopColor('origin')};">
            <span class="text-xl">${getStopIcon('origin')}</span>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      })
    }).addTo(map);

    originMarker.bindPopup(`
      <div class="text-center min-w-[200px]">
        <div class="font-semibold text-sm mb-2">Origen</div>
        <div class="text-xs text-gray-600 mb-2">${route.origin_name}</div>
        <div class="text-xs text-gray-500">${Number(route.origin_lat || 0).toFixed(6)}, ${Number(route.origin_lon || 0).toFixed(6)}</div>
      </div>
    `);
    newLayers.push(originMarker);

    // Marcador de destino
    const destinationMarker = require('leaflet').marker([route.destination_lat, route.destination_lon], {
      icon: require('leaflet').divIcon({
        className: 'custom-marker',
        html: `
          <div class="bg-white border-2 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold shadow-lg" style="border-color: ${getStopColor('destination')};">
            <span class="text-xl">${getStopIcon('destination')}</span>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      })
    }).addTo(map);

    destinationMarker.bindPopup(`
      <div class="text-center min-w-[200px]">
        <div class="font-semibold text-sm mb-2">Destino</div>
        <div class="text-xs text-gray-600 mb-2">${route.destination_name}</div>
        <div class="text-xs text-gray-500">${Number(route.destination_lat || 0).toFixed(6)}, ${Number(route.destination_lon || 0).toFixed(6)}</div>
      </div>
    `);
    newLayers.push(destinationMarker);

    // Marcadores de waypoints
    route.waypoints.forEach((waypoint: any, index: number) => {
      if (waypoint.location && waypoint.location.lat && waypoint.location.lng) {
        const waypointMarker = require('leaflet').marker([waypoint.location.lat, waypoint.location.lng], {
          icon: require('leaflet').divIcon({
            className: 'custom-marker',
            html: `
              <div class="bg-white border-2 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shadow-lg" style="border-color: ${getStopColor('waypoint')};">
                <span class="text-lg">${index + 1}</span>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })
        }).addTo(map);

        waypointMarker.bindPopup(`
          <div class="text-center min-w-[200px]">
            <div class="font-semibold text-sm mb-2">Waypoint ${index + 1}</div>
            <div class="text-xs text-gray-600 mb-2">${waypoint.location.address || 'Sin dirección'}</div>
            <div class="text-xs text-gray-500">${Number(waypoint.location.lat || 0).toFixed(6)}, ${Number(waypoint.location.lng || 0).toFixed(6)}</div>
          </div>
        `);
        newLayers.push(waypointMarker);
      }
    });

    setAddedLayers(newLayers);

    // Ajustar vista para mostrar toda la ruta
    if (route.waypoints.length > 0 || route.route_points.length > 0) {
      const group = require('leaflet').featureGroup(newLayers);
      const bounds = group.getBounds();
      map.fitBounds(bounds.pad(0.1));
    }
  }, [isMapReady, route, map]);

  return null; // Este componente no renderiza nada, solo maneja la lógica
}

export default function RouteViewPage() {
  const { colors } = useDynamicTheme();
  const params = useParams();
  const router = useRouter();
  const { route, getRoute, isLoading, error } = useRoute();
  const [routeUuid, setRouteUuid] = useState<string>('');

  useEffect(() => {
    if (params.uuid && typeof params.uuid === 'string') {
      setRouteUuid(params.uuid);
      getRoute(params.uuid);
    }
  }, [params.uuid, getRoute]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PAUSED': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'Planificada';
      case 'ASSIGNED': return 'Asignada';
      case 'IN_PROGRESS': return 'En Progreso';
      case 'COMPLETED': return 'Completada';
      case 'CANCELLED': return 'Cancelada';
      case 'PAUSED': return 'Pausada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Baja';
      case 'MEDIUM': return 'Media';
      case 'HIGH': return 'Alta';
      case 'URGENT': return 'Urgente';
      default: return priority;
    }
  };

  if (isLoading) {
    return (
      <Page
        title="Cargando ruta..."
        subtitle="Obteniendo información de la ruta"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.buttonPrimary1 }}></div>
            <p className="theme-text-secondary">Cargando ruta...</p>
          </div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page
        title="Error al cargar la ruta"
        subtitle="No se pudo obtener la información de la ruta"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.warning }} />
            <h3 className="text-lg font-semibold theme-text-primary mb-2">Error al cargar la ruta</h3>
            <p className="theme-text-secondary mb-4">{error}</p>
            <Button
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  if (!route) {
    return (
      <Page
        title="Ruta no encontrada"
        subtitle="La ruta solicitada no existe"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.warning }} />
            <h3 className="text-lg font-semibold theme-text-primary mb-2">Ruta no encontrada</h3>
            <p className="theme-text-secondary mb-4">La ruta solicitada no existe o no tienes permisos para verla.</p>
            <Button
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={route.route_name}
      subtitle={route.description}
    >
      {/* Botón de volver */}
      <div className="mb-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Rutas
        </Button>
      </div>

      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5" style={{ color: colors.success }} />
            <span className="font-medium theme-text-primary">Estado</span>
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(route.status)}`}>
            {getStatusText(route.status)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" style={{ color: colors.warning }} />
            <span className="font-medium theme-text-primary">Prioridad</span>
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(route.priority)}`}>
            {getPriorityText(route.priority)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5" style={{ color: colors.info }} />
            <span className="font-medium theme-text-primary">Retraso por Tráfico</span>
          </div>
          <span className="text-sm theme-text-primary">{formatDuration(route.traffic_delay)}</span>
        </div>
      </div>

      {/* Mapa */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold theme-text-primary mb-4">Mapa de la Ruta</h4>
        <div className="h-96 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
          <MapContainer
            center={[route.origin_lat, route.origin_lon]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapContent route={route} />
          </MapContainer>
        </div>
      </div>

      {/* Pedidos */}
      {route.orders && route.orders.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold theme-text-primary mb-4">Pedidos ({route.orders.length})</h4>
          <div className="space-y-3">
            {route.orders
              .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
              .map((order: any) => (
              <div
                key={order.order_uuid}
                className="bg-white p-4 rounded-lg border"
                style={{ backgroundColor: colors.background2, borderColor: colors.border }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4" style={{ color: colors.info }} />
                      <span className="font-medium theme-text-primary">#{order.order_number}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm theme-text-secondary mb-2">{order.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium theme-text-primary mb-1">Recogida:</p>
                        <p className="theme-text-secondary">{order.pickup_address}</p>
                      </div>
                      <div>
                        <p className="font-medium theme-text-primary mb-1">Entrega:</p>
                        <p className="theme-text-secondary">{order.delivery_address}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold theme-success">${Number(order.total_amount || 0).toFixed(2)}</p>
                    <p className="text-xs theme-text-muted">Orden #{order.sequence_order}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
          <h5 className="font-medium theme-text-primary mb-3">Información de la Ruta</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="theme-text-secondary">Creada:</span>
              <span className="theme-text-primary">{formatDate(route.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-secondary">Actualizada:</span>
              <span className="theme-text-primary">{formatDate(route.updated_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-secondary">Waypoints:</span>
              <span className="theme-text-primary">{route.waypoints.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-secondary">Puntos de ruta:</span>
              <span className="theme-text-primary">{route.route_points.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
          <h5 className="font-medium theme-text-primary mb-3">Condiciones de Tráfico</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="theme-text-secondary">Condiciones:</span>
              <span className="theme-text-primary">{route.traffic_condition.road_conditions}</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-secondary">Congestión:</span>
              <span className="theme-text-primary">{route.traffic_condition.general_congestion}</span>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
