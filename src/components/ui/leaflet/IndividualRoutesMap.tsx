'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap } from 'react-leaflet';

// Importar Leaflet dinámicamente
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });
// useMap no se puede importar dinámicamente, se usa directamente

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

interface Order {
  id: string;
  orderNumber: string;
  description?: string;
  totalAmount: number;
  deliveryLocation: Location;
  pickupLocation?: Location;
  status: string;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  // Generar color único para cada pedido
  const getOrderColor = (orderId: string) => {
    const colors = [
      '#3B82F6', // Azul
      '#10B981', // Verde
      '#F59E0B', // Amarillo
      '#EF4444', // Rojo
      '#8B5CF6', // Púrpura
      '#F97316', // Naranja
      '#06B6D4', // Cian
      '#84CC16', // Lima
      '#EC4899', // Rosa
      '#6366F1', // Índigo
      '#14B8A6', // Teal
      '#F43F5E', // Rose
      '#8B5A2B', // Brown
      '#6B7280', // Gray
      '#DC2626'  // Red-600
    ];
    
    let hash = 0;
    for (let i = 0; i < orderId.length; i++) {
      const char = orderId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const filteredOrders = orders.filter(order => {
    // Solo mostrar pedidos que tengan tanto delivery como pickup location
    const hasBothLocations = order.deliveryLocation && order.pickupLocation;
    
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryLocation.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return hasBothLocations && matchesSearch;
  });


  // Calcular centro del mapa basado en pickup y pedidos seleccionados
  const getMapCenter = (): [number, number] => {
    if (filteredOrders.length === 0) {
      return [14.6349, -90.5069]; // Guatemala City por defecto
    }

    const allLocations = filteredOrders.flatMap(order => [
      { lat: order.deliveryLocation.lat, lng: order.deliveryLocation.lng },
      ...(order.pickupLocation ? [{ lat: order.pickupLocation.lat, lng: order.pickupLocation.lng }] : [])
    ]);

    if (allLocations.length === 0) {
      return [14.6349, -90.5069]; // Guatemala City por defecto
    }

    const avgLat = allLocations.reduce((sum, loc) => sum + loc.lat, 0) / allLocations.length;
    const avgLng = allLocations.reduce((sum, loc) => sum + loc.lng, 0) / allLocations.length;

    return [avgLat, avgLng];
  };

  const mapCenter = getMapCenter();

  return (
    <div className="h-full flex flex-col">
      {/* Controles superiores */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pedidos con Pickup y Delivery</h3>
          <div className="flex space-x-2">
            <Button
              onClick={onSelectAll}
              variant="outline"
              size="sm"
            >
              Seleccionar Todos
            </Button>
            <Button
              onClick={onClearAll}
              variant="outline"
              size="sm"
            >
              Limpiar
            </Button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar pedidos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%', minHeight: '400px' }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Marcador de pickup */}

          {/* Líneas que conectan pickup y delivery de cada pedido */}
          {filteredOrders.map((order) => {
            if (!order.pickupLocation) return null;
            const orderColor = getOrderColor(order.id);
            const isSelected = selectedOrders.includes(order.id);
            
            return (
              <Polyline
                key={`line-${order.id}`}
                positions={[
                  [order.pickupLocation.lat, order.pickupLocation.lng],
                  [order.deliveryLocation.lat, order.deliveryLocation.lng]
                ]}
                color={orderColor}
                weight={isSelected ? 4 : 2}
                opacity={isSelected ? 0.8 : 0.6}
                dashArray={isSelected ? undefined : "5, 5"}
              />
            );
          })}

          {/* Marcadores de pedidos - Delivery */}
          {filteredOrders.map((order) => {
            const isSelected = selectedOrders.includes(order.id);
            const orderColor = getOrderColor(order.id);
            
            return (
              <Marker
                key={`delivery-${order.id}`}
                position={[order.deliveryLocation.lat, order.deliveryLocation.lng]}
              >
                <Popup>
                  <div className="text-center min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">Pedido #{order.orderNumber}</span>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onOrderSelection(order.id)}
                      />
                    </div>
                    {order.description && (
                      <p className="text-xs text-gray-600 mb-2">{order.description}</p>
                    )}
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Entrega: {order.deliveryLocation.address}</p>
                    {order.pickupLocation && (
                      <p className="text-xs text-gray-500 mt-1">Recogida: {order.pickupLocation.address}</p>
                    )}
                    <div 
                      className="mt-2 w-full h-2 rounded"
                      style={{ backgroundColor: orderColor }}
                    ></div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcadores de pedidos - Pickup */}
          {filteredOrders.map((order) => {
            if (!order.pickupLocation) return null;
            const isSelected = selectedOrders.includes(order.id);
            const orderColor = getOrderColor(order.id);
            
            return (
              <Marker
                key={`pickup-${order.id}`}
                position={[order.pickupLocation.lat, order.pickupLocation.lng]}
              >
                <Popup>
                  <div className="text-center min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">Pedido #{order.orderNumber}</span>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onOrderSelection(order.id)}
                      />
                    </div>
                    {order.description && (
                      <p className="text-xs text-gray-600 mb-2">{order.description}</p>
                    )}
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Recogida: {order.pickupLocation.address}</p>
                    <p className="text-xs text-gray-500 mt-1">Entrega: {order.deliveryLocation.address}</p>
                    <div 
                      className="mt-2 w-full h-2 rounded"
                      style={{ backgroundColor: orderColor }}
                    ></div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        </MapContainer>
      </div>

      {/* Lista de pedidos */}
      <div className="p-4 border-t bg-white max-h-48 overflow-y-auto">
        <h4 className="font-medium mb-3">Pedidos ({filteredOrders.length})</h4>
        <div className="space-y-2">
          {filteredOrders.map((order) => {
            const isSelected = selectedOrders.includes(order.id);
            const orderColor = getOrderColor(order.id);
            
            return (
              <div
                key={order.id}
                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => onOrderSelection(order.id)}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox checked={isSelected} onChange={() => onOrderSelection(order.id)} />
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: orderColor }}
                    ></div>
                    <div>
                      <p className="font-medium text-sm">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-600">{order.deliveryLocation.address}</p>
                      {order.pickupLocation && (
                        <p className="text-xs text-gray-500">
                          Recogida: {order.pickupLocation.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm text-green-600">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500">{order.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
