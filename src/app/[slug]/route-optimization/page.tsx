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
  const [isInitialized, setIsInitialized] = useState(false);

  // Cargar pedidos pendientes y ubicación de pickup
  useEffect(() => {
    if (currentOrganization) {
      loadPendingOrders();
      loadPickupLocation();
    }
  }, [currentOrganization]);

  // Inicializar automáticamente con los últimos 20 pedidos
  useEffect(() => {
    if (orders.length > 0 && pickupLocation && !isInitialized) {
      initializeWithLastOrders();
    }
  }, [orders, pickupLocation, isInitialized]);

  // Detectar cambios en los pedidos y actualizar caché si es necesario
  useEffect(() => {
    if (isInitialized && selectedOrders.length > 0) {
      // Verificar si algún pedido seleccionado ya no existe o no tiene coordenadas
      const validSelectedOrders = selectedOrders.filter(id => 
        orders.some(order => order.uuid === id && order.delivery_lat && order.delivery_lng)
      );
      
      if (validSelectedOrders.length !== selectedOrders.length) {
        console.log('🔄 Actualizando caché debido a cambios en pedidos');
        if (validSelectedOrders.length > 0) {
          setSelectedOrders(validSelectedOrders);
          saveToCache(validSelectedOrders);
        } else {
          setSelectedOrders([]);
          const cacheKey = getCacheKey();
          if (cacheKey) localStorage.removeItem(cacheKey);
        }
      }
    }
  }, [orders, selectedOrders, isInitialized]);

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
      
      // Actualizar caché cuando cambie la selección
      if (newSelection.length > 0) {
        saveToCache(newSelection);
      } else {
        // Si no hay selección, limpiar caché
        const cacheKey = getCacheKey();
        if (cacheKey) localStorage.removeItem(cacheKey);
      }
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
      // Limpiar caché cuando se deselecciona todo
      const cacheKey = getCacheKey();
      if (cacheKey) localStorage.removeItem(cacheKey);
    } else {
      const allOrderIds = orders
        .filter(order => order.delivery_lat && order.delivery_lng)
        .map(order => order.uuid);
      setSelectedOrders(allOrderIds);
      // Guardar en caché cuando se selecciona todo
      saveToCache(allOrderIds);
    }
  };

  const handleClearAll = () => {
    setSelectedOrders([]);
    // Limpiar caché cuando se limpia todo
    const cacheKey = getCacheKey();
    if (cacheKey) localStorage.removeItem(cacheKey);
  };

  // Función para inicializar automáticamente con los últimos 20 pedidos
  const initializeWithLastOrders = () => {
    if (orders.length === 0) return;

    // Primero intentar cargar desde caché
    const cachedOrderIds = loadFromCache();
    
          if (cachedOrderIds && cachedOrderIds.length > 0) {
        // Verificar que los pedidos en caché aún existen en la lista actual
        const validCachedOrders = cachedOrderIds.filter((id: string) => 
          orders.some(order => order.uuid === id && order.delivery_lat && order.delivery_lng)
        );
      
      if (validCachedOrders.length > 0) {
        setSelectedOrders(validCachedOrders);
        setIsInitialized(true);
        console.log(`📦 Cargando ${validCachedOrders.length} pedidos desde caché`);
        return;
      }
    }

    // Si no hay caché válido, usar los últimos 20 pedidos
    const validOrders = orders
      .filter(order => order.delivery_lat && order.delivery_lng)
      .slice(0, 20); // Solo los últimos 20

    if (validOrders.length > 0) {
      const orderIds = validOrders.map(order => order.uuid);
      setSelectedOrders(orderIds);
      setIsInitialized(true);
      
      // Guardar en caché para futuras visitas
      saveToCache(orderIds);
      
      console.log(`🚀 Inicializando automáticamente con ${validOrders.length} pedidos`);
    }
  };

  // Función para obtener la clave del caché
  const getCacheKey = () => {
    if (!currentOrganization) return null;
    return `route-cache-${currentOrganization.uuid}`;
  };

  // Función para guardar en caché
  const saveToCache = (orderIds: string[]) => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return;

    try {
      const cacheData = {
        orderIds,
        timestamp: Date.now(),
        organizationId: currentOrganization!.uuid
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('💾 Guardando en caché:', cacheData);
    } catch (error) {
      console.error('Error guardando en caché:', error);
    }
  };

  // Función para cargar desde caché
  const loadFromCache = () => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return null;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        
        // Verificar que el caché sea válido (misma organización y no muy antiguo)
        const isExpired = Date.now() - cacheData.timestamp > 24 * 60 * 60 * 1000; // 24 horas
        const isValidOrg = cacheData.organizationId === currentOrganization?.uuid;
        
        if (!isExpired && isValidOrg) {
          console.log('📦 Cargando desde caché:', cacheData);
          return cacheData.orderIds;
        } else {
          console.log('🗑️ Caché expirado o inválido, limpiando...');
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error cargando desde caché:', error);
    }
    
    return null;
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
          {/* Indicador de estado de caché */}
          {isInitialized && selectedOrders.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span>
                  {loadFromCache() ? '📦 Cargando desde caché' : '🚀 Cargando automáticamente'} 
                  - {selectedOrders.length} pedidos seleccionados
                </span>
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
