'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { BaseMap, useMap, MapMarkers } from './mapbox';
import { isMapboxConfigured } from '@/lib/mapbox';
import { Location, Order } from './mapbox/types';

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
  
  const { map, isMapReady, handleMapReady } = useMap();

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

  // Mostrar loading cuando se seleccionen pedidos y el mapa esté listo
  useEffect(() => {
    if (isMapReady && selectedOrders.length > 0 && !routesLoaded) {
      setIsLoading(true);
    }
  }, [isMapReady, selectedOrders, routesLoaded]);

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
            <BaseMap
              center={[pickupLocation.lng, pickupLocation.lat]}
              zoom={12}
              className="w-full h-[600px] rounded-lg border border-gray-200"
              onMapReady={handleMapReady}
            >
              <MapMarkers
                map={map}
                pickupLocation={pickupLocation}
                orders={orders}
                selectedOrders={selectedOrders}
                onRouteLoaded={handleRouteLoaded}
              />
            </BaseMap>
            
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
