'use client';

import React, { useState, useMemo } from 'react';
import { Route, MapPin, Package, Clock, Car } from 'lucide-react';
import { Button } from './Button';
import { OptimizedRouteMap } from './OptimizedRouteMap';
import { Card } from './Card';

interface Order {
  id: string;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  customerName: string;
  orderNumber: string;
  status: string;
  // Otros campos del pedido...
}

interface OrderRouteOptimizerProps {
  orders: Order[];
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  onRouteOptimized?: (optimizedRoute: any) => void;
}

export function OrderRouteOptimizer({
  orders,
  pickupLocation,
  onRouteOptimized
}: OrderRouteOptimizerProps) {
  const [showMap, setShowMap] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);

  // Filtrar solo pedidos con ubicación válida
  const validOrders = useMemo(() => {
    return orders.filter(order => 
      order.deliveryLat && 
      order.deliveryLng && 
      order.deliveryAddress
    );
  }, [orders]);

  // Convertir pedidos a formato de ubicación
  const deliveryLocations = useMemo(() => {
    return validOrders.map(order => ({
      lat: order.deliveryLat,
      lng: order.deliveryLng,
      address: order.deliveryAddress,
      id: order.id
    }));
  }, [validOrders]);

  const handleRouteOptimized = (route: any) => {
    setOptimizedRoute(route);
    onRouteOptimized?.(route);
  };

  const getRouteSummary = (route: any) => {
    if (!route) return null;
    
    const totalKm = (route.totalDistance / 1000).toFixed(1);
    const totalHours = Math.floor(route.totalDuration / 3600);
    const totalMinutes = Math.floor((route.totalDuration % 3600) / 60);
    
    return {
      totalDistance: `${totalKm} km`,
      totalDuration: totalHours > 0 
        ? `${totalHours}h ${totalMinutes}m`
        : `${totalMinutes}m`,
      waypointCount: route.waypoints.length
    };
  };

  const routeSummary = getRouteSummary(optimizedRoute);

  if (validOrders.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin pedidos para optimizar</h3>
        <p className="text-gray-500">
          No hay pedidos con ubicaciones válidas para optimizar la ruta.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de pedidos */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Optimización de Ruta para Pedidos
          </h3>
          <Button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2"
          >
            <Route className="w-4 h-4" />
            {showMap ? 'Ocultar Mapa' : 'Mostrar Mapa'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm text-blue-600">Total Pedidos</div>
              <div className="font-semibold text-blue-800">{validOrders.length}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <MapPin className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm text-green-600">Puntos de Entrega</div>
              <div className="font-semibold text-green-800">{deliveryLocations.length}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Clock className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-sm text-purple-600">Estado</div>
              <div className="font-semibold text-purple-800">
                {optimizedRoute ? 'Ruta Optimizada' : 'Sin Optimizar'}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Pedidos en la Ruta:</h4>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {validOrders.map((order, index) => (
              <div 
                key={order.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                  <span className="text-gray-600">- {order.customerName}</span>
                </div>
                <span className="text-gray-500 text-xs">{order.deliveryAddress}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Resumen de la ruta optimizada */}
      {routeSummary && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Route className="w-5 h-5" />
            Ruta Optimizada
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
              <Car className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-blue-600">Distancia Total</div>
                <div className="font-semibold text-blue-800">{routeSummary.totalDistance}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-blue-600">Tiempo Estimado</div>
                <div className="font-semibold text-blue-800">{routeSummary.totalDuration}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-blue-600">Paradas</div>
                <div className="font-semibold text-blue-800">{routeSummary.waypointCount}</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Mapa de optimización */}
      {showMap && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Mapa de Ruta Optimizada
          </h3>
          <OptimizedRouteMap
            pickupLocation={pickupLocation}
            deliveryLocations={deliveryLocations}
            onRouteOptimized={handleRouteOptimized}
          />
        </Card>
      )}
    </div>
  );
}
