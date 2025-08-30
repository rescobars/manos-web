'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { isMapboxConfigured } from '@/lib/mapbox';
import { Location, Order } from './mapbox/types';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Configurar Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routesLoaded, setRoutesLoaded] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const routesRef = useRef<Map<string, any>>(new Map());

  // Generar colores únicos para cada pedido
  const generateRouteColor = (orderId: string) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'
    ];
    
    let hash = 0;
    for (let i = 0; i < orderId.length; i++) {
      const char = orderId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleRouteLoaded = () => {
    setRoutesLoaded(true);
    setIsLoading(false);
  };

  const clearError = () => setError(null);

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

  // Inicializar el mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [pickupLocation.lng, pickupLocation.lat],
        zoom: 12,
        maxZoom: 18,
        minZoom: 8
      });

      map.current.addControl(new mapboxgl.NavigationControl());

      // Esperar a que el estilo del mapa esté completamente cargado
      map.current.on('style.load', () => {
        console.log('🎉 Mapa cargado completamente');
        setIsMapReady(true);
      });

      map.current.on('load', () => {
        console.log('🚀 Mapa inicializado');
      });

      map.current.on('error', (e: any) => {
        console.error('Map error:', e);
        setError('Error en el mapa');
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Error inicializando el mapa');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setIsMapReady(false);
    };
  }, [pickupLocation.lng, pickupLocation.lat]);

  // Cargar marcador de pickup cuando el mapa esté listo
  useEffect(() => {
    if (!map.current || !isMapReady || !pickupLocation) return;

    try {
      // Limpiar marcador de pickup anterior si existe
      if (markersRef.current.has('pickup')) {
        const existingMarker = markersRef.current.get('pickup');
        if (existingMarker && typeof existingMarker.remove === 'function') {
          existingMarker.remove();
        }
        markersRef.current.delete('pickup');
      }

      const pickupMarker = new mapboxgl.Marker({ 
        element: createCustomMarker('Sucursal', '#2563EB')
      })
        .setLngLat([pickupLocation.lng, pickupLocation.lat])
        .addTo(map.current);

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="text-center">
            <div class="font-semibold text-blue-600">🏪 Sucursal</div>
            <div class="text-sm text-gray-600">${pickupLocation.address}</div>
          </div>
        `);
      pickupMarker.setPopup(popup);

      markersRef.current.set('pickup', pickupMarker);
    } catch (error) {
      console.error('Error adding pickup marker:', error);
    }
  }, [map.current, isMapReady, pickupLocation]);

  // Cargar rutas cuando cambien los pedidos seleccionados
  useEffect(() => {
    if (!map.current || !isMapReady || selectedOrders.length === 0) {
      if (map.current && isMapReady) {
        clearAllRoutes();
      }
      return;
    }

    const loadAllRoutes = async () => {
      try {
        setIsLoading(true);
        clearAllRoutes();
        
        // Cargar ruta para cada pedido seleccionado
        for (let i = 0; i < selectedOrders.length; i++) {
          const orderId = selectedOrders[i];
          const order = orders.find(o => o.id === orderId);
          if (order) {
            const color = generateRouteColor(order.id);
            await loadRouteForOrder(order, color);
          }
        }

        // Ajustar vista para mostrar todas las rutas
        fitMapToAllRoutes();
        
        handleRouteLoaded();
      } catch (error) {
        console.error('Error loading all routes:', error);
        setError('Error cargando las rutas');
        setIsLoading(false);
      }
    };

    loadAllRoutes();
  }, [map.current, isMapReady, selectedOrders, orders, pickupLocation]);

  // Resetear estado de rutas cuando cambien los pedidos seleccionados
  useEffect(() => {
    if (selectedOrders.length === 0) {
      setRoutesLoaded(false);
      setIsLoading(false);
    }
  }, [selectedOrders]);

  const createCustomMarker = (label: string, color: string) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    
    const isOrderNumber = label.length > 1 && !isNaN(Number(label));
    
    if (isOrderNumber) {
      el.innerHTML = `
        <div class="w-16 h-16 rounded-full border-3 border-white shadow-xl flex items-center justify-center text-white font-bold" 
             style="background-color: ${color}; font-size: 16px;">
          ${label}
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="w-12 h-12 flex items-center justify-center text-white font-bold shadow-lg rounded-full" 
             style="background-color: ${color}; border: 2px solid white;">
          <div class="text-center text-sm font-bold">
            P
          </div>
        </div>
      `;
    }
    
    return el;
  };

  const loadRouteForOrder = async (order: Order, color: string) => {
    try {
      if (!map.current || !isMapReady || !order.deliveryLocation.lat || !order.deliveryLocation.lng) {
        return;
      }

      const lat = Number(order.deliveryLocation.lat);
      const lng = Number(order.deliveryLocation.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        return;
      }

      const token = mapboxgl.accessToken;
      const baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';
      const profile = 'driving';
      
      const coordinates = `${pickupLocation.lng},${pickupLocation.lat};${lng},${lat}`;
      
      const params = new URLSearchParams({
        access_token: token || '',
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
          type: 'Feature' as const,
          properties: {},
          geometry: route.geometry
        };
        
        const routeId = `route-${order.id}`;
        const sourceId = `source-${order.id}`;
        
        // Limpiar ruta anterior si existe
        if (routesRef.current.has(routeId)) {
          try {
            if (map.current?.getLayer(routeId)) {
              map.current.removeLayer(routeId);
            }
            if (map.current?.getSource(sourceId)) {
              map.current.removeSource(sourceId);
            }
          } catch (error) {
            console.warn('Error removing existing route:', error);
          }
          routesRef.current.delete(routeId);
        }
        
        // Verificar que la fuente no exista antes de agregarla
        if (map.current?.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
        
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: routeGeoJSON
        });

        map.current.addLayer({
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

        routesRef.current.set(routeId, { sourceId, routeId });

        // Agregar marcador de entrega
        const markerId = `order-${order.id}`;
        
        // Limpiar marcador anterior si existe
        if (markersRef.current.has(markerId)) {
          try {
            const existingMarker = markersRef.current.get(markerId);
            if (existingMarker && typeof existingMarker.remove === 'function') {
              existingMarker.remove();
            }
          } catch (error) {
            console.warn('Error removing existing marker:', error);
          }
          markersRef.current.delete(markerId);
        }

        const marker = new mapboxgl.Marker({ 
          element: createCustomMarker(order.orderNumber, color)
        })
          .setLngLat([lng, lat])
          .addTo(map.current);

        const popup = new mapboxgl.Popup({ offset: 25 })
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

        markersRef.current.set(markerId, marker);
      }

    } catch (error) {
      console.error(`Error cargando ruta para pedido ${order.orderNumber}:`, error);
    }
  };

  const clearAllRoutes = () => {
    if (!map.current || !isMapReady) {
      return;
    }

    try {
      // Limpiar todas las capas de rutas
      routesRef.current.forEach((routeInfo, routeId) => {
        try {
          if (map.current?.getLayer(routeId)) {
            map.current.removeLayer(routeId);
          }
          if (map.current?.getSource(routeInfo.sourceId)) {
            map.current.removeSource(routeInfo.sourceId);
          }
        } catch (error) {
          console.warn('Error removing route:', error);
        }
      });
      routesRef.current.clear();

      // Limpiar todos los marcadores excepto el de pickup
      markersRef.current.forEach((marker, markerId) => {
        if (markerId !== 'pickup') {
          try {
            if (marker && typeof marker.remove === 'function') {
              marker.remove();
            }
          } catch (error) {
            console.warn('Error removing marker:', error);
          }
        }
      });
      
      // Mantener solo el marcador de pickup
      const pickupMarker = markersRef.current.get('pickup');
      markersRef.current.clear();
      if (pickupMarker) {
        markersRef.current.set('pickup', pickupMarker);
      }
    } catch (error) {
      console.error('Error clearing routes:', error);
    }
  };

  const fitMapToAllRoutes = () => {
    if (!map.current || !isMapReady || selectedOrders.length === 0) return;

    try {
      const bounds = new mapboxgl.LngLatBounds();
      
      bounds.extend([pickupLocation.lng, pickupLocation.lat]);
      
      selectedOrders.forEach(orderId => {
        const order = orders.find(o => o.id === orderId);
        if (order && order.deliveryLocation.lat && order.deliveryLocation.lng) {
          bounds.extend([order.deliveryLocation.lng, order.deliveryLocation.lat]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      console.warn('Error fitting bounds, using fallback:', error);
      try {
        map.current.setCenter([pickupLocation.lng, pickupLocation.lat]);
        map.current.setZoom(12);
      } catch (fallbackError) {
        console.error('Fallback center/zoom failed:', fallbackError);
      }
    }
  };

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
          <h3 className="text-lg font-semibold text-gray-900">Mapa de Rutas Individuales</h3>
          <p className="text-sm text-gray-600">
            {selectedOrders.length > 0 
              ? `${selectedOrders.length} pedido(s) seleccionado(s)`
              : 'Selecciona pedidos para ver sus rutas'
            }
          </p>
        </div>
      </div>

      {/* Layout de dos columnas: Mapa + Lista de pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa - ocupa 2/3 del espacio */}
        <div className="lg:col-span-2">
          {/* Status indicator */}
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">
              {!isMapReady && <span className="text-blue-600">🗺️ Cargando mapa...</span>}
              {isMapReady && orders.length === 0 && <span className="text-yellow-600">📦 Esperando pedidos del backend...</span>}
              {isMapReady && orders.length > 0 && selectedOrders.length === 0 && <span className="text-yellow-600">✅ Mapa listo, selecciona pedidos</span>}
              {isMapReady && orders.length > 0 && selectedOrders.length > 0 && !routesLoaded && <span className="text-green-600">🚀 Cargando rutas...</span>}
              {routesLoaded && <span className="text-green-600">✅ Últimas rutas cargadas</span>}
            </div>
          </div>

          <div className="relative">
            <div className="w-full h-[600px] rounded-lg border border-gray-200 overflow-hidden">
              <div 
                ref={mapContainer} 
                className="w-full h-full"
              />
              {!isMapReady && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Inicializando mapa...</p>
                  </div>
                </div>
              )}
            </div>
            
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
                {selectedOrders.length === orders.length 
                  ? 'Deseleccionar Todo' 
                  : 'Seleccionar Todo'
                }
              </Button>
            </div>

            {/* Lista de pedidos */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrders.includes(order.id);
                
                return (
                  <div
                    key={order.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.checkbox-container')) {
                        return;
                      }
                      onOrderSelection(order.id);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="checkbox-container">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => onOrderSelection(order.id)}
                          className="mt-0.5"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">#{order.orderNumber}</span>
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
            {orders.filter(order => selectedOrders.includes(order.id)).map((order) => (
              <div key={order.id} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: generateRouteColor(order.id) }}
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
