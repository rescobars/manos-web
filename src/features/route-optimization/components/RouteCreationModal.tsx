'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { XCircle, Route, AlertCircle, MapPin, Package, Clock, ArrowLeft, ArrowRight, CheckCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useTrafficOptimization } from '@/hooks/useTrafficOptimization';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useRouteCreation } from '@/hooks/useRouteCreation';
import { ordersApiService } from '@/lib/api/orders';
import { BRANCH_LOCATION } from '@/lib/constants';
import TrafficOptimizedRouteMap from '@/components/ui/TrafficOptimizedRouteMap';
import { IndividualRoutesMap } from '@/components/ui/IndividualRoutesMap';

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
  const { colors } = useDynamicTheme();
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
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [driverNotes, setDriverNotes] = useState<string>('');
  const [optimizationMode, setOptimizationMode] = useState<'efficiency' | 'order'>('efficiency');

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
          // Seleccionar todos los pedidos por defecto
          const allOrderIds = response.data.map(order => order.uuid);
          setSelectedOrders(allOrderIds);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentOrganization]);

  // Cargar conductores
  useEffect(() => {
    const fetchDrivers = async () => {
      if (!currentOrganization) return;
      
      try {
        // Simular carga de conductores - aquí deberías llamar a tu API real
        const mockDrivers = [
          { id: '1', name: 'Juan Pérez', phone: '+502 1234-5678', status: 'available' },
          { id: '2', name: 'María García', phone: '+502 8765-4321', status: 'available' },
          { id: '3', name: 'Carlos López', phone: '+502 5555-1234', status: 'busy' },
          { id: '4', name: 'Ana Martínez', phone: '+502 9999-8888', status: 'available' }
        ];
        setDrivers(mockDrivers);
      } catch (error) {
        console.error('Error fetching drivers:', error);
      }
    };

    fetchDrivers();
  }, [currentOrganization]);

  // Función para obtener pedidos formateados para el mapa
  const getOrdersForMap = useCallback(() => {
    return orders.map(order => ({
      id: order.uuid,
      orderNumber: order.order_number,
      deliveryLocation: {
        lat: parseFloat(String(order.delivery_lat || '0')),
        lng: parseFloat(String(order.delivery_lng || '0')),
        address: order.delivery_address
      },
      pickupLocation: {
        lat: parseFloat(String(order.pickup_lat || '0')),
        lng: parseFloat(String(order.pickup_lng || '0')),
        address: order.pickup_address
      },
      description: order.description,
      totalAmount: parseFloat(String(order.total_amount || '0')),
      createdAt: order.created_at
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
      title: 'Asignar Conductor',
      description: 'Asigna la ruta a un conductor disponible',
      icon: Clock,
      canNext: selectedDriver.length > 0,
      nextText: 'Asignar y Completar'
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
    console.log('⚙️ Modo de optimización:', optimizationMode);

    const result = await optimizeRoute(origin, destination, waypoints, true, queueMode, optimizationMode);
    
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
          `La ruta optimizada con ${selectedOrders.length} pedidos ha sido guardada. Ahora puedes asignar un conductor.`,
          5000
        );
        setRouteSaved(true);
        setCurrentStep('assign');
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
    if (!selectedDriver || !createdRouteUuid) return;
    
    try {
      // Aquí deberías llamar a tu API para asignar la ruta al conductor
      console.log('Asignando ruta:', {
        routeId: createdRouteUuid,
        driverId: selectedDriver,
        notes: driverNotes
      });
      
      // Simular asignación exitosa
      success(
        '¡Ruta asignada exitosamente!',
        `La ruta ha sido asignada al conductor ${drivers.find(d => d.id === selectedDriver)?.name}`,
        5000
      );
      
      // Cerrar el modal después de un delay
      setTimeout(() => {
        onRouteCreated();
        onClose();
      }, 2000);
      
    } catch (error) {
      showError(
        'Error al asignar la ruta',
        'No se pudo asignar la ruta al conductor. Por favor, inténtalo de nuevo.',
        6000
      );
    }
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
      <div 
        className="rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col theme-bg-3"
        style={{ backgroundColor: colors.background3 }}
      >
        <div 
          className="p-6 border-b theme-divider"
          style={{ borderColor: colors.divider }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold theme-text-primary">Crear Nueva Ruta</h3>
              <p className="text-sm theme-text-secondary mt-1">Selecciona pedidos y crea una ruta optimizada</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 theme-text-muted hover:theme-text-primary hover:theme-bg-2 rounded-lg transition-colors"
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
          <div className="p-6 overflow-y-auto flex-1">
            {currentStep === 'select' && (
              <div className="space-y-6">
                {/* Selección del modo de optimización */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Modo de optimización</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Modo Eficiencia */}
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        optimizationMode === 'efficiency'
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => setOptimizationMode('efficiency')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Route className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Mejor Eficiencia</h4>
                            <div className="relative group">
                              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                Optimiza la ruta para minimizar tiempo y distancia total
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            El algoritmo reorganiza los pedidos para encontrar la ruta más corta y eficiente, reduciendo tiempo de entrega y combustible.
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          optimizationMode === 'efficiency'
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {optimizationMode === 'efficiency' && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Modo Orden */}
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        optimizationMode === 'order'
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => setOptimizationMode('order')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Orden de Llegada</h4>
                            <div className="relative group">
                              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                Mantiene el orden en que llegaron los pedidos
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            Respeta el orden cronológico de los pedidos, entregando primero los que llegaron antes.
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          optimizationMode === 'order'
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {optimizationMode === 'order' && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mapa básico de pedidos seleccionados */}
                {selectedOrders.length > 0 && pickupLocation && (
                  <div className="space-y-4">
                    <div className="h-[28rem] rounded-lg overflow-hidden shadow-sm">
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
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Ruta creada exitosamente</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    La ruta con {selectedOrders.length} pedidos ha sido guardada. Ahora asigna un conductor.
                  </p>
                </div>

                {/* Selección de conductor */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Seleccionar Conductor</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {drivers.map((driver) => (
                      <div
                        key={driver.id}
                        onClick={() => setSelectedDriver(driver.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedDriver === driver.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : driver.status === 'available'
                            ? 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{driver.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{driver.phone}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className={`w-2 h-2 rounded-full ${
                                driver.status === 'available' ? 'bg-green-400' : 'bg-red-400'
                              }`}></div>
                              <span className="text-xs text-gray-500">
                                {driver.status === 'available' ? 'Disponible' : 'Ocupado'}
                              </span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedDriver === driver.id
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          }`}>
                            {selectedDriver === driver.id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notas adicionales */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={driverNotes}
                    onChange={(e) => setDriverNotes(e.target.value)}
                    placeholder="Instrucciones especiales para el conductor..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Resumen de la asignación */}
                {selectedDriver && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Resumen de asignación</span>
                    </div>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Conductor: <strong>{drivers.find(d => d.id === selectedDriver)?.name}</strong></p>
                      <p>Pedidos: <strong>{selectedOrders.length}</strong></p>
                      <p>Ruta: <strong>{createdRouteUuid}</strong></p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botones de navegación */}
        <div 
          className="p-6 border-t theme-divider"
          style={{ 
            borderColor: colors.divider,
            backgroundColor: colors.background2 
          }}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                canGoBack
                  ? 'theme-text-secondary hover:theme-text-primary hover:theme-bg-2'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </button>
            
            <button
              onClick={executeCurrentStepAction}
              disabled={!stepInfo.canNext}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                stepInfo.canNext
                  ? 'text-white shadow-lg hover:shadow-xl theme-btn-primary'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="truncate">{stepInfo.nextText}</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
