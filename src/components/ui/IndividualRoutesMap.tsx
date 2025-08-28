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
  isReady: boolean;
}

export function IndividualRoutesMap({
  pickupLocation,
  orders,
  selectedOrders,
  onOrderSelection,
  onSelectAll,
  onClearAll,
  searchTerm,
  onSearchChange,
  isReady
}: IndividualRoutesMapProps) {
  const [map, setMap] = useState<any>(null);
  const [routeLayers, setRouteLayers] = useState<string[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Generar colores automáticamente para las rutas
  const generateRouteColor = (index: number) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1',
      '#84CC16', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'
    ];
    return colors[index % colors.length];
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

    const mapInstance = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [pickupLocation.lng, pickupLocation.lat],
      zoom: 12
    });

    mapInstance.on('load', () => {
      setMap(mapInstance);
      setIsMapReady(true);
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
    if (isReady && isMapReady && map) {
      loadIndividualRoutes();
    }
  }, [selectedOrders, isReady, isMapReady, map]);

  const loadIndividualRoutes = async () => {
    if (!map || !isMapReady || !isReady) return;

    if (selectedOrders.length === 0) {
      clearAllRoutes();
      map.setCenter([pickupLocation.lng, pickupLocation.lat]);
      map.setZoom(12);
      return;
    }

    setIsLoading(true);
    setError(null);
    clearAllRoutes();
    
    ensurePickupMarker();

    const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
    
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
        const color = generateRouteColor(i);
        
        await loadRouteForOrder(order, color, i);
      }

      // Ajustar vista para mostrar todas las rutas
      fitMapToAllRoutes();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
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
      if (!order.deliveryLocation.lat || !order.deliveryLocation.lng) {
        return;
      }

      const lat = Number(order.deliveryLocation.lat);
      const lng = Number(order.deliveryLocation.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        return;
      }

      const token = getMapboxToken();
      const baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';
      const profile = 'driving';
      
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
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        if (!route.geometry || !route.geometry.coordinates) {
          return;
        }
        
        const routeGeoJSON = {
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        };
        
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

        // Agregar marcador de entrega
        const marker = new window.mapboxgl.Marker({ 
          element: createCustomMarker('E', color)
        })
          .setLngLat([lng, lat])
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
      }

    } catch (error) {
      console.error(`Error cargando ruta para pedido ${order.orderNumber}:`, error);
    }
  };

  const fitMapToAllRoutes = () => {
    if (!map || selectedOrders.length === 0) return;

    try {
      const bounds = new window.mapboxgl.LngLatBounds();
      
      bounds.extend([pickupLocation.lng, pickupLocation.lat]);
      
      const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
      
      selectedOrdersData.forEach(order => {
        const lat = Number(order.deliveryLocation.lat);
        const lng = Number(order.deliveryLocation.lng);
        
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          bounds.extend([lng, lat]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      } else {
        map.setCenter([pickupLocation.lng, pickupLocation.lat]);
        map.setZoom(12);
      }
    } catch (error) {
      map.setCenter([pickupLocation.lng, pickupLocation.lat]);
      map.setZoom(12);
    }
  };

  const clearAllRoutes = () => {
    if (!map) return;

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

    const deliveryMarkers = markers.filter(marker => {
      if (marker._lngLat) {
        const isPickup = marker._lngLat.lng === pickupLocation.lng && 
                        marker._lngLat.lat === pickupLocation.lat;
        return !isPickup;
      }
      return true;
    });

    deliveryMarkers.forEach(marker => marker.remove());
    
    setMarkers(prev => prev.filter(marker => {
      if (marker._lngLat) {
        const isPickup = marker._lngLat.lng === pickupLocation.lng && 
                        marker._lngLat.lat === pickupLocation.lat;
        return isPickup;
      }
      return false;
    }));
  };

  const ensurePickupMarker = () => {
    if (!map) return;
    
    const existingPickupMarker = markers.find(marker => 
      marker._lngLat && 
      marker._lngLat.lng === pickupLocation.lng && 
      marker._lngLat.lat === pickupLocation.lat
    );
    
    if (!existingPickupMarker) {
      addPickupMarker(map);
    }
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
                <div className="text-xs text-gray-400">
                  {orders.filter(o => o.deliveryLocation.lat && o.deliveryLocation.lng).length} con ubicación
                </div>
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
                {selectedOrders.length === orders.filter(o => o.deliveryLocation.lat && o.deliveryLocation.lng).length 
                  ? 'Deseleccionar Todo' 
                  : 'Seleccionar Todo'
                }
              </Button>
              <div className="text-xs text-gray-500 mt-1 text-center">
                Solo pedidos con ubicación válida
              </div>
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
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.checkbox-container')) {
                        return;
                      }
                      hasLocation && onOrderSelection(order.id);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="checkbox-container">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => {
                            hasLocation && onOrderSelection(order.id);
                          }}
                          disabled={!hasLocation}
                          className="mt-0.5"
                        />
                      </div>
                      
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
            {orders.filter(order => selectedOrders.includes(order.id)).map((order, index) => (
              <div key={order.id} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: generateRouteColor(index) }}
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
