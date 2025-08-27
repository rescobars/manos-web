'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApiService } from '@/lib/api/orders';
import { Order } from '@/types';
import { IndividualRoutesMap } from '@/components/ui/IndividualRoutesMap';
import { Page } from '@/components/ui/Page';
import { Route, AlertCircle } from 'lucide-react';
import { BRANCH_LOCATION } from '@/lib/constants';

interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

export default function RouteOptimizationPage() {
  const { currentOrganization } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);

  // Cargar pedidos pendientes y ubicación de pickup
  useEffect(() => {
    if (currentOrganization) {
      loadPendingOrders();
      loadPickupLocation();
    }
  }, [currentOrganization]);

  const loadPendingOrders = async () => {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      const response = await ordersApiService.getPendingOrders(currentOrganization.uuid);
      
      if (response.success && response.data) {
        setOrders(response.data);
      } else {
        console.error('Error loading pending orders:', response.error);
      }
    } catch (error) {
      console.error('Error loading pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPickupLocation = async () => {
    try {
      // Usar las coordenadas de la sucursal que ya están definidas en constants.ts
      setPickupLocation({
        lat: BRANCH_LOCATION.lat,
        lng: BRANCH_LOCATION.lng,
        address: BRANCH_LOCATION.address
      });
    } catch (error) {
      console.error('Error loading pickup location:', error);
    }
  };

  const handleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSelection = prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId];
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.uuid));
    }
  };

  const handleClearAll = () => {
    setSelectedOrders([]);
  };

  const getOrdersForMap = () => {
    const mappedOrders = orders
      .filter(order => order.delivery_lat && order.delivery_lng) // Solo pedidos con coordenadas válidas
      .map(order => ({
        id: order.uuid,
        orderNumber: order.order_number,
        deliveryLocation: {
          lat: order.delivery_lat!,
          lng: order.delivery_lng!,
          address: order.delivery_address || '',
          id: order.uuid
        },
        description: order.description,
        totalAmount: order.total_amount,
        createdAt: order.created_at
      }));
    
    return mappedOrders;
  };

  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Route className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Selecciona una organización</h1>
          <p className="text-gray-600">Necesitas seleccionar una organización para ver las rutas de pedidos</p>
        </div>
      </div>
    );
  }

  if (!pickupLocation) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Ubicación no configurada</h3>
        <p className="text-yellow-700">Configura la ubicación de tu sucursal para continuar.</p>
      </div>
    );
  }

  return (
    <>
      <Page
        title="Visualización de Rutas"
        subtitle={`Visualiza rutas individuales de pedidos para ${currentOrganization.name}`}
      >
        {/* Mapa de rutas con lista de pedidos integrada */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <IndividualRoutesMap
            pickupLocation={pickupLocation}
            orders={getOrdersForMap()}
            selectedOrders={selectedOrders}
            onOrderSelection={handleOrderSelection}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
      </Page>
    </>
  );
}
