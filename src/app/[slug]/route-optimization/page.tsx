'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApiService } from '@/lib/api/orders';
import { Order } from '@/types';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { IndividualRoutesMap } from '@/components/ui/IndividualRoutesMap';
import { StatCard } from '@/components/ui/StatCard';
import { FilterBar } from '@/components/ui/FilterBar';
import { Page } from '@/components/ui/Page';
import { Package, MapPin, Route, Clock, Car, AlertCircle } from 'lucide-react';
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

  const getSelectedOrdersData = () => {
    return orders.filter(order => selectedOrders.includes(order.uuid));
  };

  const getSelectedOrdersForMap = () => {
    return getSelectedOrdersData()
      .filter(order => order.delivery_lat && order.delivery_lng) // Solo pedidos con coordenadas válidas
      .map(order => ({
        id: order.uuid,
        orderNumber: order.order_number,
        deliveryLocation: {
          lat: order.delivery_lat!,
          lng: order.delivery_lng!,
          address: order.delivery_address || '',
          id: order.uuid
        }
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

  const ordersWithLocation = orders.filter(o => o.delivery_lat && o.delivery_lng);
  const ordersWithoutLocation = orders.filter(o => !o.delivery_lat || !o.delivery_lng);

  return (
    <>
      <Page
        title="Visualización de Rutas"
        subtitle={`Visualiza rutas individuales de pedidos para ${currentOrganization.name}`}
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
            value={ordersWithLocation.length}
            icon={MapPin}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          
          <StatCard
            title="Sin Ubicación"
            value={ordersWithoutLocation.length}
            icon={AlertCircle}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
          />
          
          <StatCard
            title="Seleccionados"
            value={selectedOrders.length}
            icon={Route}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
              <FilterBar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar pedidos por número, descripción o dirección..."
                filterValue="ALL"
                onFilterChange={() => {}}
                filterOptions={filterOptions}
                filterPlaceholder="Todos los pedidos"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
              >
                {selectedOrders.length === orders.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
              </Button>
            </div>
          </div>
        </div>

        {/* Mapa de rutas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <IndividualRoutesMap
            pickupLocation={pickupLocation}
            selectedOrders={getSelectedOrdersForMap()}
          />
        </div>

        {/* Lista de pedidos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pedidos Pendientes</h3>
            <div className="text-sm text-gray-600">
              {selectedOrders.length} de {orders.length} seleccionados
            </div>
          </div>

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
                  : 'No hay pedidos pendientes para visualizar'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const hasLocation = order.delivery_lat && order.delivery_lng;
                const isSelected = selectedOrders.includes(order.uuid);
                
                return (
                  <div
                    key={order.uuid}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : hasLocation
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleOrderSelection(order.uuid)}
                      disabled={!hasLocation}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">#{order.order_number}</span>
                          <span className="text-gray-600">- {order.description || 'Sin descripción'}</span>
                          {!hasLocation && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Sin ubicación
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{formatCurrency(order.total_amount || 0)}</div>
                          <div className="text-sm text-gray-500">{formatDate(order.created_at)}</div>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{order.delivery_address}</span>
                        {hasLocation && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Con coordenadas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Page>
    </>
  );
}
