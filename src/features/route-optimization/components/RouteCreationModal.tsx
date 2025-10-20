'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { XCircle, Route, AlertCircle, MapPin, Package, ArrowLeft, ArrowRight, CheckCircle, Truck, Navigation, Clock, DollarSign, ArrowLeft as BackIcon } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useMultiDeliveryOptimization } from '@/hooks/useMultiDeliveryOptimization';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useRouteCreation } from '@/hooks/useRouteCreation';
import { ordersApiService } from '@/lib/api/orders';
import { BRANCH_LOCATION } from '@/lib/constants';
import { IndividualRoutesMap } from '@/components/ui/leaflet/IndividualRoutesMap';
import { MultiDeliveryRouteMap } from '@/components/ui/leaflet';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';

interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

type Step = 'select' | 'optimize' | 'review';

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
  const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);
  const [startLocation, setStartLocation] = useState<PickupLocation | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [routeSaved, setRouteSaved] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  
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
          // Auto-seleccionar todos los pedidos por defecto
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

  // Configuración de pasos simplificados
  const steps = [
    {
      key: 'select' as Step,
      title: 'Seleccionar Pedidos',
      description: 'Elige los pedidos y la ubicación inicial',
      icon: Package,
      canNext: selectedOrders.length > 0 && !!startLocation,
      nextText: 'Optimizar Ruta'
    },
    {
      key: 'optimize' as Step,
      title: 'Optimizando',
      description: 'Calculando la mejor ruta...',
      icon: Route,
      canNext: false,
      nextText: 'Optimizando...'
    },
    {
      key: 'review' as Step,
      title: 'Revisar Ruta',
      description: routeSaved ? 'Ruta guardada exitosamente' : 'Revisa la ruta optimizada',
      icon: CheckCircle,
      canNext: !!(multiDeliveryData && !routeSaved),
      nextText: routeSaved ? 'Ruta Guardada' : 'Guardar Ruta'
    },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const stepInfo = steps[currentStepIndex] || steps[0];

  // Navegación entre pasos
  const canGoBack = currentStepIndex > 0 && !routeSaved;
  const goBack = () => {
    if (canGoBack) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const goNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    }
  };

  // Ejecutar acción del paso actual
  const executeCurrentStepAction = async () => {
    switch (currentStep) {
      case 'select':
        if (selectedOrders.length > 0 && startLocation) {
          setCurrentStep('optimize');
          await handleOptimizeMultiDelivery();
        } else if (selectedOrders.length === 0) {
          showError('Pedidos requeridos', 'Debes seleccionar al menos un pedido para continuar.', 3000);
        } else if (!startLocation) {
          showError('Ubicación requerida', 'Haz clic en el mapa para seleccionar la ubicación inicial.', 3000);
        }
        break;
        
      case 'review':
        if (multiDeliveryData && !routeSaved) {
          await handleSaveRoute();
        }
        break;
    }
  };


  const handleOptimizeMultiDelivery = async () => {
    if (selectedOrders.length < 1 || !startLocation) return;
    
    const selectedOrdersData = getOrdersForMap().filter(order => 
      selectedOrders.includes(order.id)
    );
    
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
      setCurrentStep('review');
    } else {
      showError('Error en optimización', result.error || 'No se pudo optimizar la ruta', 5000);
      setCurrentStep('select');
    }
  };

  const handleSaveRoute = async () => {
    if (!currentOrganization || !multiDeliveryData?.optimized_route) return;
    
    setSaving(true);
    const optimizedRoute = multiDeliveryData.optimized_route;
    
    // Mapear datos para createRoute (simplificado)
    const routeData = {
      route_info: {
        origin: {
          lat: startLocation!.lat,
          lon: startLocation!.lng,
          name: startLocation!.address
        },
        destination: {
          lat: optimizedRoute.stops[optimizedRoute.stops.length - 1]?.location.lat || 0,
          lon: optimizedRoute.stops[optimizedRoute.stops.length - 1]?.location.lng || 0,
          name: optimizedRoute.stops[optimizedRoute.stops.length - 1]?.location.address || 'Destino'
        },
        waypoints: optimizedRoute.stops.map((stop, index) => ({
          lat: stop.location.lat,
          lon: stop.location.lng,
          name: stop.location.address,
          waypoint_type: stop.stop_type,
          waypoint_index: index
        })),
        total_waypoints: optimizedRoute.stops.length,
        optimized_waypoints: optimizedRoute.stops.map((stop, index) => ({
          lat: stop.location.lat,
          lon: stop.location.lng,
          name: stop.location.address,
          waypoint_type: stop.stop_type,
          waypoint_index: index
        })),
        visit_order: optimizedRoute.stops.map((stop, index) => ({
          name: stop.location.address,
          waypoint_index: index,
          order_id: stop.order?.id || null,
          waypoint_type: stop.stop_type
        }))
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
        points: optimizedRoute.route_points?.map((point, index) => ({
          lat: point.lat,
          lon: point.lng,
          name: point.instruction || `Punto ${index + 1}`,
          traffic_delay: point.traffic_delay || 0,
          speed: 35,
          congestion_level: point.traffic_delay > 60 ? 'severe' : 
                          point.traffic_delay > 30 ? 'heavy' : 
                          point.traffic_delay > 15 ? 'moderate' : 
                          point.traffic_delay > 5 ? 'light' : 'free_flow',
          waypoint_type: 'route' as const,
          waypoint_index: null
        })) || [],
        route_id: `multi-delivery-${Date.now()}`,
        visit_order: optimizedRoute.stops.map((stop, index) => ({
          name: stop.location.address,
          waypoint_index: index,
          order_id: stop.order?.id || null,
          waypoint_type: stop.stop_type
        })),
        optimized_waypoints: optimizedRoute.stops.map((stop, index) => ({
          lat: stop.location.lat,
          lon: stop.location.lng,
          name: stop.location.address,
          waypoint_type: stop.stop_type,
          waypoint_index: index
        }))
      },
      alternative_routes: [],
      request_info: {
        origin: {
          lat: startLocation!.lat,
          lon: startLocation!.lng,
          name: startLocation!.address
        },
        destination: {
          lat: optimizedRoute.stops[optimizedRoute.stops.length - 1]?.location.lat || 0,
          lon: optimizedRoute.stops[optimizedRoute.stops.length - 1]?.location.lng || 0,
          name: optimizedRoute.stops[optimizedRoute.stops.length - 1]?.location.address || 'Destino'
        },
        waypoints: optimizedRoute.stops.map((stop, index) => ({
          lat: stop.location.lat,
          lon: stop.location.lng,
          name: stop.location.address,
          waypoint_type: stop.stop_type,
          waypoint_index: index
        }))
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
        routeName: `Ruta ${currentOrganization.name} - ${new Date().toLocaleDateString()}`,
        description: `Ruta optimizada con ${selectedOrders.length} pedidos`
      });
      
      if (result.success) {
        success(
          '¡Ruta guardada exitosamente!',
          `La ruta con ${selectedOrders.length} pedidos ha sido guardada.`,
          5000
        );
        setRouteSaved(true);
        
        if (!asPage) {
          onRouteCreated();
          onClose();
        }
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

  const handleStartLocationSelect = (location: PickupLocation) => {
    setStartLocation(location);
  };

  // Memoizar los datos del mapa
  const ordersForMap = useMemo(() => getOrdersForMap(), [getOrdersForMap]);

  if (!currentOrganization) {
    return null;
  }

  if (!pickupLocation) {
    return (
      <div className={asPage ? "p-4 sm:p-6 md:p-8" : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"}>
        <div className="rounded-xl shadow max-w-md w-full mx-auto p-6 text-center theme-bg-3">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 theme-text-warning" />
          <h3 className="text-lg font-semibold mb-2 theme-text-primary">Ubicación no configurada</h3>
          <p className="mb-4 theme-text-secondary">Configura la ubicación de tu sucursal para continuar.</p>
          <Button onClick={onClose} variant="primary">
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={asPage ? "p-4 sm:p-6 md:p-8" : "fixed inset-0 flex items-center justify-center z-50 p-4"}>
        <div className="rounded-xl shadow max-w-md w-full mx-auto p-6 text-center theme-bg-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 theme-border-primary"></div>
          <p className="theme-text-secondary">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={asPage ? "min-h-screen theme-bg-1" : "fixed inset-0 flex items-center justify-center z-50 p-1 sm:p-4"}>
      <div 
        className={asPage ? "w-full max-w-[1600px] mx-auto flex flex-col min-h-screen" : "rounded-xl shadow-2xl max-w-[95vw] w-full h-[95vh] sm:h-[90vh] flex flex-col theme-bg-3"}
      >
        {/* Header con contador de pasos */}
        <div className="p-3 sm:p-6 border-b theme-divider">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-xl font-semibold theme-text-primary">Crear Ruta de Mandados</h3>
              <p className="text-xs sm:text-sm theme-text-secondary mt-1">Proceso simple en 3 pasos</p>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
              {asPage ? (
                <>
                  <BackIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                  <span className="hidden sm:inline">Volver</span>
                </>
              ) : (
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
          </div>
          
          {/* Contador de pasos compacto */}
          <div className="flex items-center justify-between">
            {/* Steps compactos */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {steps.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isCompleted = index < currentStepIndex;
                return (
                  <div
                    key={step.key}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-200 ${
                      isCompleted 
                        ? 'theme-btn-primary' 
                        : isActive 
                          ? 'theme-btn-primary' 
                          : 'theme-bg-2 theme-text-muted'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Información del paso actual - Solo en desktop */}
            <div className="hidden sm:block text-right">
              <h4 className="text-sm font-medium theme-text-primary">{stepInfo.title}</h4>
              <p className="text-xs theme-text-secondary">{stepInfo.description}</p>
            </div>
            
            {/* Información del paso actual - Mobile */}
            <div className="sm:hidden text-right">
              <span className="text-xs theme-text-secondary">Paso {currentStepIndex + 1}/{steps.length}</span>
            </div>
          </div>
        </div>
        
        <div className={asPage ? "" : "overflow-y-auto flex-1"}>
          <div className="p-2 sm:p-4 md:p-6">
            {/* Paso 1: Selección de pedidos */}
            {currentStep === 'select' && (
              <div className="space-y-3 sm:space-y-4">
                {/* Header compacto */}
                <div className="text-center mb-3">
                  <h4 className="text-base sm:text-lg font-semibold theme-text-primary mb-1">Selecciona los pedidos</h4>
                  <p className="text-xs sm:text-sm theme-text-secondary">
                    {selectedOrders.length} de {orders.length} pedidos seleccionados
                  </p>
                </div>

                {/* Mapa de selección - como en formulario público */}
                <div className="bg-white rounded-lg border theme-border overflow-hidden" style={{ borderColor: colors.border }}>
                  <div className="h-96 sm:h-[28rem] lg:h-[32rem] relative">
                    <IndividualRoutesMap
                      pickupLocation={pickupLocation}
                      orders={ordersForMap}
                      selectedOrders={selectedOrders}
                      onOrderSelection={handleOrderSelection}
                      onSelectAll={handleSelectAll}
                      onClearAll={handleClearAll}
                      searchTerm=""
                      onSearchChange={() => {}}
                      startLocation={startLocation}
                      onStartLocationSelect={handleStartLocationSelect}
                      colors={colors}
                    />
                  </div>
                </div>

                {/* Instrucciones compactas */}
                <div className="p-2 sm:p-3 rounded-lg theme-bg-2 theme-border border">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 theme-text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-xs font-medium theme-text-primary mb-1">Instrucciones</h5>
                      <ul className="text-xs theme-text-secondary space-y-0.5">
                        <li>• Haz clic en el mapa para seleccionar la ubicación inicial</li>
                        <li>• Usa los checkboxes para seleccionar/deseleccionar pedidos</li>
                        <li>• Todos los pedidos están seleccionados por defecto</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Botones de acción compactos */}
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleSelectAll}
                      variant="outline"
                      disabled={selectedOrders.length === orders.length}
                      className="w-full sm:w-auto text-xs sm:text-sm px-3 py-2"
                    >
                      Seleccionar Todos
                    </Button>
                    <Button
                      onClick={handleClearAll}
                      variant="outline"
                      disabled={selectedOrders.length === 0}
                      className="w-full sm:w-auto text-xs sm:text-sm px-3 py-2"
                    >
                      Limpiar Selección
                    </Button>
                  </div>
                  <Button
                    onClick={executeCurrentStepAction}
                    disabled={!stepInfo.canNext}
                    variant="primary"
                    className="w-full sm:w-auto text-xs sm:text-sm px-4 py-2"
                  >
                    Optimizar Ruta
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Paso 2: Optimizando */}
            {currentStep === 'optimize' && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-6 theme-border-primary"></div>
                <h4 className="text-lg font-semibold theme-text-primary mb-2">Optimizando ruta...</h4>
                <p className="text-sm theme-text-secondary">
                  Calculando la mejor ruta para {selectedOrders.length} pedidos
                </p>
              </div>
            )}

            {/* Paso 3: Revisar y guardar */}
            {currentStep === 'review' && (
              <div className="space-y-3 sm:space-y-4">
                {/* Header compacto */}
                <div className="text-center">
                  <h4 className="text-lg font-semibold theme-text-primary mb-1">Ruta Optimizada</h4>
                  <p className="text-sm theme-text-secondary">
                    {multiDeliveryData?.optimized_route ? 
                      `${multiDeliveryData.optimized_route.orders_delivered || 0} pedidos optimizados` : 
                      'Preparando ruta...'
                    }
                  </p>
                </div>

                {multiDeliveryLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 theme-border-primary"></div>
                    <p className="theme-text-secondary">Optimizando ruta...</p>
                  </div>
                ) : multiDeliveryData?.optimized_route ? (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Mapa de la ruta optimizada - como en formulario público */}
                    <div className="bg-white rounded-lg border theme-border overflow-hidden" style={{ borderColor: colors.border }}>
                      <div className="h-96 sm:h-[28rem] lg:h-[32rem] relative">
                        <MultiDeliveryRouteMap
                          optimizedRoute={multiDeliveryData.optimized_route}
                          className="w-full h-full"
                        />
                      </div>
                    </div>

                    {/* Estadísticas de la ruta - más compactas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg theme-bg-2">
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold theme-text-primary">
                          {multiDeliveryData.optimized_route.total_distance?.toFixed(1) || '0'} km
                        </div>
                        <div className="text-xs theme-text-secondary">Distancia</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold theme-text-primary">
                          {Math.round(multiDeliveryData.optimized_route.total_time || 0)} min
                        </div>
                        <div className="text-xs theme-text-secondary">Tiempo</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold theme-text-primary">
                          {multiDeliveryData.optimized_route.orders_delivered || 0}
                        </div>
                        <div className="text-xs theme-text-secondary">Pedidos</div>
                      </div>
                    </div>

                    {/* Orden de paradas optimizado */}
                    <div className="p-3 sm:p-4 rounded-lg theme-bg-2 border theme-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Navigation className="w-4 h-4 theme-text-primary" />
                        <h5 className="text-sm font-medium theme-text-primary">Orden de Paradas Optimizado</h5>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {multiDeliveryData.optimized_route.stops?.map((stop, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 rounded-lg theme-bg-3 border theme-border"
                          >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full theme-btn-primary flex items-center justify-center text-xs font-bold theme-text-primary">
                              {stop.stop_number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium theme-text-primary">
                                  {stop.stop_type === 'start' ? '🚀 Inicio' :
                                   stop.stop_type === 'pickup' ? '📦 Recogida' :
                                   stop.stop_type === 'delivery' ? '🏁 Entrega' :
                                   '🏁 Fin'}
                                </span>
                                {stop.order && (
                                  <span className="text-xs theme-text-secondary">
                                    (Pedido #{stop.order.order_number})
                                  </span>
                                )}
                              </div>
                              <p className="text-xs theme-text-secondary truncate">
                                {stop.location.address}
                              </p>
                              <div className="flex items-center gap-3 text-xs theme-text-muted mt-1">
                                <span>Distancia: {stop.distance_from_previous?.toFixed(1) || '0'} km</span>
                                <span>Tiempo: {Math.round(stop.estimated_time || 0)} min</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botones de acción compactos */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                      <Button
                        onClick={() => setCurrentStep('select')}
                        disabled={routeSaved}
                        variant="outline"
                        className="w-full sm:w-auto text-xs sm:text-sm px-3 py-2"
                      >
                        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        {routeSaved ? 'Ruta Guardada' : 'Volver a Editar'}
                      </Button>
                      <Button
                        onClick={handleSaveRoute}
                        disabled={saving || routeSaved}
                        variant="primary"
                        loading={saving}
                        className="w-full sm:w-auto text-xs sm:text-sm px-4 py-2"
                      >
                        {routeSaved ? (
                          <>
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Ruta Guardada
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Guardar Ruta
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3 theme-text-warning" />
                    <h3 className="text-base font-semibold theme-text-primary mb-2">Error en la optimización</h3>
                    <p className="text-sm theme-text-secondary mb-4">No se pudo optimizar la ruta. Inténtalo de nuevo.</p>
                    <Button
                      onClick={() => setCurrentStep('select')}
                      variant="primary"
                      className="text-xs sm:text-sm px-3 py-2"
                    >
                      <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Volver a Editar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
