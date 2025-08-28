'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Route, Clock, Car, AlertCircle, X, Package, Zap } from 'lucide-react';
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
  optimizedRoute?: any; // Tipo de la respuesta del API de optimización
  showOptimizedRoute?: boolean;
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
  optimizedRoute: externalOptimizedRoute,
  showOptimizedRoute: externalShowOptimizedRoute
}: IndividualRoutesMapProps) {
  const [map, setMap] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<{
    distance: number;
    duration: number;
    geometry: any;
    legs: any[];
    optimizedOrderSequence: { order: Order; stopNumber: number }[];
  } | null>(null);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(false);
  
  // Usar la prop externa si está disponible, sino el estado interno
  const isShowingOptimizedRoute = externalShowOptimizedRoute !== undefined ? externalShowOptimizedRoute : showOptimizedRoute;
  const currentOptimizedRoute = externalOptimizedRoute || optimizedRoute;
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  // Generar color verde que va de claro a oscuro según el número de parada
  const generateStopColor = (stopNumber: number, totalStops: number) => {
    // Verde claro al inicio (no tan extremo)
    const startGreen = [187, 247, 208]; // #BBF7D0 - verde claro suave
    
    // Verde medio-oscuro al final (no tan extremo)
    const endGreen = [34, 197, 94]; // #22C55E - verde medio
    
    // Calcular qué tan oscuro debe ser (0 = claro, 1 = oscuro)
    const darknessFactor = (stopNumber - 1) / Math.max(totalStops - 1, 1);
    
    // Interpolación lineal entre el color claro y oscuro
    const red = Math.round(startGreen[0] + (endGreen[0] - startGreen[0]) * darknessFactor);
    const green = Math.round(startGreen[1] + (endGreen[1] - startGreen[1]) * darknessFactor);
    const blue = Math.round(startGreen[2] + (endGreen[2] - startGreen[2]) * darknessFactor);
    
    return `rgb(${red}, ${green}, ${blue})`;
  };

  // 1. Cargar el mapa
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

  // 2. Una vez el mapa cargado, cargar todas las rutas
  useEffect(() => {
    if (isMapReady && map && selectedOrders.length > 0 && !isShowingOptimizedRoute) {
      loadAllRoutes();
    }
  }, [isMapReady, map, selectedOrders, isShowingOptimizedRoute]);

  // 3. Cuando se recibe una ruta optimizada externa, calcular la ruta con Mapbox
  useEffect(() => {
    if (isMapReady && map && currentOptimizedRoute && currentOptimizedRoute.optimized_route) {
      calculateOptimizedRouteWithMapbox();
    }
  }, [isMapReady, map, currentOptimizedRoute]);

  // Mostrar ruta optimizada de la API cuando esté disponible
  useEffect(() => {
    if (externalShowOptimizedRoute && externalOptimizedRoute && map && isMapReady) {
      getRouteGeometryFromMapbox();
    }
  }, [externalShowOptimizedRoute, externalOptimizedRoute, map, isMapReady, pickupLocation]);

  // Auto-enfoque del mapa cuando se muestra la ruta optimizada
  useEffect(() => {
    if (externalShowOptimizedRoute && externalOptimizedRoute && map && map.isStyleLoaded()) {
      // Pequeño delay para asegurar que el mapa esté completamente cargado
      const timer = setTimeout(() => {
        // Hacer zoom al mapa principal para mostrar toda la ruta optimizada
        if (map && pickupLocation) {
          try {
            const bounds = new window.mapboxgl.LngLatBounds();
            
            // Agregar la ubicación de pickup
            bounds.extend([pickupLocation.lng, pickupLocation.lat]);
            
            // Agregar todas las ubicaciones de entrega de la ruta optimizada
            externalOptimizedRoute.optimized_route.stops.forEach((stop: any) => {
              bounds.extend([stop.order.delivery_location.lng, stop.order.delivery_location.lat]);
            });
            
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { 
                padding: 80,
                duration: 1000,
                essential: true
              });
            }
          } catch (error) {
            console.warn('Error en auto-enfoque:', error);
            // Fallback: centrar en pickup con zoom apropiado
            map.setCenter([pickupLocation.lng, pickupLocation.lat]);
            map.setZoom(11);
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [externalShowOptimizedRoute, externalOptimizedRoute, map, pickupLocation]);

  // Función para obtener la geometría de la ruta desde Mapbox usando el orden optimizado de FastAPI
  const getRouteGeometryFromMapbox = async () => {
    if (!map || !externalOptimizedRoute?.optimized_route?.stops) return;
    
    try {
      const token = getMapboxToken();
      if (!token) {
        throw new Error('Mapbox token no configurado');
      }

      // Construir coordenadas usando el orden optimizado de FastAPI
      let coordinates = `${pickupLocation.lng},${pickupLocation.lat}`;
      
      // Agregar coordenadas de los pedidos en el orden optimizado
      externalOptimizedRoute.optimized_route.stops.forEach((stop: any) => {
        const deliveryLocation = stop.order.delivery_location;
        if (deliveryLocation.lat && deliveryLocation.lng) {
          coordinates += `;${deliveryLocation.lng},${deliveryLocation.lat}`;
        }
      });
      
      // Agregar regreso a sucursal
      coordinates += `;${pickupLocation.lng},${pickupLocation.lat}`;

      const baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';
      const profile = 'driving';
      
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
        
        // Mostrar la ruta completa en el mapa
        displayOptimizedRouteWithGeometry(route);
        
        // Ajustar vista para mostrar toda la ruta
        fitMapToOptimizedRouteWithGeometry(route);
      } else {
        throw new Error('No se pudo generar la geometría de la ruta desde Mapbox');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    }
  };

  // Función para mostrar la ruta optimizada con geometría completa
  const displayOptimizedRouteWithGeometry = (route: any) => {
    if (!map) return;
    
    try {
      // Limpiar marcadores anteriores
      if (map._markers) {
        map._markers.forEach((marker: any) => marker.remove());
        map._markers = [];
      }

      // Limpiar capas de ruta anteriores
      if (map.getLayer('optimized-route-layer')) {
        map.removeLayer('optimized-route-layer');
      }
      if (map.getSource('optimized-route')) {
        map.removeSource('optimized-route');
      }

      // Agregar la geometría de la ruta
      const routeGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: route.geometry
      };

      map.addSource('optimized-route', {
        type: 'geojson',
        data: routeGeoJSON
      });

      map.addLayer({
        id: 'optimized-route-layer',
        type: 'line',
        source: 'optimized-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#10B981',
          'line-width': 6,
          'line-opacity': 0.9
        }
      });

      // Agregar marcadores numerados para cada parada
      const stops = externalOptimizedRoute.optimized_route.stops;
      
      stops.forEach((stop: any) => {
        const order = stop.order;
        const deliveryLocation = order.delivery_location;
        
        if (deliveryLocation.lat && deliveryLocation.lng) {
          const stopColor = generateStopColor(stop.stop_number, stops.length);
          
          // Crear marcador numerado
          const marker = new window.mapboxgl.Marker({
            element: createNumberedMarker(stop.stop_number, stopColor),
            anchor: 'bottom'
          })
          .setLngLat([deliveryLocation.lng, deliveryLocation.lat])
          .addTo(map);

          // Agregar popup con información del pedido
          const popup = new window.mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <div class="font-semibold text-sm">Parada #${stop.stop_number}</div>
                <div class="text-xs text-gray-600">Pedido: ${order.order_number}</div>
                <div class="text-xs text-gray-600">${order.description}</div>
                <div class="text-xs text-gray-500">Distancia: ${stop.distance_from_previous.toFixed(3)} km</div>
              </div>
            `);
          
          marker.setPopup(popup);
          
          // Guardar referencia del marcador
          if (!map._markers) map._markers = [];
          map._markers.push(marker);
        }
      });

      // Crear marcador para la ubicación de pickup
      const pickupMarker = new window.mapboxgl.Marker({
        element: createPickupMarker(),
        anchor: 'bottom'
      })
      .setLngLat([pickupLocation.lng, pickupLocation.lat])
      .addTo(map);

      if (!map._markers) map._markers = [];
      map._markers.push(pickupMarker);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error mostrando ruta optimizada');
    }
  };

  // Función para ajustar la vista del mapa a la ruta con geometría
  const fitMapToOptimizedRouteWithGeometry = (route: any) => {
    if (!map || !route.geometry || !route.geometry.coordinates) return;

    try {
      const bounds = new window.mapboxgl.LngLatBounds();
      
      // Agregar todas las coordenadas de la geometría de la ruta
      route.geometry.coordinates.forEach((coord: number[]) => {
        bounds.extend(coord);
      });
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      map.setCenter([pickupLocation.lng, pickupLocation.lat]);
      map.setZoom(12);
    }
  };

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
        <div class="w-20 h-12 flex items-center justify-center text-white font-bold shadow-xl rounded-lg" 
             style="background-color: ${color}; border: 3px solid white;">
          <div class="text-center text-sm">
            ${label}
          </div>
        </div>
      `;
    }
    
    return el;
  };

  const addPickupMarker = (mapInstance: any) => {
    const pickupMarker = new window.mapboxgl.Marker({ 
      element: createCustomMarker('Sucursal', '#2563EB')
    })
      .setLngLat([pickupLocation.lng, pickupLocation.lat])
      .addTo(mapInstance);

    const popup = new window.mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="text-center">
          <div class="font-semibold text-blue-600">🏪 Sucursal</div>
          <div class="text-sm text-gray-600">${pickupLocation.address}</div>
        </div>
      `);
    pickupMarker.setPopup(popup);
  };

  const loadAllRoutes = async () => {
    if (!map || !isMapReady) return;

    setIsLoading(true);
    setError(null);

    try {
      // Limpiar todas las rutas existentes
      clearAllRoutes();

      const token = getMapboxToken();
      if (!token) {
        throw new Error('Mapbox token no configurado');
      }

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

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRouteForOrder = async (order: Order, color: string) => {
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

        // Agregar marcador de entrega
        const marker = new window.mapboxgl.Marker({ 
          element: createCustomMarker(order.orderNumber, color)
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
      }

    } catch (error) {
      console.error(`Error cargando ruta para pedido ${order.orderNumber}:`, error);
    }
  };

  // Función optimizeRoute removida - solo usamos la API de FastAPI

  // Funciones displayOptimizedRoute y fitMapToOptimizedRoute removidas - solo usamos la API de FastAPI

  const calculateOptimizedRouteWithMapbox = async () => {
    if (!map || !currentOptimizedRoute || !currentOptimizedRoute.optimized_route) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = getMapboxToken();
      if (!token) {
        throw new Error('Mapbox token no configurado');
      }

      // Construir coordenadas para la ruta optimizada usando el orden de la respuesta del API
      // Formato: sucursal;pedido1;pedido2;pedido3;sucursal
      let coordinates = `${pickupLocation.lng},${pickupLocation.lat}`;
      
      // Agregar coordenadas de los pedidos en el orden optimizado
      currentOptimizedRoute.optimized_route.stops.forEach((stop: any) => {
        if (stop.order.deliveryLocation.lat && stop.order.deliveryLocation.lng) {
          coordinates += `;${stop.order.deliveryLocation.lng},${stop.order.deliveryLocation.lat}`;
        }
      });
      
      // Agregar regreso a sucursal
      coordinates += `;${pickupLocation.lng},${pickupLocation.lat}`;

      const baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';
      const profile = 'driving';
      
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
        setOptimizedRoute(route);
        setShowOptimizedRoute(true);
        
        // Mostrar la ruta optimizada en el mapa
        displayOptimizedRouteWithGeometry(route);
        
        // Ajustar vista para mostrar toda la ruta
        fitMapToOptimizedRouteWithGeometry(route);
      } else {
        throw new Error('No se pudo generar la ruta optimizada');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearOptimizedRoute = () => {
    if (!map) return;

    // Remover capa de ruta optimizada
    if (map.getLayer('optimized-route-layer')) {
      map.removeLayer('optimized-route-layer');
    }
    if (map.getSource('optimized-route')) {
      map.removeSource('optimized-route');
    }

    // Limpiar marcadores numerados
    const markersToRemove: any[] = [];
    map._markers?.forEach((marker: any) => {
      if (marker._lngLat) {
        const isPickup = marker._lngLat.lng === pickupLocation.lng && 
                        marker._lngLat.lat === pickupLocation.lat;
        if (!isPickup) {
          markersToRemove.push(marker);
        }
      }
    });

    markersToRemove.forEach(marker => marker.remove());

    setShowOptimizedRoute(false);
    setOptimizedRoute(null);
  };

  const fitMapToAllRoutes = () => {
    if (!map || selectedOrders.length === 0) return;

    try {
      const bounds = new window.mapboxgl.LngLatBounds();
      
      bounds.extend([pickupLocation.lng, pickupLocation.lat]);
      
      selectedOrders.forEach(orderId => {
        const order = orders.find(o => o.id === orderId);
        if (order && order.deliveryLocation.lat && order.deliveryLocation.lng) {
          bounds.extend([order.deliveryLocation.lng, order.deliveryLocation.lat]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      map.setCenter([pickupLocation.lng, pickupLocation.lat]);
      map.setZoom(12);
    }
  };

  const clearAllRoutes = () => {
    if (!map) return;

    // Limpiar todas las capas de rutas
    const layersToRemove: string[] = [];
    map.getStyle().layers?.forEach((layer: any) => {
      if (layer.id.startsWith('route-')) {
        layersToRemove.push(layer.id);
      }
    });

    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      const sourceId = layerId.replace('route-', 'source-');
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });

    // Limpiar todos los marcadores excepto el de pickup
    const markersToRemove: any[] = [];
    map._markers?.forEach((marker: any) => {
      if (marker._lngLat) {
        const isPickup = marker._lngLat.lng === pickupLocation.lng && 
                        marker._lngLat.lat === pickupLocation.lat;
        if (!isPickup) {
          markersToRemove.push(marker);
        }
      }
    });

    markersToRemove.forEach(marker => marker.remove());
  };

  const clearError = () => setError(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
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
            {showOptimizedRoute ? 'Ruta Optimizada' : 'Mapa de Rutas Individuales'}
          </h3>
          <p className="text-sm text-gray-600">
            {showOptimizedRoute 
              ? `Ruta optimizada con ${selectedOrders.length} paradas`
              : selectedOrders.length > 0 
                ? `${selectedOrders.length} pedido(s) seleccionado(s)`
                : 'Selecciona pedidos para ver sus rutas'
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          

        </div>
      </div>

      {/* Información de la ruta optimizada */}
      {showOptimizedRoute && optimizedRoute && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatDistance(optimizedRoute.distance)}
              </div>
              <div className="text-sm text-green-700">Distancia Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatDuration(optimizedRoute.duration)}
              </div>
              <div className="text-sm text-green-700">Tiempo Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {selectedOrders.length}
              </div>
              <div className="text-sm text-green-700">Paradas</div>
            </div>
          </div>
        </div>
      )}

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

            {/* Loading overlay para optimización */}
            {isOptimizing && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Optimizando ruta...</p>
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
              <h4 className="text-sm font-medium text-gray-900">
                {showOptimizedRoute ? 'Paradas de la Ruta' : 'Pedidos'}
              </h4>
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  {showOptimizedRoute && optimizedRoute 
                    ? `${optimizedRoute.optimizedOrderSequence.length} paradas`
                    : `${selectedOrders.length} de ${orders.length}`
                  }
                </div>
              </div>
            </div>

            {/* Búsqueda */}
            {!showOptimizedRoute && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Buscar pedidos..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Botón seleccionar todo */}
            {!showOptimizedRoute && (
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
            )}

            {/* Lista de pedidos */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {showOptimizedRoute && optimizedRoute ? (
                // Mostrar solo los pedidos optimizados en el orden correcto
                optimizedRoute.optimizedOrderSequence.map(({ order, stopNumber }) => {
                  const stopColor = generateStopColor(stopNumber, optimizedRoute.optimizedOrderSequence.length);
                  
                  return (
                    <div
                      key={order.id}
                      className="p-3 rounded-lg border"
                      style={{ 
                        borderColor: stopColor,
                        backgroundColor: `${stopColor}10` // 10% de opacidad del color
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-6 h-6 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5"
                          style={{ backgroundColor: stopColor }}
                        >
                          {stopNumber}
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
                })
              ) : (
                // Mostrar todos los pedidos filtrados en modo normal
                filteredOrders.map((order) => {
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
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda de colores */}
      {selectedOrders.length > 0 && !showOptimizedRoute && (
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

      {/* Información adicional de la ruta optimizada */}
      {showOptimizedRoute && optimizedRoute && (
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-3">Detalles de la Ruta Optimizada:</h4>
          <div className="text-xs text-green-700 space-y-1">
            <p>• La ruta comienza y termina en la sucursal</p>
            <p>• Los pedidos se visitan en el orden más eficiente</p>
            <p>• El tiempo incluye el tiempo de conducción entre paradas</p>
            <p>• La distancia total considera el regreso a la sucursal</p>
          </div>
        </div>
      )}

      {/* Mapa de Ruta Optimizada - Se muestra debajo del mapa principal */}
      {isShowingOptimizedRoute && externalOptimizedRoute && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🚀</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Ruta Optimizada con IA
                </h3>
                <p className="text-sm text-gray-600">
                  Algoritmo: {externalOptimizedRoute.optimized_route.optimization_metrics.algorithm}
                </p>
              </div>
            </div>
          </div>
          
          {/* Métricas principales en tarjetas elegantes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-700">
                  {externalOptimizedRoute.optimized_route.stops.length}
                </div>
                <div className="text-sm font-medium text-green-800">Paradas</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {externalOptimizedRoute.optimized_route.total_distance.toFixed(1)}
                </div>
                <div className="text-sm font-medium text-blue-800">km Total</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-700">
                  {externalOptimizedRoute.optimized_route.total_time.toFixed(0)}
                </div>
                <div className="text-sm font-medium text-purple-800">min Total</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-700">
                  {externalOptimizedRoute.optimized_route.optimization_metrics.solver_time}
                </div>
                <div className="text-sm font-medium text-orange-800">ms Solver</div>
              </div>
            </div>
          </div>
          
          {/* Lista detallada de paradas con mejor diseño */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Secuencia de Paradas Optimizada
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {externalOptimizedRoute.optimized_route.stops.map((stop: any) => (
                <div key={stop.order.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-10 h-10 text-white text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: generateStopColor(stop.stop_number, externalOptimizedRoute.optimized_route.stops.length) }}
                    >
                      {stop.stop_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          #{stop.order.order_number}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          +{stop.distance_from_previous.toFixed(2)} km
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-1 line-clamp-2">
                        {stop.order.description}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        {stop.order.delivery_location.address}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 flex-shrink-0">
                      <div className="font-medium text-gray-700">
                        {stop.cumulative_distance.toFixed(2)} km
                      </div>
                      <div className="text-gray-500">acumulado</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Información adicional */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-sm font-medium text-gray-700">Información de la Optimización</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">Algoritmo:</span> {externalOptimizedRoute.optimized_route.optimization_metrics.algorithm}
              </div>
              <div>
                <span className="font-medium">Locaciones optimizadas:</span> {externalOptimizedRoute.optimized_route.optimization_metrics.locations_optimized}
              </div>
              <div>
                <span className="font-medium">Tiempo de procesamiento:</span> {externalOptimizedRoute.processing_time.toFixed(3)}s
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Funciones auxiliares para crear marcadores
function createNumberedMarker(stopNumber: number, color: string) {
  const el = document.createElement('div');
  el.className = 'numbered-marker';
  el.style.cssText = `
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: ${color};
    color: white;
    font-weight: bold;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  `;
  el.textContent = stopNumber.toString();
  return el;
}

function createPickupMarker() {
  const el = document.createElement('div');
  el.className = 'pickup-marker';
  el.style.cssText = `
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #3B82F6;
    color: white;
    font-weight: bold;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  `;
  el.innerHTML = '��';
  return el;
}
