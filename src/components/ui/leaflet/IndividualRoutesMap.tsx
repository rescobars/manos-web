'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AlertCircle, Package, Truck, Navigation, Clock, DollarSign, Route } from 'lucide-react';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap } from 'react-leaflet';
import { useDriverPositions } from '@/hooks/useDriverPositions';

// Importar Leaflet dinámicamente
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });
// useMap no se puede importar dinámicamente, se usa directamente

// Componente para manejar los marcadores de drivers
function DriverMarkers() {
  const map = useMap();
  const [isMapReady, setIsMapReady] = useState(false);
  const [addedLayers, setAddedLayers] = useState<L.Layer[]>([]);
  const { driverPositions, loading } = useDriverPositions();

  // Marcar mapa como listo
  useEffect(() => {
    if (map) {
      setIsMapReady(true);
    }
  }, [map]);

  // Limpiar capas existentes
  const clearMap = () => {
    addedLayers.forEach(layer => {
      if (map && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    setAddedLayers([]);
  };

  // Mostrar drivers en el mapa
  useEffect(() => {
    if (!isMapReady || !map || loading) {
      return;
    }

    clearMap();

    const newLayers: L.Layer[] = [];

    driverPositions.forEach((driver) => {
      if (driver.location.latitude && driver.location.longitude) {
        const driverMarker = L.marker([driver.location.latitude, driver.location.longitude], {
          icon: L.divIcon({
            className: 'driver-marker',
            html: `
              <div class="bg-blue-500 border-2 border-white rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                🚗
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(map);

        // Crear popup con información del driver
        const popupContent = `
          <div class="text-center min-w-[200px]">
            <div class="font-semibold text-sm mb-2">Conductor</div>
            <div class="text-xs text-gray-600 mb-2">${driver.driverName || 'Sin nombre'}</div>
            <div class="text-xs text-gray-500 mb-1">ID: ${driver.driverId}</div>
            <div class="text-xs text-gray-500 mb-1">Estado: ${driver.status}</div>
            <div class="text-xs text-gray-500 mb-1">Última actualización: ${new Date(driver.timestamp).toLocaleTimeString()}</div>
            <div class="text-xs text-gray-500">${driver.location.latitude.toFixed(6)}, ${driver.location.longitude.toFixed(6)}</div>
          </div>
        `;

        driverMarker.bindPopup(popupContent);
        newLayers.push(driverMarker);
      }
    });

    setAddedLayers(newLayers);
  }, [isMapReady, map, driverPositions, loading]);

  return null; // Este componente no renderiza nada, solo maneja la lógica
}

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
        width: 40px;
        height: 40px;
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
          font-size: 18px;
          font-weight: bold;
        ">${icon}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
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
  const { driverPositions, loading: driversLoading } = useDriverPositions();

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
      {/* Header compacto */}
      <div className="p-2 sm:p-4 border-b theme-bg-2 theme-border" style={{ backgroundColor: 'var(--theme-bg-2)', borderColor: 'var(--theme-border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-lg font-semibold theme-text-primary truncate" style={{ color: 'var(--theme-text-primary)' }}>Rutas de Pedidos</h3>
            <p className="text-xs sm:text-sm theme-text-secondary mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
              {selectedOrders.length} de {orders.filter(order => order.deliveryLocation && order.pickupLocation).length} pedidos seleccionados
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span className="text-xs theme-text-secondary whitespace-nowrap" style={{ color: 'var(--theme-text-secondary)' }}>
                {driversLoading ? 'Cargando...' : `${driverPositions.length} conductores activos`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="h-96 sm:h-[28rem] lg:h-[32rem] relative theme-bg-2" style={{ backgroundColor: 'var(--theme-bg-2)' }}>
        {filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full theme-bg-3" style={{ backgroundColor: 'var(--theme-bg-3)' }}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full theme-bg-2 flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg-2)' }}>
                <MapPin className="w-8 h-8 theme-text-muted" style={{ color: 'var(--theme-text-muted)' }} />
              </div>
              <h3 className="text-lg font-medium theme-text-primary mb-2" style={{ color: 'var(--theme-text-primary)' }}>No hay pedidos seleccionados</h3>
              <p className="text-sm theme-text-secondary" style={{ color: 'var(--theme-text-secondary)' }}>Selecciona pedidos de la lista para ver sus rutas en el mapa</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Marcadores de drivers */}
          <DriverMarkers />
          
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
                      <p className="text-xs theme-text-muted mb-1" style={{ color: 'var(--theme-text-muted)' }}>Fin:</p>
                      <p className="text-sm theme-text-primary" style={{ color: 'var(--theme-text-primary)' }}>{order.deliveryLocation.address}</p>
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
                      <p className="text-xs theme-text-muted mb-1" style={{ color: 'var(--theme-text-muted)' }}>Inicio:</p>
                      <p className="text-sm theme-text-primary" style={{ color: 'var(--theme-text-primary)' }}>{order.pickupLocation.address}</p>
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
                    <span className="font-semibold text-sm theme-text-primary" style={{ color: 'var(--theme-text-primary)' }}>Ubicación Inicial</span>
                  </div>
                  
                  <div>
                    <p className="text-xs theme-text-muted mb-1" style={{ color: 'var(--theme-text-muted)' }}>Dirección:</p>
                    <p className="text-sm theme-text-primary" style={{ color: 'var(--theme-text-primary)' }}>{startLocation.address}</p>
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
        <div className="p-4 border-t theme-bg-3 theme-border" style={{ backgroundColor: 'var(--theme-bg-3)', borderColor: 'var(--theme-border)' }}>
          <h4 className="text-sm font-semibold theme-text-primary text-center mb-3" style={{ color: 'var(--theme-text-primary)' }}>Modo de optimización</h4>
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
      <div className="p-4 border-t theme-bg-3 theme-border" style={{ backgroundColor: 'var(--theme-bg-3)', borderColor: 'var(--theme-border)' }}>
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
                      ? 'theme-bg-2 theme-border shadow-sm' 
                      : 'theme-bg-3 theme-border hover:theme-bg-2 hover:theme-border'
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
                        <p className="font-medium text-sm theme-text-primary" style={{ color: 'var(--theme-text-primary)' }}>#{order.orderNumber}</p>
                        <p className="text-xs theme-text-secondary truncate" style={{ color: 'var(--theme-text-secondary)' }}>{order.deliveryLocation.address}</p>
                        {order.pickupLocation && (
                          <p className="text-xs theme-text-muted truncate" style={{ color: 'var(--theme-text-muted)' }}>
                            Recogida: {order.pickupLocation.address}
                          </p>
                        )}
                        {order.description && (
                          <p className="text-xs theme-text-muted truncate mt-1" style={{ color: 'var(--theme-text-muted)' }}>{order.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm theme-success" style={{ color: 'var(--theme-success)' }}>
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-xs theme-text-muted capitalize" style={{ color: 'var(--theme-text-muted)' }}>{order.status}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
