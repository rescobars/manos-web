'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { XCircle, Route, AlertCircle, MapPin, Package, Clock, ArrowLeft, ArrowRight, CheckCircle, Info, Truck, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useMultiDeliveryOptimization } from '@/hooks/useMultiDeliveryOptimization';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useRouteCreation } from '@/hooks/useRouteCreation';
import { ordersApiService } from '@/lib/api/orders';
import { BRANCH_LOCATION } from '@/lib/constants';
import { LocationSelectorMap, MultiDeliveryRouteMap } from '@/components/ui/leaflet';
import { IndividualRoutesMap } from '@/components/ui/leaflet/IndividualRoutesMap';
import { useDrivers } from '@/hooks/useDrivers';
import { organizationMembersApiService } from '@/lib/api/organization-members';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

type FlowStep = 'select' | 'locations' | 'review' | 'assign';

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
  const [selectedPilot, setSelectedPilot] = useState<string>('');
  const [pilotNotes, setPilotNotes] = useState<string>('');
  const [routeSaved, setRouteSaved] = useState<boolean>(false);
  const [createdRouteUuid, setCreatedRouteUuid] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [driverNotes, setDriverNotes] = useState<string>('');
  const [optimizationMode, setOptimizationMode] = useState<'efficiency' | 'order'>('efficiency');
  const [assigning, setAssigning] = useState<boolean>(false);
  const [assignmentSuccess, setAssignmentSuccess] = useState<boolean>(false);
  
  // Estados para multi-delivery
  const [startLocation, setStartLocation] = useState<PickupLocation | null>(null);
  const [endLocation, setEndLocation] = useState<PickupLocation | null>(null);
  const [useMultiDelivery, setUseMultiDelivery] = useState<boolean>(true);
  
  // Estados para parámetros de regreso
  const [forceReturnToEnd, setForceReturnToEnd] = useState<boolean>(false);
  const [maxReturnDistance, setMaxReturnDistance] = useState<number>(3.0);

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

  // Drivers hook
  const { drivers, isLoading: driversLoading, error: driversError, fetchDrivers } = useDrivers();

  // Cargar conductores reales de la organización
  useEffect(() => {
    if (currentOrganization?.uuid) {
      fetchDrivers(currentOrganization.uuid);
    }
  }, [currentOrganization, fetchDrivers]);

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
      title: 'Seleccionar Pedidos',
      description: 'Elige los pedidos que quieres incluir en la ruta',
      icon: Package,
      canNext: selectedOrders.length > 0,
      nextText: 'Continuar'
    },
    {
      key: 'locations',
      title: 'Seleccionar Ubicaciones',
      description: 'Elige el punto de inicio y fin de la ruta',
      icon: MapPin,
      canNext: !!(startLocation && endLocation),
      nextText: 'Optimizar Ruta'
    },
    {
      key: 'review',
      title: 'Revisar Ruta',
      description: 'Revisa la ruta optimizada antes de guardarla',
      icon: Route,
      canNext: !!(multiDeliveryData && !routeSaved),
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
        console.log('📝 Moving to locations step for multi-delivery');
        setCurrentStep('locations');
        break;
        
      case 'locations':
        if (startLocation && endLocation) {
          console.log('📝 Moving to review step for multi-delivery');
          setCurrentStep('review');
          setTimeout(() => {
            handleOptimizeMultiDelivery();
          }, 100);
        } else {
          showError('Ubicaciones requeridas', 'Debes seleccionar tanto la ubicación de inicio como la de fin para continuar.', 3000);
        }
        break;
        
      case 'review':
        if (multiDeliveryData && !routeSaved) {
          await handleSaveRoute();
        } else if (!multiDeliveryData) {
          await handleOptimizeMultiDelivery();
        }
        break;
        
      case 'assign':
        // Asignar ruta
        await handleAssignRoute();
        break;
    }
  };


  const handleOptimizeMultiDelivery = async () => {
    console.log('🚀 handleOptimizeMultiDelivery called');
    console.log('🔍 selectedOrders:', selectedOrders);
    console.log('🔍 startLocation:', startLocation);
    console.log('🔍 endLocation:', endLocation);
    console.log('🔍 startLocation lat/lng:', startLocation?.lat, startLocation?.lng);
    console.log('🔍 endLocation lat/lng:', endLocation?.lat, endLocation?.lng);
    
    if (selectedOrders.length < 1 || !startLocation || !endLocation) {
      console.log('❌ Early return: missing required data');
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

    console.log('🔍 Delivery orders:', deliveryOrders);
    console.log('🔍 Sending to API - startLocation:', startLocation);
    console.log('🔍 Sending to API - endLocation:', endLocation);

    const result = await optimizeMultiDelivery(
      startLocation,
      endLocation,
      deliveryOrders,
      {
        include_traffic: true,
        departure_time: 'now',
        travel_mode: 'car',
        route_type: 'fastest',
        max_orders_per_trip: 10,
        force_return_to_end: forceReturnToEnd,
        max_return_distance: maxReturnDistance
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
    
    const optimizedRoute = multiDeliveryData.optimized_route;
    
    // Mapear stops a waypoints (puntos de parada)
    const waypoints = optimizedRoute.stops
      .filter(stop => stop.order) // Solo paradas con pedidos
      .map(stop => ({
        lat: stop.location.lat,
        lon: stop.location.lng,
        name: stop.location.address,
        waypoint_type: stop.stop_type,
        waypoint_index: stop.stop_number - 1 // Ajustar índice
      }));

    // Mapear route_points a points (puntos de navegación detallados)
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
        speed: null,
        congestion_level: congestionLevel,
        waypoint_type: 'route' as const,
        waypoint_index: undefined
      };
    }) || [];

    // Mapear stops ordenados a visit_order
    const visitOrder = optimizedRoute.stops
      .filter(stop => stop.order)
      .map((stop, index) => ({
        name: stop.location.address,
        waypoint_index: index,
        order_id: stop.order?.id || `order-${index}` // Incluir order_id
      }));

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
        destination: endLocation ? {
          lat: endLocation.lat,
          lon: endLocation.lng,
          name: endLocation.address
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
        destination: endLocation ? {
          lat: endLocation.lat,
          lon: endLocation.lng,
          name: endLocation.address
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
        routeName: `Multi-Delivery ${currentOrganization.name} - ${new Date().toLocaleDateString()}`,
        description: `Ruta optimizada multi-delivery con ${selectedOrders.length} pedidos`
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
      setAssigning(true);
      setAssignmentSuccess(false);

      const assignmentData = {
        start_time: startTime || new Date().toISOString(),
        end_time: endTime || '',
        driver_notes: driverNotes || undefined,
        driver_instructions: undefined as Record<string, any> | undefined,
      };

      const response = await organizationMembersApiService.assignRouteToDriver(
        createdRouteUuid,
        selectedDriver,
        assignmentData,
        currentOrganization?.uuid
      );

      if (response.success) {
        setAssignmentSuccess(true);
        success(
          '¡Ruta asignada!',
          `Asignada a ${drivers.find(d => d.organization_membership_uuid === selectedDriver)?.name}`,
          4000
        );
        if (!asPage) {
          onRouteCreated();
          onClose();
        }
      } else {
        showError(
          'No se pudo asignar',
          response.error || 'Intenta de nuevo más tarde',
          6000
        );
      }
      
    } catch (error) {
      showError(
        'Error al asignar la ruta',
        'No se pudo asignar la ruta al conductor. Por favor, inténtalo de nuevo.',
        6000
      );
    } finally {
      setAssigning(false);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl shadow-2xl max-w-md w-full p-6 text-center theme-bg-3" style={{ backgroundColor: colors.background3 }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.buttonPrimary1 }}></div>
            <p className="theme-text-secondary">Cargando pedidos...</p>
          </div>
        </div>
      )
    );
  }

  return (
    <div className={asPage ? "p-4 sm:p-6 md:p-8" : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"}>
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
              <h3 className={asPage ? "text-lg sm:text-xl lg:text-2xl font-semibold theme-text-primary" : "text-base sm:text-lg font-semibold theme-text-primary"}>Crear Nueva Ruta</h3>
              <p className="text-xs sm:text-sm theme-text-secondary mt-1">Selecciona pedidos y crea una ruta optimizada</p>
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
          <div className={asPage ? "flex items-center justify-between h-12 sm:h-14 px-3 sm:px-4 lg:px-6 theme-bg-2 sticky top-0 z-20" : "flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 theme-bg-2"} style={{ backgroundColor: colors.background2 }}>
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.buttonPrimary1 }}>
                <stepInfo.icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: colors.buttonText }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={asPage ? "text-base sm:text-lg lg:text-xl font-semibold theme-text-primary truncate" : "text-lg sm:text-xl font-semibold theme-text-primary truncate"}>{stepInfo.title}</h1>
                <p className="text-xs sm:text-sm theme-text-secondary truncate">{stepInfo.description}</p>
              </div>
            </div>
            
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
              {asPage && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={goBack}
                    disabled={!canGoBack}
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-2 ${
                      canGoBack
                        ? 'theme-text-secondary hover:theme-text-primary hover:theme-bg-2'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Atrás</span>
                  </button>
              <button
                onClick={executeCurrentStepAction}
                disabled={!stepInfo.canNext || (currentStep === 'assign' && assigning)}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-2 ${
                  stepInfo.canNext && !(currentStep === 'assign' && assigning)
                    ? 'shadow-sm hover:shadow-md theme-btn-primary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={stepInfo.canNext && !(currentStep === 'assign' && assigning) ? { backgroundColor: colors.buttonPrimary1, color: colors.buttonText } : undefined}
              >
                <span className="truncate text-xs sm:text-sm">{currentStep === 'assign' && assigning ? 'Asignando...' : stepInfo.nextText}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              </button>
                </div>
              )}
            </div>
          </div>

          {/* Contenido del paso actual */}
          <div className={asPage ? "p-3 sm:p-4 lg:p-6" : "p-4 sm:p-6 overflow-y-auto flex-1"}>
            {currentStep === 'select' && (
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Información del tipo de ruta */}
                <div className="p-4 rounded-lg border" style={{ borderColor: colors.border, backgroundColor: colors.background2 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-5 h-5" style={{ color: colors.buttonPrimary1 }} />
                    <h3 className="text-lg font-semibold theme-text-primary">Multi-Delivery</h3>
                  </div>
                  <p className="text-sm theme-text-secondary">
                    Optimización punto a punto con ubicaciones de inicio y fin personalizadas
                  </p>
                </div>

                {/* Selección del modo de optimización */}
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold theme-text-primary">Modo de optimización</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Modo Eficiencia */}
                    <div 
                      className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200`}
                      style={{
                        borderColor: optimizationMode === 'efficiency' ? colors.buttonPrimary1 : colors.border,
                        backgroundColor: optimizationMode === 'efficiency' ? colors.background2 : colors.background3,
                        boxShadow: optimizationMode === 'efficiency' ? `0 0 0 2px ${colors.buttonPrimary2}33` : undefined
                      }}
                      onClick={() => setOptimizationMode('efficiency')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <Route className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: colors.buttonPrimary1 }} />
                            <h4 className="font-semibold theme-text-primary text-sm sm:text-base">Mejor Eficiencia</h4>
                            <div className="relative group">
                              <Info className="w-3 h-3 sm:w-4 sm:h-4 theme-text-muted cursor-help flex-shrink-0" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10"
                                   style={{ backgroundColor: colors.background1, color: colors.textPrimary, border: `1px solid ${colors.border}` }}>
                                Optimiza la ruta para minimizar tiempo y distancia total
                              </div>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm theme-text-secondary">
                            El algoritmo reorganiza los pedidos para encontrar la ruta más corta y eficiente, reduciendo tiempo de entrega y combustible.
                          </p>
                        </div>
                        <div className="w-5 h-5 rounded border-2 flex items-center justify-center" style={{ borderColor: optimizationMode === 'efficiency' ? colors.buttonPrimary1 : colors.border, backgroundColor: optimizationMode === 'efficiency' ? colors.buttonPrimary1 : 'transparent' }}>
                          {optimizationMode === 'efficiency' && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.buttonText }}></div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Modo Orden */}
                    <div 
                      className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200`}
                      style={{
                        borderColor: optimizationMode === 'order' ? colors.buttonPrimary1 : colors.border,
                        backgroundColor: optimizationMode === 'order' ? colors.background2 : colors.background3,
                        boxShadow: optimizationMode === 'order' ? `0 0 0 2px ${colors.buttonPrimary2}33` : undefined
                      }}
                      onClick={() => setOptimizationMode('order')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: colors.buttonPrimary1 }} />
                            <h4 className="font-semibold theme-text-primary text-sm sm:text-base">Orden de Llegada</h4>
                            <div className="relative group">
                              <Info className="w-3 h-3 sm:w-4 sm:h-4 theme-text-muted cursor-help flex-shrink-0" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10"
                                   style={{ backgroundColor: colors.background1, color: colors.textPrimary, border: `1px solid ${colors.border}` }}>
                                Mantiene el orden en que llegaron los pedidos
                              </div>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm theme-text-secondary">
                            Respeta el orden cronológico de los pedidos, entregando primero los que llegaron antes.
                          </p>
                        </div>
                        <div className="w-5 h-5 rounded border-2 flex items-center justify-center" style={{ borderColor: optimizationMode === 'order' ? colors.buttonPrimary1 : colors.border, backgroundColor: optimizationMode === 'order' ? colors.buttonPrimary1 : 'transparent' }}>
                          {optimizationMode === 'order' && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.buttonText }}></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mapa básico de pedidos seleccionados */}
                {selectedOrders.length > 0 && pickupLocation && (
                  <div className="space-y-4">
                    <div className={asPage ? "h-[60vh] rounded-lg overflow-hidden shadow-sm" : "h-[28rem] rounded-lg overflow-hidden shadow-sm"}>
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

            {currentStep === 'locations' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold theme-text-primary mb-2">Seleccionar Ubicaciones</h3>
                  <p className="text-sm theme-text-secondary">
                    Haz clic en el mapa para seleccionar el punto de inicio y fin de la ruta
                  </p>
                </div>

                <div className="h-96 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
                  <LocationSelectorMap
                    startLocation={startLocation}
                    endLocation={endLocation}
                    onStartLocationSelect={handleStartLocationSelect}
                    onEndLocationSelect={handleEndLocationSelect}
                    className="w-full h-full"
                  />
                </div>

                {/* Información de ubicaciones seleccionadas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border" style={{ borderColor: colors.border, backgroundColor: colors.background2 }}>
                    <h4 className="font-medium theme-text-primary mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      Punto de Inicio
                    </h4>
                    {startLocation ? (
                      <p className="text-sm theme-text-secondary">{startLocation.address}</p>
                    ) : (
                      <p className="text-sm theme-text-muted">No seleccionado</p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg border" style={{ borderColor: colors.border, backgroundColor: colors.background2 }}>
                    <h4 className="font-medium theme-text-primary mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      Punto de Fin
                    </h4>
                    {endLocation ? (
                      <p className="text-sm theme-text-secondary">{endLocation.address}</p>
                    ) : (
                      <p className="text-sm theme-text-muted">No seleccionado</p>
                    )}
                  </div>
                </div>

                {/* Parámetros de regreso */}
                <div className="space-y-4">
                  <h4 className="font-medium theme-text-primary flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Parámetros de Regreso
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Forzar regreso */}
                    <div className="p-4 rounded-lg border" style={{ borderColor: colors.border, backgroundColor: colors.background2 }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium theme-text-primary mb-1">Forzar Regreso</h5>
                          <p className="text-xs theme-text-secondary">
                            El conductor debe regresar siempre al punto final
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={forceReturnToEnd}
                            onChange={(e) => setForceReturnToEnd(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Distancia máxima de regreso */}
                    <div className="p-4 rounded-lg border" style={{ borderColor: colors.border, backgroundColor: colors.background2 }}>
                      <h5 className="font-medium theme-text-primary mb-2">Distancia Máxima de Regreso</h5>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0.5"
                          max="20"
                          step="0.5"
                          value={maxReturnDistance}
                          onChange={(e) => setMaxReturnDistance(parseFloat(e.target.value))}
                          className="flex-1 px-3 py-2 border rounded-md text-sm"
                          style={{ 
                            borderColor: colors.border, 
                            backgroundColor: colors.background1,
                            color: colors.textPrimary
                          }}
                          disabled={forceReturnToEnd}
                        />
                        <span className="text-sm theme-text-secondary">km</span>
                      </div>
                      <p className="text-xs theme-text-muted mt-1">
                        {forceReturnToEnd 
                          ? 'Regreso forzado activado' 
                          : `Regresará automáticamente si está a menos de ${maxReturnDistance}km del final`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Información de comportamiento */}
                  <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background2 }}>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-xs">💡</span>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium theme-text-primary mb-1">Comportamiento de Regreso:</p>
                        <ul className="text-xs theme-text-secondary space-y-1">
                          <li>• <strong>Conductores independientes:</strong> Regreso opcional basado en distancia</li>
                          <li>• <strong>Empresas de delivery:</strong> Regreso forzado siempre</li>
                          <li>• <strong>Flexible:</strong> Regreso automático si está cerca del final</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'review' && (
              <div className="space-y-6">
                {multiDeliveryLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.buttonPrimary1 }}></div>
                    <p className="theme-text-secondary">Optimizando ruta multi-delivery...</p>
                  </div>
                ) : multiDeliveryData?.optimized_route ? (
                  <div className={asPage ? "h-[60vh]" : "h-96"}>
                    <MultiDeliveryRouteMap
                      optimizedRoute={multiDeliveryData.optimized_route}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.warning }} />
                    <h3 className="text-lg font-semibold theme-text-primary mb-2">Error en la optimización</h3>
                    <p className="theme-text-secondary">No se pudo optimizar la ruta multi-delivery. Inténtalo de nuevo.</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'assign' && (
              <div className="space-y-6">
                <div className="rounded-lg p-4" style={{ backgroundColor: colors.background1, border: `1px solid ${colors.success}33` }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" style={{ color: colors.success }} />
                    <span className="font-medium" style={{ color: colors.textPrimary }}>Ruta creada exitosamente</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    La ruta con {selectedOrders.length} pedidos ha sido guardada. Ahora asigna un conductor.
                  </p>
                </div>

                {/* Selección de conductor */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold theme-text-primary">Seleccionar Conductor</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {drivers.map((driver) => (
                      <div
                        key={driver.organization_membership_uuid}
                        onClick={() => setSelectedDriver(driver.organization_membership_uuid)}
                        className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200`}
                        style={{
                          borderColor: selectedDriver === driver.organization_membership_uuid ? colors.buttonPrimary1 : colors.border,
                          backgroundColor: selectedDriver === driver.organization_membership_uuid ? colors.background2 : (driver.status === 'ACTIVE' ? colors.background3 : colors.background2),
                          opacity: driver.status === 'ACTIVE' ? 1 : 0.6,
                          boxShadow: selectedDriver === driver.organization_membership_uuid ? `0 0 0 2px ${colors.buttonPrimary2}33` : undefined,
                          cursor: driver.status === 'ACTIVE' ? 'pointer' as const : 'not-allowed'
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium theme-text-primary text-sm sm:text-base truncate">{driver.name}</h4>
                            <p className="text-xs sm:text-sm theme-text-secondary mt-1 truncate">{driver.email}</p>
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0" style={{ backgroundColor: driver.status === 'ACTIVE' ? colors.success : colors.error }}></div>
                              <span className="text-xs theme-text-secondary">
                                {driver.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                          </div>
                          <div className="w-5 h-5 rounded border-2 flex items-center justify-center" style={{ borderColor: selectedDriver === driver.organization_membership_uuid ? colors.buttonPrimary1 : colors.border, backgroundColor: selectedDriver === driver.organization_membership_uuid ? colors.buttonPrimary1 : 'transparent' }}>
                            {selectedDriver === driver.organization_membership_uuid && (
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.buttonText }}></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notas adicionales */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium theme-text-primary">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={driverNotes}
                    onChange={(e) => setDriverNotes(e.target.value)}
                    placeholder="Instrucciones especiales para el conductor..."
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-none theme-text-primary text-xs sm:text-sm"
                    style={{ 
                      borderColor: colors.border, 
                      backgroundColor: colors.background3,
                      color: colors.textPrimary,
                      boxShadow: `0 0 0 2px transparent` 
                    }}
                    rows={2}
                  />
                </div>

                {/* Resumen de la asignación */}
                {selectedDriver && (
                  <div className="rounded-lg p-3 sm:p-4" style={{ backgroundColor: colors.background1, border: `1px solid ${colors.info}33` }}>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: colors.info }} />
                      <span className="font-medium text-sm sm:text-base" style={{ color: colors.textPrimary }}>Resumen de asignación</span>
                    </div>
                    <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm theme-text-secondary space-y-1">
                      <p className="truncate">Conductor: <strong>{drivers.find(d => d.organization_membership_uuid === selectedDriver)?.name}</strong></p>
                      <p>Pedidos: <strong>{selectedOrders.length}</strong></p>
                      <p className="truncate">Ruta: <strong>{createdRouteUuid}</strong></p>
                    </div>
                    {assignmentSuccess && (
                      <div className="mt-3 rounded-md p-3" style={{ backgroundColor: colors.background1, border: `1px solid ${colors.success}66` }}>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" style={{ color: colors.success }} />
                          <span className="text-sm" style={{ color: colors.textPrimary }}>Ruta asignada correctamente</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botones de navegación inferiores: solo en modal */}
        {!asPage && (
          <div 
            className="p-4 sm:p-6 border-t theme-divider"
            style={{ 
              borderColor: colors.divider,
              backgroundColor: colors.background2 
            }}
          >
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <button
                onClick={goBack}
                disabled={!canGoBack}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-2 ${
                  canGoBack
                    ? 'theme-text-secondary hover:theme-text-primary hover:theme-bg-2'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Atrás</span>
              </button>
              
              <button
                onClick={executeCurrentStepAction}
                disabled={!stepInfo.canNext}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-2 ${
                  stepInfo.canNext
                    ? 'shadow-lg hover:shadow-xl theme-btn-primary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={stepInfo.canNext ? { backgroundColor: colors.buttonPrimary1, color: colors.buttonText } : undefined}
              >
                <span className="truncate">{stepInfo.nextText}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Toasts locales */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
