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

  // Cargar pedidos y ubicación de pickup
  useEffect(() => {
    if (currentOrganization) {
      loadData();
    }
  }, [currentOrganization]);

  const loadData = async () => {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      
      // Cargar pedidos pendientes
      const response = await ordersApiService.getPendingOrders(currentOrganization.uuid);
      if (response.success && response.data) {
        const validOrders = response.data.filter(order => 
          order.delivery_lat && order.delivery_lat !== 0 && 
          order.delivery_lng && order.delivery_lng !== 0
        );
        setOrders(validOrders);
        
        // Seleccionar automáticamente todos los pedidos válidos
        const validOrderIds = validOrders.map(order => order.uuid);
        setSelectedOrders(validOrderIds);
      }
      
      // Cargar ubicación de pickup
      setPickupLocation({
        lat: BRANCH_LOCATION.lat,
        lng: BRANCH_LOCATION.lng,
        address: BRANCH_LOCATION.address
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAll = () => {
    const validOrderIds = orders.map(order => order.uuid);
    
    if (selectedOrders.length === validOrderIds.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(validOrderIds);
    }
  };

  const handleClearAll = () => {
    setSelectedOrders([]);
  };

  const getOrdersForMap = () => {
    return orders.map(order => ({
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Page
        title="Visualización de Rutas"
        subtitle={`Visualiza rutas individuales de pedidos para ${currentOrganization.name}`}
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {selectedOrders.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span>{selectedOrders.length} pedidos seleccionados</span>
              </div>
            </div>
          )}
          
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
