'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { XCircle, Route, AlertCircle, MapPin, Package, Clock, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useTrafficOptimization } from '@/hooks/useTrafficOptimization';
import { useRouteCreation } from '@/hooks/useRouteCreation';
import { ordersApiService } from '@/lib/api/orders';
import { BRANCH_LOCATION } from '@/lib/constants';
import TrafficOptimizedRouteMap from '@/components/ui/TrafficOptimizedRouteMap';

interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

type FlowStep = 'select' | 'review' | 'assign';

interface RouteCreationModalProps {
  onClose: () => void;
  onRouteCreated: () => void;
}

export function RouteCreationModal({ onClose, onRouteCreated }: RouteCreationModalProps) {
  const { currentOrganization } = useAuth();
  const { success, error: showError, toasts, removeToast } = useToast();
  
  // Estados principales
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);
  const [queueMode, setQueueMode] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<FlowStep>('select');
  const [selectedPilot, setSelectedPilot] = useState<string>('');
  const [pilotNotes, setPilotNotes] = useState<string>('');
  const [routeSaved, setRouteSaved] = useState<boolean>(false);
  const [createdRouteUuid, setCreatedRouteUuid] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Hooks
  const { 
    data: trafficOptimizedRoute, 
    optimizeRoute, 
    isLoading: optimizationLoading 
  } = useTrafficOptimization();
  
  const { createRoute } = useRouteCreation();

  // Configurar ubicación de pickup
  useEffect(() => {
    setPickupLocation({
      lat: BRANCH_LOCATION.lat,
      lng: BRANCH_LOCATION.lng,
      address: BRANCH_LOCATION.address
    });
  }, []);

  // Cargar pedidos
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentOrganization) return;
      
      setLoading(true);
      try {
        const response = await ordersApiService.getPendingOrders(currentOrganization.uuid);
        if (response.success && response.data) {
          setOrders(response.data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentOrganization]);

  // Función para obtener pedidos formateados para el mapa
  const getOrdersForMap = useCallback(() => {
    return orders.map(order => ({
      id: order.uuid,
      deliveryLocation: {
        lat: parseFloat(String(order.delivery_lat || '0')),
        lng: parseFloat(String(order.delivery_lng || '0')),
        address: order.delivery_address
      },
      pickupLocation: {
        lat: parseFloat(String(order.pickup_lat || '0')),
        lng: parseFloat(String(order.pickup_lng || '0')),
        address: order.pickup_address
      }
    }));
  }, [orders]);

  // Filtrar pedidos por término de búsqueda
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    return orders.filter(order => 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.pickup_address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  // Configuración de pasos
  const steps = [
    {
      key: 'select',
      title: 'Seleccionar Pedidos',
      description: 'Elige los pedidos que quieres incluir en la ruta',
      icon: Package,
      canNext: selectedOrders.length > 0,
      nextText: 'Optimizar Ruta'
    },
    {
      key: 'review',
      title: 'Revisar Ruta',
      description: 'Revisa la ruta optimizada antes de guardarla',
      icon: Route,
      canNext: !!trafficOptimizedRoute && !routeSaved,
      nextText: routeSaved ? 'Ruta Guardada' : 'Guardar Ruta'
    },
    {
      key: 'assign',
      title: 'Asignar Ruta',
      description: 'Asigna la ruta a un conductor',
      icon: Clock,
      canNext: false,
      nextText: 'Completado'
    }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const stepInfo = steps[currentStepIndex] || steps[0];
  
  // Debug logs
  console.log('🔍 RouteCreationModal Debug:', {
    currentStep,
    selectedOrders: selectedOrders.length,
    orders: orders.length,
    canNext: stepInfo.canNext,
    stepInfo
  });

  // Funciones de navegación
  const canGoBack = currentStepIndex > 0 && !routeSaved;
  const goBack = () => {
    if (canGoBack) {
      setCurrentStep(steps[currentStepIndex - 1].key as FlowStep);
    }
  };

  // Función para ejecutar la acción del paso actual
  const executeCurrentStepAction = async () => {
    console.log('🎯 executeCurrentStepAction called, currentStep:', currentStep);
    switch (currentStep) {
      case 'select':
        console.log('📝 Moving to review step and calling handleOptimizeRoute');
        setCurrentStep('review');
        setTimeout(() => {
          handleOptimizeRoute();
        }, 100);
        break;
        
      case 'review':
        if (trafficOptimizedRoute && !routeSaved) {
          await handleSaveRoute();
        } else if (!trafficOptimizedRoute) {
          await handleOptimizeRoute();
        }
        break;
        
      case 'assign':
        // Asignar ruta
        await handleAssignRoute();
        break;
    }
  };

  const handleOptimizeRoute = async () => {
    console.log('🚀 handleOptimizeRoute called');
    console.log('🔍 selectedOrders:', selectedOrders);
    console.log('🔍 pickupLocation:', pickupLocation);
    
    if (selectedOrders.length < 1 || !pickupLocation) {
      console.log('❌ Early return: selectedOrders.length =', selectedOrders.length, 'pickupLocation =', pickupLocation);
      return;
    }
    
    const selectedOrdersData = getOrdersForMap().filter(order => 
      selectedOrders.includes(order.id)
    );
    
    console.log('🔍 selectedOrdersData:', selectedOrdersData);

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

    // Filtrar y validar waypoints con coordenadas válidas
    const waypoints = selectedOrdersData
      .map(order => ({
        lat: order.deliveryLocation.lat,
        lon: order.deliveryLocation.lng,
        name: order.deliveryLocation.address
      }))
      .filter(waypoint => 
        !isNaN(waypoint.lat) && 
        !isNaN(waypoint.lon) && 
        waypoint.lat !== 0 && 
        waypoint.lon !== 0
      );

    // Verificar que tenemos waypoints válidos
    if (waypoints.length === 0) {
      showError(
        'Error de coordenadas',
        'No se encontraron coordenadas válidas para los pedidos seleccionados. Verifica que los pedidos tengan direcciones de entrega válidas.',
        5000
      );
      return;
    }

    // Mostrar advertencia si se filtraron algunos pedidos
    if (waypoints.length < selectedOrdersData.length) {
      const filteredCount = selectedOrdersData.length - waypoints.length;
      showError(
        'Algunos pedidos excluidos',
        `${filteredCount} pedido(s) fueron excluidos por tener coordenadas inválidas. Solo se optimizarán ${waypoints.length} pedido(s).`,
        5000
      );
    }

    console.log('🔍 Waypoints válidos:', waypoints);

    const result = await optimizeRoute(origin, destination, waypoints, true, queueMode);
    
    if (result.success) {
      // La optimización se mantiene en el paso de review
    } else {
      console.error('❌ Error optimizing route with traffic:', result.error);
    }
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
        const routeUuid = result.data?.route_id;
        if (routeUuid) {
          setCreatedRouteUuid(routeUuid);
        }
        
        success(
          '¡Ruta guardada exitosamente!',
          `La ruta optimizada con ${selectedOrders.length} pedidos ha sido guardada.`,
          5000
        );
        setRouteSaved(true);
        setCurrentStep('assign');
        
        // Cerrar el modal y refrescar después de un delay
        setTimeout(() => {
          onRouteCreated();
          onClose();
        }, 2000);
      } else {
        showError(
          'Error al guardar la ruta',
          result.error || 'No se pudo guardar la ruta. Por favor, inténtalo de nuevo.',
          6000
        );
      }
    } catch (error) {
      showError(
        'Error inesperado',
        'Ocurrió un error inesperado al guardar la ruta. Por favor, inténtalo de nuevo.',
        6000
      );
    }
  };

  const handleAssignRoute = async () => {
    // Esta función se puede implementar más adelante
    console.log('Assign route functionality to be implemented');
  };

  // Funciones de selección de pedidos
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

  // Memoizar los datos del mapa
  const ordersForMap = useMemo(() => getOrdersForMap(), [getOrdersForMap]);

  if (!currentOrganization) {
    return null;
  }

  if (!pickupLocation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Ubicación no configurada</h3>
          <p className="text-yellow-700 mb-4">Configura la ubicación de tu sucursal para continuar.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Crear Nueva Ruta</h3>
              <p className="text-sm text-gray-600 mt-1">Selecciona pedidos y crea una ruta optimizada</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Información del paso actual */}
          <div className="flex items-center justify-between h-16 px-6 bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <stepInfo.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{stepInfo.title}</h1>
                <p className="text-sm text-gray-500">{stepInfo.description}</p>
              </div>
            </div>
            
            {/* Progreso minimalista */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Paso {currentStepIndex + 1} de {steps.length}</span>
              <div className="flex items-center gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStepIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Contenido del paso actual */}
          <div className="p-6">
            {currentStep === 'select' && (
              <div className="space-y-6">
                {/* Barra de búsqueda y acciones */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Buscar pedidos..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Seleccionar Todos
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Lista de pedidos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.uuid}
                      onClick={() => handleOrderSelection(order.uuid)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedOrders.includes(order.uuid)
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{order.order_number}</h4>
                          <p className="text-sm text-gray-600 mt-1">{order.delivery_address}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {order.pickup_address}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Q{Number(order.total_amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedOrders.includes(order.uuid)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedOrders.includes(order.uuid) && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen de selección */}
                {selectedOrders.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          {selectedOrders.length} pedido{selectedOrders.length !== 1 ? 's' : ''} seleccionado{selectedOrders.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'review' && (
              <div className="space-y-6">
                {optimizationLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Optimizando ruta...</p>
                  </div>
                ) : trafficOptimizedRoute ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900">Ruta optimizada exitosamente</span>
                      </div>
                    </div>
                    
                    <div className="h-96">
                      <TrafficOptimizedRouteMap
                        trafficOptimizedRoute={trafficOptimizedRoute}
                        showAlternatives={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error en la optimización</h3>
                    <p className="text-gray-600">No se pudo optimizar la ruta. Inténtalo de nuevo.</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'assign' && (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ruta Creada Exitosamente</h3>
                <p className="text-gray-600">La ruta ha sido guardada y está lista para ser asignada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                canGoBack
                  ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </button>
            
            <button
              onClick={executeCurrentStepAction}
              disabled={!stepInfo.canNext}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                stepInfo.canNext
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {stepInfo.nextText}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
