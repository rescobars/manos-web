'use client';

import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Order } from '@/lib/leaflet/types';
import { 
  createOrderIcon, 
  createPickupIcon,
  generateOrderColor 
} from '@/lib/leaflet/utils';

interface OrderMarkersProps {
  orders: Order[];
  selectedOrders: string[];
  pickupLocation?: { lat: number; lng: number; address: string };
  onOrderClick?: (order: Order) => void;
  onPickupClick?: () => void;
}

export function OrderMarkers({ 
  orders, 
  selectedOrders, 
  pickupLocation,
  onOrderClick,
  onPickupClick 
}: OrderMarkersProps) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Crear marcador para un pedido
  const createOrderMarker = (order: Order): L.Marker => {
    const isSelected = selectedOrders.includes(order.id);
    const color = generateOrderColor(order.id);
    const icon = createOrderIcon(order.orderNumber, color, isSelected);
    
    const marker = L.marker([order.deliveryLocation.lat, order.deliveryLocation.lng], { icon });
    
    // Agregar datos del pedido al marcador
    (marker as any).orderData = order;
    
    // Agregar evento de clic
    marker.on('click', () => {
      if (onOrderClick) {
        onOrderClick(order);
      }
    });
    
    // Agregar popup
    const popupContent = `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">Pedido #${order.orderNumber}</h3>
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">
          ${order.deliveryLocation.address}
        </p>
        ${order.description && (
          `<p style="margin: 0 0 4px 0; font-size: 12px; color: #888;">
            ${order.description}
          </p>`
        )}
        ${order.totalAmount && (
          `<p style="margin: 0; font-size: 12px; color: #888;">
            Total: $${order.totalAmount}
          </p>`
        )}
      </div>
    `;
    
    marker.bindPopup(popupContent);
    
    return marker;
  };

  // Crear marcador para ubicación de recogida
  const createPickupMarker = (): L.Marker => {
    const icon = createPickupIcon();
    const marker = L.marker([pickupLocation!.lat, pickupLocation!.lng], { icon });
    
    // Agregar evento de clic
    marker.on('click', () => {
      if (onPickupClick) {
        onPickupClick();
      }
    });
    
    // Agregar popup
    const popupContent = `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">Punto de Recogida</h3>
        <p style="margin: 0; font-size: 14px; color: #666;">
          ${pickupLocation!.address}
        </p>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    
    return marker;
  };

  // Actualizar marcadores existentes
  const updateExistingMarkers = () => {
    orders.forEach(order => {
      const markerId = `order-${order.id}`;
      const existingMarker = markersRef.current.get(markerId);
      
      if (existingMarker) {
        // Actualizar posición del marcador
        const newPosition = [order.deliveryLocation.lat, order.deliveryLocation.lng] as [number, number];
        existingMarker.setLatLng(newPosition);
        
        // Actualizar icono si cambió la selección
        const isSelected = selectedOrders.includes(order.id);
        const color = generateOrderColor(order.id);
        const newIcon = createOrderIcon(order.orderNumber, color, isSelected);
        existingMarker.setIcon(newIcon);
        
        // Actualizar datos del pedido
        (existingMarker as any).orderData = order;
      }
    });
  };

  // Limpiar marcadores que ya no están en la lista
  const cleanupMarkers = () => {
    const currentOrderIds = new Set(orders.map(order => order.id));
    
    markersRef.current.forEach((marker, markerId) => {
      if (markerId.startsWith('order-')) {
        const orderId = markerId.replace('order-', '');
        if (!currentOrderIds.has(orderId)) {
          map.removeLayer(marker);
          markersRef.current.delete(markerId);
        }
      }
    });
  };

  // Agregar nuevos marcadores
  const addNewMarkers = () => {
    orders.forEach(order => {
      const markerId = `order-${order.id}`;
      
      if (!markersRef.current.has(markerId)) {
        const marker = createOrderMarker(order);
        marker.addTo(map);
        markersRef.current.set(markerId, marker);
      }
    });
  };

  // Efecto principal para manejar marcadores de pedidos
  useEffect(() => {
    if (!map || orders.length === 0) {
      // Limpiar marcadores de pedidos si no hay pedidos
      markersRef.current.forEach((marker, markerId) => {
        if (markerId.startsWith('order-')) {
          map.removeLayer(marker);
          markersRef.current.delete(markerId);
        }
      });
      return;
    }

    // Limpiar marcadores que ya no están
    cleanupMarkers();
    
    // Actualizar marcadores existentes
    updateExistingMarkers();
    
    // Agregar nuevos marcadores
    addNewMarkers();
  }, [map, orders, selectedOrders]);

  // Efecto para manejar marcador de recogida
  useEffect(() => {
    if (!map || !pickupLocation) {
      // Remover marcador de recogida si no hay ubicación
      const pickupMarker = markersRef.current.get('pickup');
      if (pickupMarker) {
        map.removeLayer(pickupMarker);
        markersRef.current.delete('pickup');
      }
      return;
    }

    // Crear o actualizar marcador de recogida
    const existingPickupMarker = markersRef.current.get('pickup');
    if (existingPickupMarker) {
      existingPickupMarker.setLatLng([pickupLocation.lat, pickupLocation.lng]);
    } else {
      const pickupMarker = createPickupMarker();
      pickupMarker.addTo(map);
      markersRef.current.set('pickup', pickupMarker);
    }
  }, [map, pickupLocation]);

  // Limpiar marcadores al desmontar
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current.clear();
    };
  }, [map]);

  return null; // Este componente no renderiza nada visualmente
}
