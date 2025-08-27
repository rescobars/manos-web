'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApiService } from '@/lib/api/orders';
import { Order } from '@/types';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { OptimizedRouteMap } from '@/components/ui/OptimizedRouteMap';
import { StatCard } from '@/components/ui/StatCard';
import { FilterBar } from '@/components/ui/FilterBar';
import { Page } from '@/components/ui/Page';
import { Package, MapPin, Route, Clock, Car, AlertCircle } from 'lucide-react';

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
  const [showRoute, setShowRoute] = useState(false);

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
      // Aquí deberías obtener la ubicación de tu sucursal desde la configuración
      // Por ahora uso una ubicación de ejemplo
      setPickupLocation({
        lat: -34.6037,
        lng: -58.3816,
        address: 'Sucursal Centro - Av. 9 de Julio 123, Buenos Aires'
      });
    } catch (error) {
      console.error('Error loading pickup location:', error);
    }
  };

  const handleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.uuid));
    }
  };

  const handleGenerateRoute = () => {
    if (selectedOrders.length === 0) return;
    setShowRoute(true);
  };

  const getSelectedOrdersData = () => {
    return orders.filter(order => selectedOrders.includes(order.uuid));
  };

  const getDeliveryLocations = () => {
    return getSelectedOrdersData().map(order => ({
      lat: order.delivery_lat || 0,
      lng: order.delivery_lng || 0,
      address: order.delivery_address || '',
      id: order.uuid
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.delivery_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const filterOptions = [
    { value: 'ALL', label: 'Todos los pedidos' },
    { value: 'WITH_LOCATION', label: 'Con ubicación' },
    { value: 'WITHOUT_LOCATION', label: 'Sin ubicación' }
  ];

  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Route className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Selecciona una organización</h1>
          <p className="text-gray-600">Necesitas seleccionar una organización para optimizar rutas</p>
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

  const headerActions = selectedOrders.length > 0 ? (
    <Button
      onClick={handleGenerateRoute}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      <Route className="w-4 h-4 mr-2" />
      Generar Ruta ({selectedOrders.length})
    </Button>
  ) : undefined;

  return (
    <>
      <Page
        title="Optimización de Rutas"
        subtitle={`Optimiza rutas de entrega para ${currentOrganization.name}`}
        headerActions={headerActions}
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Pendientes"
            value={orders.length}
            icon={Package}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          
          <StatCard
            title="Con Ubicación"
            value={orders.filter(o => o.delivery_lat && o.delivery_lng).length}
            icon={MapPin}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          
          <StatCard
            title="Seleccionados"
            value={selectedOrders.length}
            icon={Route}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          
          <StatCard
            title="Valor Total"
            value={formatCurrency(orders.reduce((sum, order) => sum + (order.total_amount || 0), 0))}
            icon={Car}
            iconColor="text-gray-600"
            iconBgColor="bg-gray-100"
          />
        </div>

        {/* Filters and Search */}
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por número, cliente o dirección..."
          filterValue="ALL"
          onFilterChange={() => {}}
          filterOptions={filterOptions}
          filterPlaceholder="Todos los pedidos"
        />

        {/* Orders List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Cargando pedidos pendientes...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pedidos pendientes</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchTerm 
                  ? 'No se encontraron pedidos con los términos de búsqueda'
                  : 'No hay pedidos pendientes para optimizar rutas'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header de la lista */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Pedidos Pendientes</h3>
                {orders.length > 0 && (
                  <Button
                    onClick={handleSelectAll}
                    variant="outline"
                    size="sm"
                  >
                    {selectedOrders.length === orders.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                  </Button>
                )}
              </div>

                             {/* Lista de pedidos */}
               <div className="space-y-3">
                 {filteredOrders.map((order) => (
                   <div
                     key={order.uuid}
                     className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                       selectedOrders.includes(order.uuid)
                         ? 'border-blue-500 bg-blue-50'
                         : 'border-gray-200 hover:border-gray-300'
                     }`}
                   >
                     <Checkbox
                       checked={selectedOrders.includes(order.uuid)}
                       onChange={() => handleOrderSelection(order.uuid)}
                     />
                     
                     <div className="flex-1">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <span className="font-medium text-gray-900">#{order.order_number}</span>
                           <span className="text-gray-600">- {order.description || 'Sin descripción'}</span>
                         </div>
                         <div className="text-right">
                           <div className="font-semibold text-gray-900">{formatCurrency(order.total_amount || 0)}</div>
                           <div className="text-sm text-gray-500">{formatDate(order.created_at)}</div>
                         </div>
                       </div>
                       
                       <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                         <MapPin className="w-4 h-4" />
                         <span>{order.delivery_address}</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Mapa de ruta optimizada */}
        {showRoute && selectedOrders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ruta Optimizada ({selectedOrders.length} pedidos)
            </h2>
            <OptimizedRouteMap
              pickupLocation={pickupLocation}
              deliveryLocations={getDeliveryLocations()}
              onRouteOptimized={(route) => {
                console.log('Ruta optimizada generada:', route);
                // Aquí puedes hacer lo que necesites con la ruta
              }}
            />
          </div>
        )}
      </Page>
    </>
  );
}
