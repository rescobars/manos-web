'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Route, Clock, Car, AlertCircle, X } from 'lucide-react';
import { Button } from './Button';
import { getMapboxToken, isMapboxConfigured } from '@/lib/mapbox';

interface Location {
  lat: number;
  lng: number;
  address: string;
  id?: string;
}

interface IndividualRoutesMapProps {
  pickupLocation: Location;
  selectedOrders: Array<{
    id: string;
    orderNumber: string;
    deliveryLocation: Location;
  }>;
}

// Colores para las diferentes rutas
const ROUTE_COLORS = [
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#F59E0B', // Amarillo
  '#EF4444', // Rojo
  '#8B5CF6', // Púrpura
  '#F97316', // Naranja
  '#06B6D4', // Cian
  '#84CC16', // Verde lima
  '#EC4899', // Rosa
  '#6366F1', // Índigo
];

export function IndividualRoutesMap({
  pickupLocation,
  selectedOrders
}: IndividualRoutesMapProps) {
  const [map, setMap] = useState<any>(null);
  const [routeLayers, setRouteLayers] = useState<string[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Inicializar mapa
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

  const initializeMap = () => {
    if (!mapContainerRef.current) return;

    const mapInstance = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [pickupLocation.lng, pickupLocation.lat],
      zoom: 12
    });

    mapInstance.on('load', () => {
      setMap(mapInstance);
      addPickupMarker(mapInstance);
    });
  };

  const createCustomMarker = (label: string, color: string) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = `
      <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm font-bold text-white" 
           style="background-color: ${color}">
        ${label.charAt(0)}
      </div>
    `;
    return el;
  };

  const addPickupMarker = (mapInstance: any) => {
    // Crear un marcador personalizado con icono de sucursal
    const pickupMarker = new window.mapboxgl.Marker({ 
      element: createCustomMarker('Sucursal', '#DC2626')
    })
      .setLngLat([pickupLocation.lng, pickupLocation.lat])
      .addTo(mapInstance);

    const popup = new window.mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="text-center">
          <div class="font-semibold text-red-600">🏪 Sucursal</div>
          <div class="text-sm text-gray-600">${pickupLocation.address}</div>
        </div>
      `);
    pickupMarker.setPopup(popup);

    setMarkers(prev => [...prev, pickupMarker]);
  };

  // Cargar rutas cuando cambien los pedidos seleccionados
  useEffect(() => {
    if (map && selectedOrders.length > 0) {
      loadIndividualRoutes();
    } else if (map) {
      clearAllRoutes();
      // Asegurar que el marcador de la sucursal esté siempre presente
      ensurePickupMarker();
    }
  }, [map, selectedOrders]);

  // Asegurar que el marcador de la sucursal esté presente cuando el mapa se inicialice
  useEffect(() => {
    if (map) {
      ensurePickupMarker();
    }
  }, [map]);

  // Asegurar que el marcador de la sucursal esté siempre presente
  const ensurePickupMarker = () => {
    if (!map) return;
    
    // Verificar si ya existe el marcador de pickup
    const existingPickupMarker = markers.find(marker => 
      marker._lngLat && 
      marker._lngLat.lng === pickupLocation.lng && 
      marker._lngLat.lat === pickupLocation.lat
    );
    
    if (!existingPickupMarker) {
      console.log('🔍 Agregando marcador de sucursal que faltaba');
      addPickupMarker(map);
    }
  };

  const loadIndividualRoutes = async () => {
    if (!map || selectedOrders.length === 0) return;

    setIsLoading(true);
    setError(null);
    clearAllRoutes();
    
    // Asegurar que el marcador de la sucursal esté presente
    ensurePickupMarker();

    console.log('🔍 Iniciando carga de rutas individuales:', {
      totalOrders: selectedOrders.length,
      orders: selectedOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        coordinates: {
          lat: order.deliveryLocation.lat,
          lng: order.deliveryLocation.lng
        },
        address: order.deliveryLocation.address
      }))
    });

    try {
      const token = getMapboxToken();
      if (!token) {
        throw new Error('Mapbox token no configurado');
      }

      // Limpiar marcadores anteriores (excepto pickup)
      markers.slice(1).forEach(marker => marker.remove());
      setMarkers(prev => prev.slice(0, 1));

      // Cargar ruta para cada pedido seleccionado
      for (let i = 0; i < selectedOrders.length; i++) {
        const order = selectedOrders[i];
        const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
        
        await loadRouteForOrder(order, color, i);
      }

      // Ajustar vista para mostrar todas las rutas
      fitMapToAllRoutes();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error cargando rutas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRouteForOrder = async (
    order: { id: string; orderNumber: string; deliveryLocation: Location },
    color: string,
    index: number
  ) => {
    try {
      // Validar que las coordenadas estén en el formato correcto
      if (!order.deliveryLocation.lat || !order.deliveryLocation.lng) {
        console.error(`Pedido ${order.orderNumber} no tiene coordenadas válidas:`, order.deliveryLocation);
        return;
      }

      // Asegurar que las coordenadas sean números
      const lat = Number(order.deliveryLocation.lat);
      const lng = Number(order.deliveryLocation.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error(`Pedido ${order.orderNumber} tiene coordenadas inválidas: lat=${lat}, lng=${lng}`);
        return;
      }

      console.log(`🔍 Cargando ruta para pedido ${order.orderNumber}:`, {
        orderId: order.id,
        coordinates: { lat, lng },
        address: order.deliveryLocation.address
      });

      const token = getMapboxToken();
      const baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';
      const profile = 'driving';
      
      // Construir coordenadas: pickup -> delivery
      const coordinates = `${pickupLocation.lng},${pickupLocation.lat};${lng},${lat}`;
      
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
      
      console.log(`🔍 Respuesta completa de Mapbox para pedido ${order.orderNumber}:`, data);
      console.log(`🔍 Estructura de la ruta:`, {
        hasRoutes: !!data.routes,
        routesLength: data.routes?.length,
        firstRoute: data.routes?.[0],
        geometry: data.routes?.[0]?.geometry,
        coordinates: data.routes?.[0]?.geometry?.coordinates
      });
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Verificar que la ruta tenga la estructura correcta de GeoJSON
        if (!route.geometry || !route.geometry.coordinates) {
          console.warn(`Ruta para pedido ${order.orderNumber} no tiene geometría válida:`, route);
          return;
        }
        
        // Crear un objeto GeoJSON válido para la ruta
        const routeGeoJSON = {
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        };
        
        console.log(`🔍 GeoJSON de ruta para pedido ${order.orderNumber}:`, routeGeoJSON);
        
        // Agregar la ruta al mapa
        const routeId = `route-${order.id}`;
        const sourceId = `source-${order.id}`;
        
        map.addSource(sourceId, {
          type: 'geojson',
          data: routeGeoJSON
        });

        map.addLayer({
          id: routeId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': color,
            'line-width': 4,
            'line-opacity': 0.8
          }
        });

        setRouteLayers(prev => [...prev, routeId]);

        // Agregar marcador de entrega con coordenadas validadas
        const marker = new window.mapboxgl.Marker({ 
          element: createCustomMarker('E', color)
        })
          .setLngLat([lng, lat]) // Usar las coordenadas validadas
          .addTo(map);

        const popup = new window.mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="text-center">
              <div class="font-semibold" style="color: ${color}">Pedido #${order.orderNumber}</div>
              <div class="text-sm text-gray-600">${order.deliveryLocation.address}</div>
              <div class="text-xs text-gray-500 mt-1">
                Distancia: ${(route.distance / 1000).toFixed(1)} km<br>
                Tiempo: ${Math.floor(route.duration / 60)} min
              </div>
            </div>
          `);
        marker.setPopup(popup);

        setMarkers(prev => [...prev, marker]);

      } else {
        console.warn(`No se pudo generar ruta para el pedido ${order.orderNumber}:`, data);
      }

    } catch (error) {
      console.error(`Error cargando ruta para pedido ${order.orderNumber}:`, error);
    }
  };

  const fitMapToAllRoutes = () => {
    if (!map || selectedOrders.length === 0) return;

    try {
      const bounds = new window.mapboxgl.LngLatBounds();
      
      // Agregar pickup - usar formato correcto [lng, lat]
      bounds.extend([pickupLocation.lng, pickupLocation.lat]);
      
      // Agregar todas las entregas con validación
      selectedOrders.forEach(order => {
        const lat = Number(order.deliveryLocation.lat);
        const lng = Number(order.deliveryLocation.lng);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          // Usar formato correcto [lng, lat] según documentación de Mapbox
          bounds.extend([lng, lat]);
        } else {
          console.warn(`Pedido ${order.orderNumber} tiene coordenadas inválidas para bounds: lat=${lat}, lng=${lng}`);
        }
      });
      
      // Verificar que bounds tenga al menos 2 puntos
      if (bounds.isEmpty()) {
        console.warn('Bounds está vacío, no se puede ajustar la vista');
        return;
      }
      
      map.fitBounds(bounds, { padding: 50 });
    } catch (error) {
      console.error('Error ajustando bounds del mapa:', error);
    }
  };

  const clearAllRoutes = () => {
    if (!map) return;

    // Remover todas las capas de ruta
    routeLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      const sourceId = layerId.replace('route-', 'source-');
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });

    setRouteLayers([]);

    // Limpiar solo los marcadores de entrega, preservar el de sucursal
    const deliveryMarkers = markers.filter(marker => {
      // Verificar si es el marcador de pickup (sucursal)
      if (marker._lngLat) {
        const isPickup = marker._lngLat.lng === pickupLocation.lng && 
                        marker._lngLat.lat === pickupLocation.lat;
        if (isPickup) {
          return false; // No remover el marcador de pickup
        }
      }
      return true; // Remover todos los demás marcadores
    });

    // Remover marcadores de entrega del mapa
    deliveryMarkers.forEach(marker => marker.remove());
    
    // Actualizar el estado de marcadores, manteniendo solo el de pickup
    setMarkers(prev => prev.filter(marker => {
      if (marker._lngLat) {
        const isPickup = marker._lngLat.lng === pickupLocation.lng && 
                        marker._lngLat.lat === pickupLocation.lat;
        return isPickup; // Solo mantener el marcador de pickup
      }
      return false;
    }));
  };

  const clearError = () => setError(null);

  if (!isMapboxConfigured()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Mapbox no configurado</h3>
        <p className="text-yellow-700">Configura tu token de Mapbox para usar la visualización de rutas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header del mapa */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Mapa de Rutas Individuales
          </h3>
          <p className="text-sm text-gray-600">
            {selectedOrders.length > 0 
              ? `${selectedOrders.length} pedido(s) seleccionado(s)`
              : 'Selecciona pedidos para ver sus rutas'
            }
          </p>
        </div>
        
        {selectedOrders.length > 0 && (
          <Button
            onClick={clearAllRoutes}
            variant="outline"
            size="sm"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar Rutas
          </Button>
        )}
      </div>

      {/* Mapa */}
      <div className="relative">
        <div 
          ref={mapContainerRef} 
          className="w-full h-96 rounded-lg border border-gray-200"
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Cargando rutas...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-700 mb-2">{error}</p>
              <Button onClick={clearError} size="sm" variant="outline">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda de colores */}
      {selectedOrders.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Leyenda de Rutas:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {selectedOrders.map((order, index) => (
              <div key={order.id} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: ROUTE_COLORS[index % ROUTE_COLORS.length] }}
                />
                <span className="text-sm text-gray-700">
                  Pedido #{order.orderNumber}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
