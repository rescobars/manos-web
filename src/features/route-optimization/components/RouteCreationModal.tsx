'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { XCircle, Route, AlertCircle, MapPin, Package, ArrowLeft, ArrowRight, CheckCircle, Info, Truck, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useMultiDeliveryOptimization } from '@/hooks/useMultiDeliveryOptimization';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useRouteCreation } from '@/hooks/useRouteCreation';
import { ordersApiService } from '@/lib/api/orders';
import { BRANCH_LOCATION } from '@/lib/constants';
import { LocationSelectorMap, MultiDeliveryRouteMap } from '@/components/ui/leaflet';
import { IndividualRoutesMap } from '@/components/ui/leaflet/IndividualRoutesMap';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

type FlowStep = 'select' | 'review';

interface RouteCreationModalProps {
  onClose: () => void;
  onRouteCreated: () => void;
  asPage?: boolean;
}

export function RouteCreationModal({ onClose, onRouteCreated, asPage = false }: RouteCreationModalProps) {
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
  const [routeSaved, setRouteSaved] = useState<boolean>(false);
  const [createdRouteUuid, setCreatedRouteUuid] = useState<string>('');
  const [optimizationMode, setOptimizationMode] = useState<'efficiency' | 'order'>('efficiency');
  const [saving, setSaving] = useState<boolean>(false);
  
  // Estados para multi-delivery
  const [startLocation, setStartLocation] = useState<PickupLocation | null>(null);
  const [endLocation, setEndLocation] = useState<PickupLocation | null>(null);
  const [useMultiDelivery, setUseMultiDelivery] = useState<boolean>(true);
  

  // Callbacks con logs para debug
  const handleStartLocationSelect = (location: PickupLocation) => {
    console.log('🎯 Start location selected:', location);
    setStartLocation(location);
  };

  const handleEndLocationSelect = (location: PickupLocation) => {
    console.log('🎯 End location selected:', location);
    setEndLocation(location);
  };

  // Hooks
  const {
    data: multiDeliveryData,
    optimizeRoute: optimizeMultiDelivery,
    isLoading: multiDeliveryLoading
  } = useMultiDeliveryOptimization();
  
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
      createdAt: order.created_at,
      status: order.status || 'PENDING'
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
      title: 'Seleccionar Pedidos y Ubicación',
      description: 'Elige los pedidos y la ubicación inicial para los mandados',
      icon: Package,
      canNext: selectedOrders.length > 0 && !!startLocation,
      nextText: 'Optimizar Mandados'
    },
    {
      key: 'review',
      title: 'Revisar Mandados',
      description: routeSaved ? 'Ruta de mandados guardada exitosamente' : 'Revisa la ruta de mandados optimizada antes de guardarla',
      icon: Route,
      canNext: !!(multiDeliveryData && !routeSaved),
      nextText: routeSaved ? 'Mandados Guardados' : 'Guardar Mandados'
    },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const stepInfo = steps[currentStepIndex] || steps[0];
  

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
        if (selectedOrders.length > 0 && startLocation) {
          console.log('📝 Moving to review step for multi-delivery');
          setCurrentStep('review');
          setTimeout(() => {
            handleOptimizeMultiDelivery();
          }, 100);
        } else if (selectedOrders.length === 0) {
          showError('Pedidos requeridos', 'Debes seleccionar al menos un pedido para continuar.', 3000);
        } else if (!startLocation) {
          showError('Ubicación requerida', 'Debes seleccionar la ubicación inicial para continuar.', 3000);
        }
        break;
        
      case 'review':
        if (multiDeliveryData && !routeSaved) {
          await handleSaveRoute();
        } else if (!multiDeliveryData) {
          await handleOptimizeMultiDelivery();
        }
        break;
        
    }
  };


  const handleOptimizeMultiDelivery = async () => {
    if (selectedOrders.length < 1 || !startLocation) {
      return;
    }
    
    const selectedOrdersData = getOrdersForMap().filter(order => 
      selectedOrders.includes(order.id)
    );
    
    // Convertir pedidos al formato multi-delivery
    const deliveryOrders = selectedOrdersData.map(order => ({
      id: order.id,
      order_number: order.orderNumber,
      origin: {
        lat: order.pickupLocation?.lat || order.deliveryLocation.lat,
        lng: order.pickupLocation?.lng || order.deliveryLocation.lng,
        address: order.pickupLocation?.address || order.deliveryLocation.address
      },
      destination: {
        lat: order.deliveryLocation.lat,
        lng: order.deliveryLocation.lng,
        address: order.deliveryLocation.address
      },
      description: order.description || '',
      total_amount: order.totalAmount,
      priority: 1,
      estimated_pickup_time: 5,
      estimated_delivery_time: 3
    }));


    // Crear un punto de fin por defecto basado en el último punto de entrega
    const lastDeliveryPoint = deliveryOrders[deliveryOrders.length - 1]?.destination;
    const defaultEndLocation = lastDeliveryPoint || {
      lat: startLocation.lat,
      lng: startLocation.lng,
      address: startLocation.address
    };

    const result = await optimizeMultiDelivery(
      startLocation,
      defaultEndLocation,
      deliveryOrders,
      {
        include_traffic: true,
        departure_time: 'now',
        travel_mode: 'car',
        route_type: 'fastest',
        max_orders_per_trip: 10,
        force_return_to_end: false,
        max_return_distance: 0
      }
    );
    
    if (result.success) {
      console.log('✅ Multi-delivery optimization successful');
    } else {
      console.error('❌ Error optimizing multi-delivery route:', result.error);
      showError('Error en optimización', result.error || 'No se pudo optimizar la ruta multi-delivery', 5000);
    }
  };

  const handleSaveRoute = async () => {
    if (!currentOrganization || !multiDeliveryData?.optimized_route) return;
    
    setSaving(true);
    const optimizedRoute = multiDeliveryData.optimized_route;
    
    // Los waypoints son directamente los stops del FastAPI
    const waypoints = optimizedRoute.stops;
    
    // Console log para debug - mostrar la salida del FastAPI (excepto route_points)
    console.log('🚀 FastAPI Response (sin route_points):', {
      success: multiDeliveryData.success,
      optimized_route: {
        total_distance: optimizedRoute.total_distance,
        total_time: optimizedRoute.total_time,
        total_traffic_delay: optimizedRoute.total_traffic_delay,
        stops: optimizedRoute.stops,
        orders_delivered: optimizedRoute.orders_delivered,
        route_efficiency: optimizedRoute.route_efficiency
      },
      processing_time: multiDeliveryData.processing_time,
      traffic_conditions: multiDeliveryData.traffic_conditions
    });

    // Mapear route_points a points (TODOS los puntos de navegación detallados)
    const routePoints = optimizedRoute.route_points?.map((point, index) => {
      // Mapear congestion_level a los valores esperados por FastAPI
      let congestionLevel = 'free_flow';
      if (point.traffic_delay > 60) {
        congestionLevel = 'severe';
      } else if (point.traffic_delay > 30) {
        congestionLevel = 'heavy';
      } else if (point.traffic_delay > 15) {
        congestionLevel = 'moderate';
      } else if (point.traffic_delay > 5) {
        congestionLevel = 'light';
      }

      return {
        lat: point.lat,
        lon: point.lng,
        name: point.instruction || `Punto ${index + 1}`,
        traffic_delay: point.traffic_delay || 0,
        speed: 35, // Velocidad por defecto
        congestion_level: congestionLevel,
        waypoint_type: 'route' as const,
        waypoint_index: null
      };
    }) || [];

    // Mapear stops ordenados a visit_order (TODAS las paradas en orden)
    const visitOrder = optimizedRoute.stops
      .map((stop, index) => ({
        name: stop.location.address,
        waypoint_index: index,
        order_id: stop.order?.id || null, // Incluir order_id si existe
        waypoint_type: stop.stop_type // Incluir tipo de parada
      }));



      console.log("waypoints", waypoints);
    // Convertir datos multi-delivery al formato esperado por createRoute
    const routeData = {
      route_info: {
        origin: startLocation ? {
          lat: startLocation.lat,
          lon: startLocation.lng,
          name: startLocation.address
        } : {
          lat: 0,
          lon: 0,
          name: 'Origen no definido'
        },
        destination: waypoints.length > 0 ? {
          lat: waypoints[waypoints.length - 1].location.lat,
          lon: waypoints[waypoints.length - 1].location.lng,
          name: waypoints[waypoints.length - 1].location.address
        } : {
          lat: 0,
          lon: 0,
          name: 'Destino no definido'
        },
        waypoints: waypoints,
        total_waypoints: waypoints.length,
        optimized_waypoints: waypoints,
        visit_order: visitOrder
      },
      primary_route: {
        summary: {
          total_time: optimizedRoute.total_time,
          total_distance: optimizedRoute.total_distance,
          traffic_delay: optimizedRoute.total_traffic_delay,
          base_time: optimizedRoute.total_time - optimizedRoute.total_traffic_delay,
          traffic_time: optimizedRoute.total_traffic_delay,
          fuel_consumption: null
        },
        points: routePoints, // route_points mapeados a points
        route_id: `multi-delivery-${Date.now()}`,
        visit_order: visitOrder, // stops ordenados mapeados a visit_order
        optimized_waypoints: waypoints // stops mapeados a waypoints
      },
      alternative_routes: [],
      request_info: {
        origin: startLocation ? {
          lat: startLocation.lat,
          lon: startLocation.lng,
          name: startLocation.address
        } : null,
        destination: waypoints.length > 0 ? {
          lat: waypoints[waypoints.length - 1].location.lat,
          lon: waypoints[waypoints.length - 1].location.lng,
          name: waypoints[waypoints.length - 1].location.address
        } : null,
        waypoints: waypoints
      },
      traffic_conditions: {
        overall_congestion: multiDeliveryData.traffic_conditions?.overall_congestion || 'low',
        total_traffic_delay: multiDeliveryData.traffic_conditions?.total_traffic_delay || 0,
        traffic_enabled: multiDeliveryData.traffic_conditions?.traffic_enabled || true
      }
    } as any;
    
    try {
      const result = await createRoute({
        routeData: routeData,
        selectedOrders: selectedOrders,
        organizationId: currentOrganization.uuid,
        routeName: `Mandados ${currentOrganization.name} - ${new Date().toLocaleDateString()}`,
        description: `Ruta de mandados optimizada con ${selectedOrders.length} pedidos`
      });
      
      if (result.success) {
        const routeUuid = result.data?.route_id;
        if (routeUuid) {
          setCreatedRouteUuid(routeUuid);
        }
        
        success(
          '¡Mandados guardados exitosamente!',
          `La ruta de mandados con ${selectedOrders.length} pedidos ha sido guardada.`,
          5000
        );
        setRouteSaved(true);
        
        // Cerrar el modal automáticamente después de crear la ruta
        if (!asPage) {
          onRouteCreated();
          onClose();
        }
      } else {
        showError(
          'Error al guardar los mandados',
          result.error || 'No se pudo guardar la ruta de mandados. Por favor, inténtalo de nuevo.',
          6000
        );
      }
    } catch (error) {
      showError(
        'Error inesperado',
        'Ocurrió un error inesperado al guardar los mandados. Por favor, inténtalo de nuevo.',
        6000
      );
    } finally {
      setSaving(false);
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
      asPage ? (
        <div className="p-4 sm:p-6 md:p-8">
          <div className="rounded-xl shadow max-w-xl w-full mx-auto p-6 text-center theme-bg-3" style={{ backgroundColor: colors.background3 }}>
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.warning }} />
            <h3 className="text-lg font-semibold mb-2 theme-text-primary">Ubicación no configurada</h3>
            <p className="mb-4 theme-text-secondary">Configura la ubicación de tu sucursal para continuar.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.buttonPrimary1, color: colors.buttonText }}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl shadow-2xl max-w-md w-full p-6 text-center theme-bg-3" style={{ backgroundColor: colors.background3 }}>
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.warning }} />
            <h3 className="text-lg font-semibold mb-2 theme-text-primary">Ubicación no configurada</h3>
            <p className="mb-4 theme-text-secondary">Configura la ubicación de tu sucursal para continuar.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.buttonPrimary1, color: colors.buttonText }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )
    );
  }

  if (loading) {
    return (
      asPage ? (
        <div className="p-4 sm:p-6 md:p-8">
          <div className="rounded-xl shadow max-w-xl w-full mx-auto p-6 text-center theme-bg-3" style={{ backgroundColor: colors.background3 }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.buttonPrimary1 }}></div>
            <p className="theme-text-secondary">Cargando pedidos...</p>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl shadow-2xl max-w-md w-full p-6 text-center theme-bg-3" style={{ backgroundColor: colors.background3 }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.buttonPrimary1 }}></div>
            <p className="theme-text-secondary">Cargando pedidos...</p>
          </div>
        </div>
      )
    );
  }

  return (
    <div className={asPage ? "p-4 sm:p-6 md:p-8" : "fixed inset-0 flex items-center justify-center z-50 p-4"}>
      <div 
        className={asPage ? "rounded-xl shadow theme-bg-3 w-full max-w-[1400px] mx-auto flex flex-col" : "rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col theme-bg-3"}
        style={{ backgroundColor: colors.background3 }}
      >
        <div 
          className={asPage ? "p-3 sm:p-4 lg:p-6 border-b theme-divider" : "p-4 sm:p-6 border-b theme-divider"}
          style={{ borderColor: colors.divider }}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className={asPage ? "text-lg sm:text-xl lg:text-2xl font-semibold theme-text-primary" : "text-base sm:text-lg font-semibold theme-text-primary"}>Crear Mandados</h3>
              <p className="text-xs sm:text-sm theme-text-secondary mt-1">Selecciona pedidos y crea una ruta de mandados optimizada</p>
            </div>
            {asPage ? (
              <button
                onClick={onClose}
                aria-label="Cerrar"
                title="Cerrar"
                className="p-2 rounded-lg transition-colors theme-text-muted hover:theme-text-primary hover:theme-bg-2"
              >
                <XCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="p-2 theme-text-muted hover:theme-text-primary hover:theme-bg-2 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        <div className={asPage ? "" : "overflow-y-auto max-h-[calc(90vh-120px)]"}>
          {/* Información del paso actual */}
          <div className={asPage ? "flex items-center justify-center h-12 sm:h-14 px-3 sm:px-4 lg:px-6 theme-bg-2 sticky top-0 z-20" : "flex items-center justify-center h-14 sm:h-16 px-4 sm:px-6 theme-bg-2"} style={{ backgroundColor: colors.background2 }}>
            
            {/* Progreso + Acciones (arriba) */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm theme-text-secondary">Paso {currentStepIndex + 1} de {steps.length}</span>
                <div className="flex items-center gap-1">
                  {steps.map((_, index) => {
                    const isActive = index <= currentStepIndex;
                    return (
                      <div
                        key={index}
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                        style={{ backgroundColor: isActive ? colors.buttonPrimary1 : colors.divider }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Contenido del paso actual */}
          <div className={asPage ? "p-2 sm:p-3 lg:p-4" : "p-3 sm:p-4 overflow-y-auto flex-1"}>
            {currentStep === 'select' && (
              <div className="space-y-1 sm:space-y-2">

                {/* Mapa unificado de pedidos y selección de ubicación */}
                <div className="space-y-1">

                  <div className={asPage ? "h-[80vh] rounded-lg overflow-hidden shadow-sm" : "h-[40rem] rounded-lg overflow-hidden shadow-sm"}>
                    <IndividualRoutesMap
                      pickupLocation={pickupLocation}
                      orders={ordersForMap}
                      selectedOrders={selectedOrders}
                      onOrderSelection={handleOrderSelection}
                      onSelectAll={handleSelectAll}
                      onClearAll={handleClearAll}
                      searchTerm={searchTerm}
                      onSearchChange={handleSearchChange}
                      startLocation={startLocation}
                      onStartLocationSelect={handleStartLocationSelect}
                      optimizationMode={optimizationMode}
                      onOptimizationModeChange={setOptimizationMode}
                      colors={colors}
                    />
                  </div>


                  {/* Nota sobre selección de ubicación inicial */}
                  <div className="text-center">
                    <p className="text-sm theme-text-secondary">
                      💡 Haz clic en el mapa para seleccionar la posición inicial de la ruta
                    </p>
                  </div>

                  {/* Botón para optimizar mandados */}
                  <div className="flex justify-center pt-1">
                    <button
                      onClick={executeCurrentStepAction}
                      disabled={!stepInfo.canNext}
                      className={`px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                        stepInfo.canNext
                          ? 'shadow-sm hover:shadow-md theme-btn-primary'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      style={stepInfo.canNext ? { backgroundColor: colors.buttonPrimary1, color: colors.buttonText } : undefined}
                    >
                      <span>Optimizar Mandados</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            )}


            {currentStep === 'review' && (
              <div className="space-y-4">
                {/* Header de la ruta optimizada */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold theme-text-primary mb-2">Ruta Optimizada Multi-Delivery</h3>
                  <p className="text-sm theme-text-secondary">
                    {multiDeliveryData?.optimized_route ? 
                      `${multiDeliveryData.optimized_route.orders_delivered || 0} mandados optimizados` : 
                      'Preparando optimización...'
                    }
                  </p>
                </div>

                {multiDeliveryLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.buttonPrimary1 }}></div>
                    <p className="theme-text-secondary">Optimizando ruta de mandados...</p>
                  </div>
                ) : multiDeliveryData?.optimized_route ? (
                  <div className="space-y-4">
                    {/* Mapa de la ruta optimizada */}
                    <div className="w-full rounded-lg overflow-hidden border shadow-sm" style={{ borderColor: colors.border }}>
                      <MultiDeliveryRouteMap
                        optimizedRoute={multiDeliveryData.optimized_route}
                        className="w-full"
                        style={{ height: asPage ? '60vh' : '32rem' }}
                      />
                    </div>

                    {/* Información de la ruta */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg" style={{ backgroundColor: colors.background2 }}>
                      <div className="text-center">
                        <div className="text-2xl font-bold theme-text-primary">
                          {multiDeliveryData.optimized_route.total_distance?.toFixed(1) || '0'} km
                        </div>
                        <div className="text-xs theme-text-secondary">Distancia Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold theme-text-primary">
                          {Math.round(multiDeliveryData.optimized_route.total_time || 0)} min
                        </div>
                        <div className="text-xs theme-text-secondary">Tiempo Estimado</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold theme-text-primary">
                          {multiDeliveryData.optimized_route.orders_delivered || 0}
                        </div>
                        <div className="text-xs theme-text-secondary">Mandados</div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => setCurrentStep('select')}
                        disabled={routeSaved}
                        className={`px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 border-2 ${
                          routeSaved 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300' 
                            : 'hover:shadow-md'
                        }`}
                        style={!routeSaved ? { 
                          borderColor: colors.border, 
                          color: colors.textPrimary,
                          backgroundColor: colors.background3
                        } : undefined}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{routeSaved ? 'Ruta Guardada' : 'Volver a Editar'}</span>
                      </button>
                      <button
                        onClick={handleSaveRoute}
                        disabled={saving || routeSaved}
                        className={`px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                          saving || routeSaved
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'shadow-sm hover:shadow-md'
                        }`}
                        style={!saving && !routeSaved ? { backgroundColor: colors.buttonPrimary1, color: colors.buttonText } : undefined}
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Guardando...</span>
                          </>
                        ) : routeSaved ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Ruta Guardada</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Guardar Ruta</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.warning }} />
                    <h3 className="text-lg font-semibold theme-text-primary mb-2">Error en la optimización</h3>
                    <p className="theme-text-secondary mb-4">No se pudo optimizar la ruta de mandados. Inténtalo de nuevo.</p>
                    <button
                      onClick={() => setCurrentStep('select')}
                      className="px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 mx-auto"
                      style={{ backgroundColor: colors.buttonPrimary1, color: colors.buttonText }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver a Editar</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
      {/* Toasts locales */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
