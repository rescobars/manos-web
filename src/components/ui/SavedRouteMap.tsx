'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { SavedRoute, RoutePoint, RouteOrder } from '@/types';
import { 
  MapPin, 
  Clock, 
  Route, 
  Package,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';

// Configurar Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface SavedRouteMapProps {
  route: SavedRoute;
  onClose?: () => void;
}

const SavedRouteMap: React.FC<SavedRouteMapProps> = ({
  route,
  onClose
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [addedSources, setAddedSources] = useState<string[]>([]);
  const [addedLayers, setAddedLayers] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<RouteOrder | null>(null);

  // Colores para diferentes estados de pedidos
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b'; // Amber
      case 'ASSIGNED':
        return '#8b5cf6'; // Purple
      case 'IN_ROUTE':
        return '#3b82f6'; // Blue
      case 'COMPLETED':
        return '#10b981'; // Green
      case 'CANCELLED':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-3 h-3" />;
      case 'ASSIGNED':
        return <Package className="w-3 h-3" />;
      case 'IN_ROUTE':
        return <Truck className="w-3 h-3" />;
      case 'COMPLETED':
        return <CheckCircle className="w-3 h-3" />;
      case 'CANCELLED':
        return <XCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'ASSIGNED':
        return 'Asignado';
      case 'IN_ROUTE':
        return 'En Camino';
      case 'COMPLETED':
        return 'Entregado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  // Función para limpiar el mapa
  const clearMap = () => {
    if (!map.current || !isMapReady) return;

    // Remover capas personalizadas primero
    addedLayers.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
    });
    
    // Luego remover fuentes personalizadas
    addedSources.forEach(sourceId => {
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });
    
    // Limpiar los estados
    setAddedSources([]);
    setAddedLayers([]);
  };

  // Función para mostrar la ruta en el mapa
  const displayRoute = () => {
    if (!map.current || !isMapReady) return;

    const routeId = 'saved-route';
    const routeColor = '#10b981'; // Verde esmeralda

    // Agregar fuente para los puntos de la ruta
    const coordinates = route.route_points.map(point => [parseFloat(point.lon.toString()), parseFloat(point.lat.toString())]);
    
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
      setAddedSources(prev => [...prev, routeId]);
    } catch (error) {
      console.error('Error al agregar fuente de ruta:', error);
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
          'line-color': routeColor,
          'line-width': 6,
          'line-opacity': 0.8,
        },
      });
      setAddedLayers(prev => [...prev, `${routeId}-line`]);
    } catch (error) {
      console.error('Error al agregar capa de ruta:', error);
      return;
    }

    // Agregar marcadores para los pedidos en orden
    addOrderMarkers();
    
    // Agregar marcador del origen
    addOriginMarker();
  };

  // Función para agregar marcadores de pedidos
  const addOrderMarkers = () => {
    if (!map.current || !isMapReady) return;

    // Ordenar pedidos por sequence_order
    const sortedOrders = [...route.orders].sort((a, b) => a.sequence_order - b.sequence_order);

    sortedOrders.forEach((order, index) => {
      const markerId = `order-marker-${order.order_uuid}`;
      const visitNumber = index + 1;
      const statusColor = getOrderStatusColor(order.status);

      // Crear el elemento del marcador
      const markerElement = document.createElement('div');
      markerElement.className = 'order-marker';
      markerElement.innerHTML = `
        <div style="
          background: ${statusColor};
          color: white;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          ${visitNumber}
        </div>
      `;

      // Crear el popup con información del pedido
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div style="padding: 12px; min-width: 250px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 20px; height: 20px; background: ${statusColor}; border-radius: 50%; margin-right: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
              ${visitNumber}
            </div>
            <h4 style="margin: 0; color: #1f2937; font-weight: 600;">${order.order_number}</h4>
          </div>
          <div style="margin-bottom: 8px;">
            <p style="margin: 0 0 4px 0; color: #374151; font-weight: 500;">${order.delivery_address}</p>
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Orden de entrega: #${order.sequence_order}</p>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="background: ${statusColor}20; color: ${statusColor}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
              ${getOrderStatusText(order.status)}
            </span>
            <span style="color: #059669; font-weight: 600; font-size: 14px;">
              Q${parseFloat(order.total_amount.toString()).toFixed(2)}
            </span>
          </div>
          <div style="font-size: 11px; color: #6b7280;">
            <p style="margin: 2px 0;">📍 ${parseFloat(order.delivery_lat.toString()).toFixed(4)}, ${parseFloat(order.delivery_lng.toString()).toFixed(4)}</p>
          </div>
        </div>
      `);

      // Crear y agregar el marcador
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([parseFloat(order.delivery_lng.toString()), parseFloat(order.delivery_lat.toString())])
        .setPopup(popup)
        .addTo(map.current!);

      // Agregar evento de clic para seleccionar el pedido
      markerElement.addEventListener('click', () => {
        setSelectedOrder(order);
      });

      // Guardar referencia del marcador
      (marker as any).id = markerId;
    });
  };

  // Función para agregar marcador del origen
  const addOriginMarker = () => {
    if (!map.current || !isMapReady) return;

    const originMarkerId = 'origin-marker';
    const originMarkerElement = document.createElement('div');
    originMarkerElement.className = 'origin-marker';
    originMarkerElement.innerHTML = `
      <div style="
        width: 32px;
        height: 32px;
        background: #2563eb;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="white">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
        </svg>
      </div>
    `;

    // Crear popup con información del origen
    const popup = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: true,
      closeOnClick: false
    }).setHTML(`
      <div style="padding: 12px; min-width: 200px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="width: 16px; height: 16px; background: #2563eb; border-radius: 50%; margin-right: 8px;"></div>
          <h4 style="margin: 0; color: #1f2937; font-weight: 600;">🏢 Origen</h4>
        </div>
        <p style="margin: 0 0 8px 0; color: #374151; font-weight: 500;">${route.origin_name}</p>
        <div style="font-size: 12px; color: #6b7280;">
          <p style="margin: 2px 0;">📍 ${parseFloat(route.origin_lat.toString()).toFixed(4)}, ${parseFloat(route.origin_lon.toString()).toFixed(4)}</p>
          <p style="margin: 2px 0;">🚚 Punto de partida y llegada</p>
        </div>
      </div>
    `);

    const originMarker = new mapboxgl.Marker(originMarkerElement)
      .setLngLat([parseFloat(route.origin_lon.toString()), parseFloat(route.origin_lat.toString())])
      .setPopup(popup)
      .addTo(map.current);
    
    (originMarker as any).id = originMarkerId;
  };

  // Función para ajustar el mapa a la ruta
  const fitMapToRoute = () => {
    if (!map.current || route.route_points.length === 0 || !isMapReady) return;

    const bounds = new mapboxgl.LngLatBounds();
    route.route_points.forEach(point => {
      bounds.extend([parseFloat(point.lon.toString()), parseFloat(point.lat.toString())]);
    });

    map.current.fitBounds(bounds, {
      padding: { top: 20, bottom: 20, left: 20, right: 20 },
      maxZoom: 16,
      duration: 1000,
      essential: true
    });
  };

  // Inicializar el mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [parseFloat(route.origin_lon.toString()), parseFloat(route.origin_lat.toString())],
      zoom: 12,
      maxZoom: 18,
      minZoom: 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    // Habilitar interacciones
    map.current.scrollZoom.enable();
    map.current.doubleClickZoom.enable();
    map.current.dragPan.enable();
    map.current.dragRotate.enable();

    // Esperar a que el mapa esté listo
    map.current.on('style.load', () => {
      setIsMapReady(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setAddedSources([]);
      setAddedLayers([]);
      setIsMapReady(false);
    };
  }, []);

  // Mostrar la ruta cuando el mapa esté listo
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    clearMap();
    displayRoute();
    fitMapToRoute();
  }, [route, isMapReady]);

  // Calcular estadísticas de la ruta
  const totalOrders = route.orders.length;
  const completedOrders = route.orders.filter(order => order.status === 'COMPLETED').length;
  const inRouteOrders = route.orders.filter(order => order.status === 'IN_ROUTE').length;
  const pendingOrders = route.orders.filter(order => order.status === 'PENDING').length;
  const assignedOrders = route.orders.filter(order => order.status === 'ASSIGNED').length;
  const cancelledOrders = route.orders.filter(order => order.status === 'CANCELLED').length;

  return (
    <div className="space-y-4">
      {/* Header con información de la ruta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{route.route_name}</h2>
            <p className="text-gray-600">{route.description}</p>
          </div>
        </div>

        {/* Estadísticas de la ruta */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
            <div className="text-sm text-gray-600">Total Pedidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
            <div className="text-sm text-gray-600">Entregados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{inRouteOrders}</div>
            <div className="text-sm text-gray-600">En Camino</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{assignedOrders}</div>
            <div className="text-sm text-gray-600">Asignados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{pendingOrders}</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>📍 {route.origin_name}</span>
            <span>⏱️ {Math.round(route.traffic_delay / 60)} min tráfico</span>
            <span>📅 {new Date(route.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="relative w-full h-96 md:h-[500px]">
          <div 
            ref={mapContainer} 
            className="w-full h-96 md:h-[500px]" 
            style={{ 
              position: 'relative', 
              overflow: 'hidden',
              cursor: 'grab'
            }}
          />
          {!isMapReady && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de pedidos seleccionado */}
      {selectedOrder && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Pedido Seleccionado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{selectedOrder.order_number}</h4>
              <p className="text-gray-600 text-sm mb-2">{selectedOrder.delivery_address}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border`}
                      style={{ 
                        backgroundColor: `${getOrderStatusColor(selectedOrder.status)}20`,
                        color: getOrderStatusColor(selectedOrder.status),
                        borderColor: `${getOrderStatusColor(selectedOrder.status)}40`
                      }}>
                  {getOrderStatusIcon(selectedOrder.status)}
                  {getOrderStatusText(selectedOrder.status)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 mb-1">
                Q{parseFloat(selectedOrder.total_amount.toString()).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                Orden de entrega: #{selectedOrder.sequence_order}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedRouteMap;
