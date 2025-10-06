'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AlertCircle, Package, Truck, Navigation, Clock, DollarSign, Route } from 'lucide-react';
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

// Componente para manejar clics en el mapa para seleccionar ubicación inicial
function MapClickHandler({ onStartLocationSelect }: { onStartLocationSelect: (location: Location) => void }) {
  const map = useMap();
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (map) {
      setIsMapReady(true);
    }
  }, [map]);

  useEffect(() => {
    if (!isMapReady || !map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      try {
        // Reverse geocoding para obtener la dirección
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const data = await response.json();
        
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        const location: Location = { lat, lng, address };
        
        onStartLocationSelect(location);
      } catch (error) {
        console.error('Error en reverse geocoding:', error);
        const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        const location: Location = { lat, lng, address };
        onStartLocationSelect(location);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isMapReady, map, onStartLocationSelect]);

  return null; // Este componente no renderiza nada, solo maneja la lógica
}

// Fix para iconos de Leaflet en Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Crear iconos personalizados
const createCustomIcon = (color: string, icon: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">${icon}</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

// Iconos específicos
const pickupIcon = createCustomIcon('#3B82F6', '🚛'); // Azul para pickup (camioncito)
const deliveryIcon = createCustomIcon('#EF4444', '🏁'); // Rojo para delivery (banderita)
const startLocationIcon = createCustomIcon('#10B981', '🚀'); // Verde para ubicación inicial

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
  startLocation?: Location | null;
  onStartLocationSelect?: (location: Location) => void;
  optimizationMode?: 'efficiency' | 'order';
  onOptimizationModeChange?: (mode: 'efficiency' | 'order') => void;
  colors?: {
    buttonPrimary1: string;
    buttonPrimary2: string;
    background2: string;
    background3: string;
    border: string;
    buttonText: string;
  };
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
  startLocation,
  onStartLocationSelect,
  optimizationMode = 'efficiency',
  onOptimizationModeChange,
  colors,
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

  // Solo mostrar pedidos seleccionados que tengan tanto delivery como pickup location
  const filteredOrders = orders.filter(order => {
    const isSelected = selectedOrders.includes(order.id);
    const hasBothLocations = order.deliveryLocation && order.pickupLocation;
    
    return isSelected && hasBothLocations;
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
      {/* Header mejorado */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Rutas de Pedidos</h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedOrders.length} de {orders.filter(order => order.deliveryLocation && order.pickupLocation).length} pedidos seleccionados
            </p>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative bg-gray-100">
        {filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos seleccionados</h3>
              <p className="text-sm text-gray-600">Selecciona pedidos de la lista para ver sus rutas en el mapa</p>
            </div>
          </div>
        ) : (
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
                icon={deliveryIcon}
              >
                <Popup>
                  <div className="min-w-[200px] p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">Pedido #{order.orderNumber}</span>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onOrderSelection(order.id)}
                      />
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fin:</p>
                      <p className="text-sm text-gray-700">{order.deliveryLocation.address}</p>
                    </div>
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
                icon={pickupIcon}
              >
                <Popup>
                  <div className="min-w-[200px] p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">Pedido #{order.orderNumber}</span>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onOrderSelection(order.id)}
                      />
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Inicio:</p>
                      <p className="text-sm text-gray-700">{order.pickupLocation.address}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcador de ubicación inicial */}
          {startLocation && (
            <Marker 
              position={[startLocation.lat, startLocation.lng]}
              icon={startLocationIcon}
            >
              <Popup>
                <div className="min-w-[200px] p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-sm text-gray-800">Ubicación Inicial</span>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Dirección:</p>
                    <p className="text-sm text-gray-700">{startLocation.address}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Lógica de selección de ubicación inicial */}
          {onStartLocationSelect && <MapClickHandler onStartLocationSelect={onStartLocationSelect} />}

          </MapContainer>
        )}
      </div>

      {/* Modo de optimización */}
      {onOptimizationModeChange && colors && (
        <div className="p-4 border-t bg-white">
          <h4 className="text-sm font-semibold text-gray-900 text-center mb-3">Modo de optimización</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Modo Eficiencia */}
            <div 
              className={`p-2 border-2 rounded-lg cursor-pointer transition-all duration-200`}
              style={{
                borderColor: optimizationMode === 'efficiency' ? colors.buttonPrimary1 : colors.border,
                backgroundColor: optimizationMode === 'efficiency' ? colors.background2 : colors.background3,
                boxShadow: optimizationMode === 'efficiency' ? `0 0 0 2px ${colors.buttonPrimary2}33` : undefined
              }}
              onClick={() => onOptimizationModeChange('efficiency')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4" style={{ color: colors.buttonPrimary1 }} />
                  <span className="font-medium text-sm">Mejor Eficiencia</span>
                </div>
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={{ 
                  borderColor: optimizationMode === 'efficiency' ? colors.buttonPrimary1 : colors.border, 
                  backgroundColor: optimizationMode === 'efficiency' ? colors.buttonPrimary1 : 'transparent' 
                }}>
                  {optimizationMode === 'efficiency' && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.buttonText }}></div>
                  )}
                </div>
              </div>
            </div>

            {/* Modo Orden */}
            <div 
              className={`p-2 border-2 rounded-lg cursor-pointer transition-all duration-200`}
              style={{
                borderColor: optimizationMode === 'order' ? colors.buttonPrimary1 : colors.border,
                backgroundColor: optimizationMode === 'order' ? colors.background2 : colors.background3,
                boxShadow: optimizationMode === 'order' ? `0 0 0 2px ${colors.buttonPrimary2}33` : undefined
              }}
              onClick={() => onOptimizationModeChange('order')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" style={{ color: colors.buttonPrimary1 }} />
                  <span className="font-medium text-sm">Orden de Llegada</span>
                </div>
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={{ 
                  borderColor: optimizationMode === 'order' ? colors.buttonPrimary1 : colors.border, 
                  backgroundColor: optimizationMode === 'order' ? colors.buttonPrimary1 : 'transparent' 
                }}>
                  {optimizationMode === 'order' && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.buttonText }}></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de pedidos */}
      <div className="p-4 border-t bg-white">
        <h4 className="font-medium mb-3">
          Últimos Pedidos ({Math.min(orders.filter(order => order.deliveryLocation && order.pickupLocation).length, 20)} de {orders.filter(order => order.deliveryLocation && order.pickupLocation).length})
        </h4>
        <div className="space-y-2">
          {orders
            .filter(order => order.deliveryLocation && order.pickupLocation)
            .slice(-20) // Mostrar solo los últimos 20 pedidos
            .map((order) => {
              const isSelected = selectedOrders.includes(order.id);
              const orderColor = getOrderColor(order.id);
              
              return (
                <div
                  key={order.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                  onClick={() => onOrderSelection(order.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      checked={isSelected} 
                      onChange={() => onOrderSelection(order.id)}
                      className="flex-shrink-0"
                    />
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: orderColor }}
                      ></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-600 truncate">{order.deliveryLocation.address}</p>
                        {order.pickupLocation && (
                          <p className="text-xs text-gray-500 truncate">
                            Recogida: {order.pickupLocation.address}
                          </p>
                        )}
                        {order.description && (
                          <p className="text-xs text-gray-500 truncate mt-1">{order.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm text-green-600">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{order.status}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
