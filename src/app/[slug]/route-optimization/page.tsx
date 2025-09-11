'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApiService } from '@/lib/api/orders';
import { Order } from '@/types';
import { IndividualRoutesMap } from '@/components/ui/IndividualRoutesMap';
import { Page } from '@/components/ui/Page';
import { Route, AlertCircle, Map, Navigation, Save } from 'lucide-react';
import { BRANCH_LOCATION } from '@/lib/constants';
import TrafficOptimizedRouteMap from '@/components/ui/TrafficOptimizedRouteMap';

import { useTrafficOptimization } from '@/hooks/useTrafficOptimization';
import { useRouteCreation } from '@/hooks/useRouteCreation';
import { useSavedRoutes } from '@/hooks/useSavedRoutes';
import { useToast } from '@/hooks/useToast';
import { SavedRoute } from '@/types';
import { ToastContainer } from '@/components/ui/ToastContainer';
import SavedRoutesList from '@/components/ui/SavedRoutesList';

interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

type ViewMode = 'individual' | 'optimized' | 'saved';

export default function RouteOptimizationPage() {
  const { currentOrganization } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [queueMode, setQueueMode] = useState<boolean>(false);
  
  // Función para obtener pedidos formateados para el mapa
  const getOrdersForMap = useCallback(() => {
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
  }, [orders]);

  // Hook para optimización con tráfico
  const {
    optimizeRoute: optimizeRouteWithTraffic,
    isLoading: isTrafficOptimizing,
    error: trafficError,
    data: trafficOptimizedRoute,
    reset: clearTrafficResult
  } = useTrafficOptimization();

  // Hook para crear rutas en el backend
  const {
    createRoute,
    isLoading: isCreatingRoute,
    error: routeCreationError,
    reset: clearRouteCreationError
  } = useRouteCreation();

  // Hook para notificaciones toast
  const { toasts, success, error: showErrorToast, removeToast } = useToast();

  // Hook para rutas guardadas
  const {
    savedRoutes,
    isLoading: isLoadingSavedRoutes,
    error: savedRoutesError,
    fetchSavedRoutes,
    reset: resetSavedRoutes
  } = useSavedRoutes();

  // Cargar pedidos y ubicación de pickup
  useEffect(() => {
    if (currentOrganization) {
      loadData();
    }
  }, [currentOrganization]);

  // Cargar rutas guardadas cuando se cambie a la pestaña correspondiente
  useEffect(() => {
    if (viewMode === 'saved' && currentOrganization) {
      fetchSavedRoutes(currentOrganization.uuid);
    }
  }, [viewMode, currentOrganization, fetchSavedRoutes]);

  // Actualizar rutas guardadas automáticamente después de guardar una nueva ruta
  useEffect(() => {
    if (viewMode === 'saved' && currentOrganization && !isCreatingRoute) {
      // Pequeño delay para asegurar que la ruta se haya guardado en el backend
      const timer = setTimeout(() => {
        fetchSavedRoutes(currentOrganization.uuid);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isCreatingRoute, viewMode, currentOrganization, fetchSavedRoutes]);

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

  const handleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allOrderIds = orders.map(order => order.uuid);
    setSelectedOrders(allOrderIds);
  }, [orders]);

  const handleClearAll = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Memoizar los datos del mapa para evitar re-renderizados innecesarios
  const ordersForMap = useMemo(() => getOrdersForMap(), [getOrdersForMap]);

  const handleOptimizeRouteWithTraffic = async () => {
    if (selectedOrders.length < 1 || !pickupLocation) return;
    
    // Convertir pedidos seleccionados a waypoints para el nuevo endpoint
    const selectedOrdersData = ordersForMap.filter(order => 
      selectedOrders.includes(order.id)
    );

    // Crear estructura para el nuevo endpoint
    const origin = {
      lat: pickupLocation.lat,
      lon: pickupLocation.lng,
      name: pickupLocation.address
    };

    const destination = {
      lat: pickupLocation.lat,
      lon: pickupLocation.lng,
      name: pickupLocation.address
    };

    const waypoints = selectedOrdersData.map(order => ({
      lat: order.deliveryLocation.lat,
      lon: order.deliveryLocation.lng,
      name: order.deliveryLocation.address
    }));

    // Llamar al nuevo endpoint con origin, destination y waypoints
    const result = await optimizeRouteWithTraffic(origin, destination, waypoints, true, queueMode);
    
    if (result.success) {
      // Cambiar a la vista optimizada automáticamente
      setViewMode('optimized');
    } else {
      console.error('❌ Error optimizing route with traffic:', result.error);
    }
  };

  const handleClearOptimization = () => {
    clearTrafficResult();
    clearRouteCreationError();
    setViewMode('individual');
  };

  // Funciones para manejar rutas guardadas
  const handleViewSavedRoute = (route: SavedRoute) => {
    console.log('Ver ruta guardada:', route);
    // TODO: Implementar visualización de la ruta guardada
    success(
      'Ruta cargada',
      `Se ha cargado la ruta "${route.route_name}" para visualización.`,
      3000
    );
  };

  const handleStartSavedRoute = (route: SavedRoute) => {
    console.log('Iniciar ruta guardada:', route);
    // TODO: Implementar inicio de ruta guardada
    success(
      'Ruta iniciada',
      `Se ha iniciado la ruta "${route.route_name}".`,
      3000
    );
  };

  const handleSaveRoute = async () => {
    if (!trafficOptimizedRoute || !currentOrganization) return;
    
    try {
      const result = await createRoute({
        routeData: trafficOptimizedRoute,
        selectedOrders: selectedOrders,
        organizationId: currentOrganization.uuid,
        routeName: `Ruta ${currentOrganization.name} - ${new Date().toLocaleDateString()}`,
        description: `Ruta optimizada con ${selectedOrders.length} pedidos`
      });
      
      if (result.success) {
        console.log('✅ Ruta creada exitosamente:', result.data);
        success(
          '¡Ruta guardada exitosamente!',
          `La ruta optimizada con ${selectedOrders.length} pedidos ha sido guardada en el sistema.`,
          5000
        );
        
        // Si estamos en la vista de rutas guardadas, actualizar automáticamente
        if (viewMode === 'saved') {
          setTimeout(() => {
            fetchSavedRoutes(currentOrganization.uuid);
          }, 500);
        }
      } else {
        console.error('❌ Error al crear la ruta:', result.error);
        showErrorToast(
          'Error al guardar la ruta',
          result.error || 'No se pudo guardar la ruta. Por favor, inténtalo de nuevo.',
          6000
        );
      }
    } catch (error) {
      console.error('❌ Error inesperado al crear la ruta:', error);
      showErrorToast(
        'Error inesperado',
        'Ocurrió un error inesperado al guardar la ruta. Por favor, inténtalo de nuevo.',
        6000
      );
    }
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
          {/* Sistema de Pestañas */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('individual')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'individual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Map className="w-4 h-4" />
                Rutas Individuales
              </button>
              
              <button
                onClick={() => setViewMode('optimized')}
                disabled={!trafficOptimizedRoute}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  !trafficOptimizedRoute
                    ? 'text-gray-400 cursor-not-allowed'
                    : viewMode === 'optimized'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Navigation className="w-4 h-4" />
                Ruta Optimizada
                {trafficOptimizedRoute && (
                  <span className="ml-1 w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </button>
              
              <button
                onClick={() => setViewMode('saved')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'saved'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Save className="w-4 h-4" />
                Rutas Guardadas
              </button>
            </div>
          </div>

          {/* Contenido de las pestañas */}
          {viewMode === 'individual' && (
            <>
              {selectedOrders.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      <span>{selectedOrders.length} pedidos seleccionados</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {selectedOrders.length >= 1 && (
                        <>
                          {/* Opciones de optimización */}
                          <div className="flex flex-col gap-2 mr-4">
                            <div className="text-xs text-blue-600 font-medium">Modo de optimización:</div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm text-blue-700" title="Mantener el orden cronológico de los pedidos tal como fueron recibidos">
                                <input
                                  type="radio"
                                  name="queueMode"
                                  checked={queueMode}
                                  onChange={() => setQueueMode(true)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span>Mantener orden cronológico</span>
                              </label>
                              <label className="flex items-center gap-2 text-sm text-blue-700" title="Permitir que el algoritmo reordene las paradas para máxima eficiencia">
                                <input
                                  type="radio"
                                  name="queueMode"
                                  checked={!queueMode}
                                  onChange={() => setQueueMode(false)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span>Optimizar para máxima eficiencia</span>
                              </label>
                            </div>
                            <div className="text-xs text-blue-500">
                              {queueMode ? "Los pedidos se visitarán en el mismo orden en que fueron recibidos" : "El algoritmo reordenará las paradas para minimizar tiempo y distancia"}
                            </div>
                          </div>
                          
                          <button
                            onClick={handleOptimizeRouteWithTraffic}
                            disabled={isTrafficOptimizing}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                          >
                            {isTrafficOptimizing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Optimizando...
                              </>
                            ) : (
                              <>
                                <Route className="w-4 h-4" />
                                Optimizar con Tráfico
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <IndividualRoutesMap
                pickupLocation={pickupLocation}
                orders={ordersForMap}
                selectedOrders={selectedOrders}
                onOrderSelection={handleOrderSelection}
                onSelectAll={handleSelectAll}
                onClearAll={handleClearAll}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
              />
            </>
          )}

          {viewMode === 'optimized' && trafficOptimizedRoute && (
            <div>
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Ruta optimizada con tráfico en tiempo real</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveRoute}
                      disabled={isCreatingRoute}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
                    >
                      {isCreatingRoute ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          💾 Guardar Ruta
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleClearOptimization}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
              
              <TrafficOptimizedRouteMap
                trafficOptimizedRoute={trafficOptimizedRoute}
                showAlternatives={true}
              />
            </div>
          )}

          {viewMode === 'saved' && (
            

              
              <SavedRoutesList
                savedRoutes={savedRoutes}
                isLoading={isLoadingSavedRoutes}
                error={savedRoutesError}
                onViewRoute={handleViewSavedRoute}
                onStartRoute={handleStartSavedRoute}
              />
        
          )}

          {/* Mostrar error de optimización con tráfico */}
          {trafficError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error en optimización con tráfico:</span>
                <span>{trafficError}</span>
              </div>
            </div>
          )}

          {/* Mostrar error de creación de ruta */}
          {routeCreationError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error al crear la ruta:</span>
                <span>{routeCreationError}</span>
              </div>
            </div>
          )}
        </div>
      </Page>
      
      {/* Toast Container para notificaciones */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
