'use client';

import React, { useState } from 'react';
import { OrderRouteOptimizer } from '@/components/ui/OrderRouteOptimizer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Package, MapPin, Route } from 'lucide-react';

// Datos de ejemplo - reemplaza con tus datos reales
const SAMPLE_ORDERS = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'Juan Pérez',
    deliveryAddress: 'Av. Corrientes 1234, Buenos Aires',
    deliveryLat: -34.6037,
    deliveryLng: -58.3816,
    status: 'pending'
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerName: 'María García',
    deliveryAddress: 'Calle Florida 567, Buenos Aires',
    deliveryLat: -34.6084,
    deliveryLng: -58.3731,
    status: 'pending'
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    customerName: 'Carlos López',
    deliveryAddress: 'Av. Santa Fe 890, Buenos Aires',
    deliveryLat: -34.5895,
    deliveryLng: -58.3814,
    status: 'pending'
  },
  {
    id: '4',
    orderNumber: 'ORD-004',
    customerName: 'Ana Martínez',
    deliveryAddress: 'Calle Lavalle 456, Buenos Aires',
    deliveryLat: -34.6087,
    deliveryLng: -58.3789,
    status: 'pending'
  }
];

// Ubicación de tu sucursal
const PICKUP_LOCATION = {
  lat: -34.6037,
  lng: -58.3816,
  address: 'Sucursal Centro - Av. 9 de Julio 123, Buenos Aires'
};

export function RouteOptimizationExample() {
  const [orders, setOrders] = useState(SAMPLE_ORDERS);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);

  const handleRouteOptimized = (route: any) => {
    setOptimizedRoute(route);
    console.log('Ruta optimizada:', route);
    
    // Aquí puedes hacer lo que necesites con la ruta optimizada:
    // - Guardarla en tu base de datos
    // - Enviarla a tu sistema de delivery
    // - Mostrar instrucciones al conductor
    // - etc.
  };

  const addSampleOrder = () => {
    const newOrder = {
      id: `order-${Date.now()}`,
      orderNumber: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
      customerName: `Cliente ${orders.length + 1}`,
      deliveryAddress: 'Nueva dirección de ejemplo',
      deliveryLat: -34.6037 + (Math.random() - 0.5) * 0.02,
      deliveryLng: -58.3816 + (Math.random() - 0.5) * 0.02,
      status: 'pending'
    };
    setOrders([...orders, newOrder]);
  };

  const clearOrders = () => {
    setOrders([]);
    setOptimizedRoute(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3 mb-4">
          <Route className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-blue-900">
              Optimización de Rutas para Pedidos
            </h1>
            <p className="text-blue-700">
              Optimiza la ruta de entrega para múltiples pedidos usando Mapbox
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={addSampleOrder} className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Agregar Pedido de Ejemplo
          </Button>
          <Button 
            onClick={clearOrders} 
            variant="outline"
            className="flex items-center gap-2"
          >
            Limpiar Pedidos
          </Button>
        </div>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-900">{orders.length}</div>
          <div className="text-sm text-blue-600">Total Pedidos</div>
        </Card>
        
        <Card className="p-4 text-center">
          <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">
            {orders.filter(o => o.deliveryLat && o.deliveryLng).length}
          </div>
          <div className="text-sm text-green-600">Con Ubicación</div>
        </Card>
        
        <Card className="p-4 text-center">
          <Route className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-900">
            {optimizedRoute ? 'Sí' : 'No'}
          </div>
          <div className="text-sm text-purple-600">Ruta Optimizada</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-600">?</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {optimizedRoute ? `${(optimizedRoute.totalDistance / 1000).toFixed(1)} km` : '-'}
          </div>
          <div className="text-sm text-gray-600">Distancia Total</div>
        </Card>
      </div>

      {/* Optimizador de rutas */}
      <OrderRouteOptimizer
        orders={orders}
        pickupLocation={PICKUP_LOCATION}
        onRouteOptimized={handleRouteOptimized}
      />

      {/* Información adicional */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ¿Cómo funciona la optimización?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Algoritmo de Optimización</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Usa el algoritmo TSP (Traveling Salesman Problem)</li>
              <li>• Considera tráfico y condiciones de la carretera</li>
              <li>• Optimiza para minimizar distancia y tiempo</li>
              <li>• Respeta restricciones de Mapbox</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Beneficios</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Reduce costos de combustible</li>
              <li>• Mejora tiempos de entrega</li>
              <li>• Optimiza recursos del conductor</li>
              <li>• Mejor experiencia del cliente</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
