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

type ViewMode = 'individual' | 'optimized' | 'saved' | 'assign';

export default function RouteOptimizationPage() {
  const { currentOrganization } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [queueMode, setQueueMode] = useState<boolean>(false);
  const [routeSaved, setRouteSaved] = useState<boolean>(false);
  
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
      // Resetear el estado de ruta guardada cuando se crea una nueva optimización
      setRouteSaved(false);
    } else {
      console.error('❌ Error optimizing route with traffic:', result.error);
    }
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
    if (!trafficOptimizedRoute || !currentOrganization || routeSaved) return;
    
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
        
        // Marcar la ruta como guardada
        setRouteSaved(true);
        
        // Mostrar mensaje de éxito y cambiar a pantalla de asignación
        success(
          '¡Ruta guardada exitosamente!',
          `La ruta optimizada con ${selectedOrders.length} pedidos ha sido guardada. Ahora puedes asignarla a un piloto.`,
          5000
        );
        
        // Cambiar a pantalla de asignación
        setViewMode('assign');
        
        // Actualizar la lista de rutas guardadas
        setTimeout(() => {
          fetchSavedRoutes(currentOrganization.uuid);
        }, 500);
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
        title="Pedidos"
        subtitle={`Gestiona pedidos y crea rutas optimizadas para ${currentOrganization.name}`}
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Indicador de Flujo de Trabajo */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedOrders.length > 0 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    1
                  </div>
                  <span className={`text-sm font-medium ${selectedOrders.length > 0 ? 'text-blue-700' : 'text-gray-500'}`}>
                    Seleccionar Pedidos
                  </span>
                </div>
                
                <div className="w-8 h-0.5 bg-gray-300"></div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    trafficOptimizedRoute ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    2
                  </div>
                  <span className={`text-sm font-medium ${trafficOptimizedRoute ? 'text-green-700' : 'text-gray-500'}`}>
                    Optimizar Ruta
                  </span>
                </div>
                
                <div className="w-8 h-0.5 bg-gray-300"></div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    routeSaved ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    3
                  </div>
                  <span className={`text-sm font-medium ${routeSaved ? 'text-green-700' : 'text-gray-500'}`}>
                    Crear Ruta
                  </span>
                </div>
                
                <div className="w-8 h-0.5 bg-gray-300"></div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    viewMode === 'assign' ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    4
                  </div>
                  <span className={`text-sm font-medium ${viewMode === 'assign' ? 'text-purple-700' : 'text-gray-500'}`}>
                    Asignar Piloto
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          {!trafficOptimizedRoute && (
            <>
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
              
              {selectedOrders.length > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  {/* Opciones de optimización compactas */}
                  <div className="p-2 bg-white/50 rounded-md">
                    <div className="text-lg font-medium text-blue-700 mb-2">Modo de optimización:</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-xs text-blue-700 cursor-pointer" title="Mantener el orden cronológico de los pedidos tal como fueron recibidos">
                          <input
                            type="radio"
                            name="queueMode"
                            checked={queueMode}
                            onChange={() => setQueueMode(true)}
                            className="w-3 h-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span>Mantener orden cronológico</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-blue-700 cursor-pointer" title="Permitir que el algoritmo reordene las paradas para máxima eficiencia">
                          <input
                            type="radio"
                            name="queueMode"
                            checked={!queueMode}
                            onChange={() => setQueueMode(false)}
                            className="w-3 h-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span>Optimizar para máxima eficiencia</span>
                        </label>
                      </div>
                      
                      {selectedOrders.length >= 1 && (
                        <button
                          onClick={handleOptimizeRouteWithTraffic}
                          disabled={isTrafficOptimizing}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed"
                        >
                          {isTrafficOptimizing ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                              <span>Optimizando...</span>
                            </>
                          ) : (
                            <>
                              <Route className="w-4 h-4" />
                              <span>Optimizar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-blue-500 mt-1">
                      {queueMode ? "Los pedidos se visitarán en el mismo orden en que fueron recibidos" : "El algoritmo reordenará las paradas para minimizar tiempo y distancia"}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {trafficOptimizedRoute && viewMode !== 'assign' && (
            <div>
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${routeSaved ? 'bg-green-500' : 'bg-green-500 animate-pulse'}`}></div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">
                        {routeSaved ? 'Ruta Guardada' : 'Ruta Optimizada'}
                      </h3>
                      <p className="text-sm text-green-600">
                        {routeSaved 
                          ? 'Ruta guardada exitosamente en el sistema' 
                          : 'Optimizada con datos de tráfico en tiempo real'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {!routeSaved ? (
                    <button
                      onClick={handleSaveRoute}
                      disabled={isCreatingRoute}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 disabled:cursor-not-allowed"
                    >
                      {isCreatingRoute ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>Guardar Ruta</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Ruta Guardada</span>
                    </div>
                  )}
                </div>
              </div>
              
              <TrafficOptimizedRouteMap
                trafficOptimizedRoute={trafficOptimizedRoute}
                showAlternatives={true}
              />
              
            </div>
          )}


          {/* Pantalla de Asignación de Ruta */}
          {viewMode === 'assign' && trafficOptimizedRoute && (
            <div className="mt-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-800">Asignar Ruta a Piloto</h3>
                    <p className="text-sm text-purple-600">Selecciona un piloto para asignar esta ruta optimizada</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información de la ruta */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Detalles de la Ruta</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pedidos:</span>
                        <span className="font-medium">{selectedOrders.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distancia total:</span>
                        <span className="font-medium">N/A km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duración estimada:</span>
                        <span className="font-medium">N/A min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Modo de optimización:</span>
                        <span className="font-medium">{queueMode ? 'Cronológico' : 'Eficiencia'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selector de piloto */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Seleccionar Piloto</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Piloto disponible
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                          <option value="">Selecciona un piloto...</option>
                          <option value="pilot1">Juan Pérez - Disponible</option>
                          <option value="pilot2">María García - Disponible</option>
                          <option value="pilot3">Carlos López - En ruta</option>
                          <option value="pilot4">Ana Martínez - Disponible</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notas adicionales (opcional)
                        </label>
                        <textarea
                          placeholder="Instrucciones especiales para el piloto..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-20 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de acción fijos */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 rounded-b-xl">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setViewMode('optimized')}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Volver a la ruta
                    </button>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          success(
                            'Ruta asignada',
                            'La ruta ha sido asignada exitosamente al piloto seleccionado.',
                            3000
                          );
                          // TODO: Implementar lógica de asignación
                        }}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        Asignar Ruta
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
