'use client';

import React, { useEffect, useRef } from 'react';

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

interface MapMarkersProps {
  map: any;
  pickupLocation: Location;
  orders: Order[];
  selectedOrders: string[];
  onRouteLoaded?: () => void;
}

export function MapMarkers({
  map,
  pickupLocation,
  orders,
  selectedOrders,
  onRouteLoaded
}: MapMarkersProps) {
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

  const addPickupMarker = () => {
    // Limpiar marcador de pickup anterior si existe
    if (markersRef.current.has('pickup')) {
      markersRef.current.get('pickup').remove();
      markersRef.current.delete('pickup');
    }

    const pickupMarker = new window.mapboxgl.Marker({ 
      element: createCustomMarker('Sucursal', '#2563EB')
    })
      .setLngLat([pickupLocation.lng, pickupLocation.lat])
      .addTo(map);

    const popup = new window.mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="text-center">
          <div class="font-semibold text-blue-600">🏪 Sucursal</div>
          <div class="text-sm text-gray-600">${pickupLocation.address}</div>
        </div>
      `);
    pickupMarker.setPopup(popup);

    markersRef.current.set('pickup', pickupMarker);
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

      const token = window.mapboxgl.accessToken;
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
        
        // Limpiar ruta anterior si existe
        if (routesRef.current.has(routeId)) {
          if (map.getLayer(routeId)) {
            map.removeLayer(routeId);
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
          routesRef.current.delete(routeId);
        }
        
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

        routesRef.current.set(routeId, { sourceId, routeId });

        // Agregar marcador de entrega
        const markerId = `order-${order.id}`;
        
        // Limpiar marcador anterior si existe
        if (markersRef.current.has(markerId)) {
          markersRef.current.get(markerId).remove();
          markersRef.current.delete(markerId);
        }

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

        markersRef.current.set(markerId, marker);
      }

    } catch (error) {
      console.error(`Error cargando ruta para pedido ${order.orderNumber}:`, error);
    }
  };

  const clearAllRoutes = () => {
    // Limpiar todas las capas de rutas
    routesRef.current.forEach((routeInfo, routeId) => {
      if (map.getLayer(routeId)) {
        map.removeLayer(routeId);
      }
      if (map.getSource(routeInfo.sourceId)) {
        map.removeSource(routeInfo.sourceId);
      }
    });
    routesRef.current.clear();

    // Limpiar todos los marcadores excepto el de pickup
    markersRef.current.forEach((marker, markerId) => {
      if (markerId !== 'pickup') {
        marker.remove();
      }
    });
    
    // Mantener solo el marcador de pickup
    const pickupMarker = markersRef.current.get('pickup');
    markersRef.current.clear();
    if (pickupMarker) {
      markersRef.current.set('pickup', pickupMarker);
    }
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

  // Cargar marcador de pickup cuando el mapa esté listo
  useEffect(() => {
    if (map && pickupLocation) {
      addPickupMarker();
    }
  }, [map, pickupLocation]);

  // Cargar rutas cuando cambien los pedidos seleccionados
  useEffect(() => {
    if (!map || selectedOrders.length === 0) {
      clearAllRoutes();
      return;
    }

    const loadAllRoutes = async () => {
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
      
      if (onRouteLoaded) {
        onRouteLoaded();
      }
    };

    loadAllRoutes();
  }, [map, selectedOrders, orders, pickupLocation]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      
      routesRef.current.forEach((routeInfo, routeId) => {
        if (map && map.getLayer(routeId)) {
          map.removeLayer(routeId);
        }
        if (map && map.getSource(routeInfo.sourceId)) {
          map.removeSource(routeInfo.sourceId);
        }
      });
      routesRef.current.clear();
    };
  }, [map]);

  return null; // Este componente no renderiza nada visual
}
