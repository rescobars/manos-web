'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Route, Clock, Car, AlertCircle, X, Package } from 'lucide-react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { getMapboxToken, isMapboxConfigured } from '@/lib/mapbox';

interface Location {
  lat: number;
  lng: number;
  address: string;
  id?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  deliveryLocation: Location;
  description?: string;
  totalAmount?: number;
  createdAt?: string;
}

interface IndividualRoutesMapProps {
  pickupLocation: Location;
  orders: Order[];
  selectedOrders: string[];
  onOrderSelection: (orderId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
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
  orders,
  selectedOrders,
  onOrderSelection,
  onSelectAll,
  onClearAll,
  searchTerm,
  onSearchChange
}: IndividualRoutesMapProps) {
  const [map, setMap] = useState<any>(null);
  const [routeLayers, setRouteLayers] = useState<string[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [pendingRoutes, setPendingRoutes] = useState<string[]>([]);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Obtener pedidos seleccionados para el mapa
  const getSelectedOrdersForMap = () => {
    return orders.filter(order => selectedOrders.includes(order.id));
  };

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

    console.log('🔍 Inicializando mapa...');

    const mapInstance = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [pickupLocation.lng, pickupLocation.lat],
      zoom: 12
    });

    mapInstance.on('load', () => {
      console.log('🔍 Mapa cargado completamente');
      setMap(mapInstance);
      setIsMapReady(true);
      addPickupMarker(mapInstance);
      
      // Procesar rutas pendientes si las hay
      if (pendingRoutes.length > 0) {
        console.log('🔍 Procesando rutas pendientes:', pendingRoutes);
        processPendingRoutes();
      }
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
    if (selectedOrders.length > 0) {
      if (isMapReady && map) {
        // Si el mapa está listo, cargar rutas inmediatamente
        console.log('🔍 Mapa listo, cargando rutas inmediatamente');
        loadIndividualRoutes();
      } else {
        // Si el mapa no está listo, guardar en cola de espera
        console.log('🔍 Mapa no listo, guardando rutas en cola de espera');
        setPendingRoutes(selectedOrders);
      }
    } else if (isMapReady && map) {
      // Si no hay pedidos seleccionados y el mapa está listo, limpiar rutas
      clearAllRoutes();
      ensurePickupMarker();
    }
  }, [selectedOrders, isMapReady, map]);

  // Procesar rutas pendientes cuando el mapa esté listo
  const processPendingRoutes = () => {
    if (!isMapReady || !map) return;
    
    console.log('🔍 Procesando rutas pendientes...');
    setPendingRoutes([]); // Limpiar cola de espera
    loadIndividualRoutes(); // Cargar rutas
  };

  // Asegurar que el marcador de la sucursal esté presente cuando el mapa se inicialice
  useEffect(() => {
    if (map && isMapReady) {
      ensurePickupMarker();
    }
  }, [map, isMapReady]);

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
    if (!map || !isMapReady) {
      console.log('🔍 loadIndividualRoutes: mapa no está listo', {
        hasMap: !!map,
        isMapReady
      });
      return;
    }

    if (selectedOrders.length === 0) {
      console.log('🔍 loadIndividualRoutes: no hay pedidos seleccionados, limpiando mapa');
      clearAllRoutes();
      // Centrar en pickup location cuando no hay rutas
      try {
        map.setCenter([pickupLocation.lng, pickupLocation.lat]);
        map.setZoom(12);
      } catch (error) {
        console.error('Error centrando mapa en pickup location:', error);
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    clearAllRoutes();
    
    // Asegurar que el marcador de la sucursal esté presente
    ensurePickupMarker();

    const selectedOrdersData = getSelectedOrdersForMap();
    
    console.log('🔍 Iniciando carga de rutas individuales:', {
      totalOrders: selectedOrdersData.length,
      orders: selectedOrdersData.map(order => ({
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
      for (let i = 0; i < selectedOrdersData.length; i++) {
        const order = selectedOrdersData[i];
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
    order: Order,
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
      // Validar que pickupLocation tenga coordenadas válidas
      if (!pickupLocation.lat || !pickupLocation.lng || 
          isNaN(Number(pickupLocation.lat)) || isNaN(Number(pickupLocation.lng))) {
        console.warn('Pickup location no tiene coordenadas válidas');
        return;
      }

      const bounds = new window.mapboxgl.LngLatBounds();
      
      // Agregar pickup - usar formato correcto [lng, lat]
      bounds.extend([pickupLocation.lng, pickupLocation.lat]);
      
      // Agregar todas las entregas con validación
      const selectedOrdersData = getSelectedOrdersForMap();
      let validDeliveryPoints = 0;
      
      selectedOrdersData.forEach(order => {
        const lat = Number(order.deliveryLocation.lat);
        const lng = Number(order.deliveryLocation.lng);
        
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          // Usar formato correcto [lng, lat] según documentación de Mapbox
          bounds.extend([lng, lat]);
          validDeliveryPoints++;
        } else {
          console.warn(`Pedido ${order.orderNumber} tiene coordenadas inválidas para bounds: lat=${lat}, lng=${lng}`);
        }
      });
      
      // Verificar que bounds tenga al menos 2 puntos válidos
      if (bounds.isEmpty() || validDeliveryPoints === 0) {
        console.warn('No hay suficientes puntos válidos para ajustar la vista del mapa');
        // Centrar en pickup location con zoom por defecto
        map.setCenter([pickupLocation.lng, pickupLocation.lat]);
        map.setZoom(12);
        return;
      }
      
      // Solo usar fitBounds si hay múltiples puntos
      if (validDeliveryPoints > 0) {
        map.fitBounds(bounds, { padding: 50 });
      } else {
        // Si solo hay pickup, centrar ahí
        map.setCenter([pickupLocation.lng, pickupLocation.lat]);
        map.setZoom(12);
      }
    } catch (error) {
      console.error('Error ajustando bounds del mapa:', error);
      // Fallback: centrar en pickup location
      try {
        map.setCenter([pickupLocation.lng, pickupLocation.lat]);
        map.setZoom(12);
      } catch (fallbackError) {
        console.error('Error en fallback de centrado:', fallbackError);
      }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryLocation.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Debug: Log para ver qué está pasando
  console.log('🔍 Debug - IndividualRoutesMap:', {
    totalOrders: orders.length,
    selectedOrders,
    isMapReady,
    pendingRoutes: pendingRoutes.length,
    ordersSample: orders.slice(0, 2).map(o => ({ id: o.id, orderNumber: o.orderNumber })),
    selectedOrdersSample: selectedOrders.slice(0, 2)
  });

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
            onClick={() => {
              clearAllRoutes();
              onClearAll();
            }}
            variant="outline"
            size="sm"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar Rutas
          </Button>
        )}
      </div>

      {/* Layout de dos columnas: Mapa + Lista de pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa - ocupa 2/3 del espacio */}
        <div className="lg:col-span-2">
          <div className="relative">
            {/* Indicador de estado del mapa */}
            {!isMapReady && (
              <div className="absolute inset-0 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Inicializando mapa...</p>
                </div>
              </div>
            )}
            
            <div 
              ref={mapContainerRef} 
              className={`w-full h-[600px] rounded-lg border border-gray-200 ${
                !isMapReady ? 'opacity-50' : 'opacity-100'
              } transition-opacity duration-300`}
            />
            
            {/* Loading overlay para rutas */}
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando rutas...</p>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center z-20">
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
        </div>

        {/* Lista de pedidos - ocupa 1/3 del espacio */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 h-[600px] overflow-hidden flex flex-col">
            {/* Header de la lista */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
              <h4 className="text-sm font-medium text-gray-900">Pedidos</h4>
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  {selectedOrders.length} de {orders.length}
                </div>
                {pendingRoutes.length > 0 && !isMapReady && (
                  <div className="text-xs text-blue-600 mt-1">
                    ⏳ Esperando mapa...
                  </div>
                )}
              </div>
            </div>

            {/* Búsqueda */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Botón seleccionar todo */}
            <div className="mb-3">
              <Button
                onClick={onSelectAll}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                {selectedOrders.length === orders.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
              </Button>
            </div>

            {/* Lista de pedidos */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredOrders.map((order) => {
                const hasLocation = order.deliveryLocation.lat && order.deliveryLocation.lng;
                const isSelected = selectedOrders.includes(order.id);
                
                return (
                  <div
                    key={order.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : hasLocation
                        ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                    onClick={() => {
                      hasLocation && onOrderSelection(order.id);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {
                          hasLocation && onOrderSelection(order.id);
                        }}
                        disabled={!hasLocation}
                        className="mt-0.5"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">#{order.orderNumber}</span>
                          {!hasLocation && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Sin ubicación
                            </span>
                          )}
                        </div>
                        
                        {order.description && (
                          <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                            {order.description}
                          </p>
                        )}
                        
                        <div className="text-xs text-gray-500 mb-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          <span className="line-clamp-1">{order.deliveryLocation.address}</span>
                        </div>
                        
                        {order.totalAmount && (
                          <div className="text-xs font-medium text-gray-900">
                            {formatCurrency(order.totalAmount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda de colores */}
      {selectedOrders.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Leyenda de Rutas:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {getSelectedOrdersForMap().map((order, index) => (
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
