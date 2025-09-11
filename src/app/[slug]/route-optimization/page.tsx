'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApiService } from '@/lib/api/orders';
import { Order } from '@/types';
import { IndividualRoutesMap } from '@/components/ui/IndividualRoutesMap';
import { Page } from '@/components/ui/Page';
import { Route, AlertCircle, Map, Navigation, Save, ArrowLeft, ArrowRight, Users, CheckCircle, Grid, List, Search, Filter, Plus, Clock, MapPin, Package, UserPlus, Eye, XCircle } from 'lucide-react';
import { BRANCH_LOCATION } from '@/lib/constants';
import TrafficOptimizedRouteMap from '@/components/ui/TrafficOptimizedRouteMap';

import { useTrafficOptimization } from '@/hooks/useTrafficOptimization';
import { useRouteCreation } from '@/hooks/useRouteCreation';
import { useDrivers } from '@/hooks/useDrivers';
import { Driver, organizationMembersApiService } from '@/lib/api/organization-members';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { DataTable } from '@/components/ui/DataTable';
import { SavedRoute } from '@/types';

interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

type FlowStep = 'select' | 'review' | 'assign';

export default function RouteOptimizationPage() {
  const { currentOrganization } = useAuth();
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
  const [activeTab, setActiveTab] = useState<'create' | 'routes'>('create');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [routesSearchTerm, setRoutesSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('PLANNED');
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | undefined>(undefined);

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
  
  // Hook para conductores
  const { drivers, isLoading: driversLoading, error: driversError, fetchDrivers } = useDrivers();

  // Función para obtener rutas del API
  const fetchRoutes = async (status?: string, page: number = 1) => {
    if (!currentOrganization) return;

    setRoutesLoading(true);
    setRoutesError(null);

    try {
      let apiUrl = '/api/routes';
      const queryParams = new URLSearchParams();
      
      if (status) queryParams.append('status', status);
      queryParams.append('page', page.toString());
      queryParams.append('limit', '20');
      
      if (queryParams.toString()) {
        apiUrl += `?${queryParams.toString()}`;
      }

      console.log('🌐 Fetching routes:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': currentOrganization.uuid,
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Agregar valores por defecto para status y priority
        const routesWithDefaults = result.data.map((route: any) => ({
          ...route,
          status: route.status || 'PLANNED',
          priority: route.priority || 'MEDIUM'
        }));
        
        setRoutes(routesWithDefaults);
        setPagination(result.pagination);
        setRoutesError(null);
      } else {
        setRoutesError(result.error || 'Error al obtener las rutas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setRoutesError(errorMessage);
    } finally {
      setRoutesLoading(false);
    }
  };

  // Cargar rutas guardadas cuando se cambia a la pestaña de rutas
  useEffect(() => {
    if (activeTab === 'routes' && currentOrganization) {
      fetchRoutes('PLANNED', 1);
    }
  }, [activeTab, currentOrganization]);

  // Cargar drivers cuando se llega al paso de asignación
  useEffect(() => {
    if (currentStep === 'assign' && currentOrganization) {
      fetchDrivers(currentOrganization.uuid);
    }
  }, [currentStep, currentOrganization, fetchDrivers]);

  // Debug: Log cuando cambie el createdRouteUuid
  useEffect(() => {
    console.log('createdRouteUuid changed:', createdRouteUuid);
  }, [createdRouteUuid]);

  // Función para cambiar filtro
  const handleFilterChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    const status = newStatus === 'all' ? undefined : newStatus;
    fetchRoutes(status, 1);
  };

  // Función para cambiar página
  const handlePageChange = (page: number) => {
    const status = filterStatus === 'all' ? undefined : filterStatus;
    fetchRoutes(status, page);
  };

  // Función para ordenar
  const handleSort = (key: keyof SavedRoute, direction: 'asc' | 'desc') => {
    // Por ahora solo recargamos, pero se puede implementar ordenamiento en el backend
    const status = filterStatus === 'all' ? undefined : filterStatus;
    fetchRoutes(status, 1);
  };

  // Función para ver ruta
  const handleViewRoute = (route: SavedRoute) => {
    console.log('Ver ruta:', route);
    success('Ruta cargada', `Se ha cargado la ruta "${route.route_name}" para visualización.`, 3000);
  };

  // Función para asignar ruta desde la tabla
  const handleAssignRouteFromTable = (route: SavedRoute) => {
    console.log('Asignar ruta:', route);
    success('Ruta asignada', `Se ha asignado la ruta "${route.route_name}" a un conductor.`, 3000);
  };

  // Funciones de utilidad para colores y textos
  const getRouteStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PAUSED': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRouteStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'Planificada';
      case 'ASSIGNED': return 'Asignada';
      case 'IN_PROGRESS': return 'En Progreso';
      case 'COMPLETED': return 'Completada';
      case 'CANCELLED': return 'Cancelada';
      case 'PAUSED': return 'Pausada';
      default: return 'Desconocida';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Baja';
      case 'MEDIUM': return 'Media';
      case 'HIGH': return 'Alta';
      case 'URGENT': return 'Urgente';
      default: return 'Media';
    }
  };

  // Filtrar rutas basado en búsqueda (el estado ya se filtra en el backend)
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.route_name.toLowerCase().includes(routesSearchTerm.toLowerCase()) ||
                         route.description?.toLowerCase().includes(routesSearchTerm.toLowerCase());
    return matchesSearch;
  });

  // Definir columnas para la tabla
  const columns = [
    {
      key: 'route_name' as keyof SavedRoute,
      label: 'Ruta',
      sortable: true,
      render: (value: string, item: SavedRoute) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
        </div>
      )
    },
    {
      key: 'status' as keyof SavedRoute,
      label: 'Estado',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRouteStatusColor(value)}`}>
          {getRouteStatusText(value)}
        </span>
      )
    },
    {
      key: 'priority' as keyof SavedRoute,
      label: 'Prioridad',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(value)}`}>
          {getPriorityText(value)}
        </span>
      )
    },
    {
      key: 'origin_name' as keyof SavedRoute,
      label: 'Origen',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="truncate">{value}</span>
        </div>
      )
    },
    {
      key: 'orders' as keyof SavedRoute,
      label: 'Pedidos',
      sortable: true,
      render: (value: any[]) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="w-4 h-4 text-green-500" />
          <span>{value?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'traffic_delay' as keyof SavedRoute,
      label: 'Retraso',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>{Math.round(value / 60)} min</span>
        </div>
      )
    },
    {
      key: 'created_at' as keyof SavedRoute,
      label: 'Creada',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'actions' as keyof SavedRoute,
      label: 'Acciones',
      sortable: false,
      render: (value: any, item: SavedRoute) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewRoute(item)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" />
          </button>
          {item.status === 'PLANNED' && (
            <button
              onClick={() => handleAssignRouteFromTable(item)}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Asignar ruta"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

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

  // Función para ejecutar la acción del paso actual
  const executeCurrentStepAction = async () => {
    switch (currentStep) {
      case 'select':
        // Ir a revisión y ejecutar optimización automáticamente
        setCurrentStep('review');
        // Ejecutar optimización automáticamente
        setTimeout(() => {
          handleOptimizeRoute();
        }, 100);
        break;
        
      case 'review':
        // Si ya está optimizada y no se ha guardado, guardar ruta
        if (trafficOptimizedRoute && !routeSaved) {
          await handleSaveRoute();
        } else if (!trafficOptimizedRoute) {
          // Si hay error, reintentar optimización
          await handleOptimizeRoute();
        }
        // Si ya está guardada, no hacer nada
        break;
        
      case 'assign':
        // Asignar ruta
        await handleAssignRoute();
        break;
    }
  };

  const handleOptimizeRoute = async () => {
    if (selectedOrders.length < 1 || !pickupLocation) return;
    
    const selectedOrdersData = ordersForMap.filter(order => 
      selectedOrders.includes(order.id)
    );

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

    const result = await optimizeRouteWithTraffic(origin, destination, waypoints, true, queueMode);
    
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
        // Capturar el UUID de la ruta creada
        const routeUuid = result.data?.route_id;
        console.log('Route creation result:', result);
        console.log('Route UUID captured:', routeUuid);
        
        if (routeUuid) {
          setCreatedRouteUuid(routeUuid);
          console.log('Route UUID set in state:', routeUuid);
        } else {
          console.error('No route_id found in response:', result);
        }
        
        success(
          '¡Ruta guardada exitosamente!',
          `La ruta optimizada con ${selectedOrders.length} pedidos ha sido guardada.`,
          5000
        );
        setCurrentStep('assign');
      } else {
        showErrorToast(
          'Error al guardar la ruta',
          result.error || 'No se pudo guardar la ruta. Por favor, inténtalo de nuevo.',
          6000
        );
      }
    } catch (error) {
      showErrorToast(
        'Error inesperado',
        'Ocurrió un error inesperado al guardar la ruta. Por favor, inténtalo de nuevo.',
        6000
      );
    }
  };

  const handleAssignRoute = async () => {
    if (!selectedPilot) {
      showErrorToast('Selecciona un piloto', 'Debes seleccionar un piloto para asignar la ruta.', 3000);
      return;
    }

    console.log('Current createdRouteUuid:', createdRouteUuid);
    
    if (!createdRouteUuid) {
      showErrorToast('Error de ruta', 'No se encontró el UUID de la ruta creada.', 3000);
      return;
    }

    // Encontrar el driver seleccionado
    const selectedDriver = drivers.find(driver => driver.user_uuid === selectedPilot);
    if (!selectedDriver) {
      showErrorToast('Error de conductor', 'No se encontró la información del conductor seleccionado.', 3000);
      return;
    }

    const driverName = selectedDriver.name;

    try {
      // Calcular tiempos por defecto si no están establecidos
      const now = new Date();
      const defaultStartTime = startTime || new Date(now.getTime() + 30 * 60000).toISOString(); // 30 min desde ahora
      const defaultEndTime = endTime || new Date(now.getTime() + 2 * 60 * 60000).toISOString(); // 2 horas desde ahora

      const assignmentData = {
        start_time: defaultStartTime,
        end_time: defaultEndTime,
        driver_notes: pilotNotes || `Ruta asignada el ${new Date().toLocaleString()}`,
        driver_instructions: {
          mode: queueMode ? 'cronologico' : 'eficiencia',
          special_handling: pilotNotes || 'Ninguna instrucción especial'
        }
      };

      const result = await organizationMembersApiService.assignRouteToDriver(
        createdRouteUuid,
        selectedDriver.organization_membership_uuid,
        assignmentData,
        currentOrganization?.uuid
      );

      if (result.success) {
        success(
          'Ruta asignada exitosamente',
          `La ruta ha sido asignada al piloto ${driverName}.`,
          5000
        );
        
        // Resetear el flujo
        setCurrentStep('select');
        setSelectedPilot('');
        setPilotNotes('');
        setCreatedRouteUuid('');
        setStartTime('');
        setEndTime('');
        clearTrafficResult();
      } else {
        showErrorToast(
          'Error al asignar la ruta',
          result.error || 'No se pudo asignar la ruta al conductor.',
          6000
        );
      }
    } catch (error) {
      console.error('Error assigning route:', error);
      showErrorToast(
        'Error inesperado',
        'Ocurrió un error inesperado al asignar la ruta. Por favor, inténtalo de nuevo.',
        6000
      );
    }
  };

  const goBack = () => {
    // No permitir regresar si la ruta ya fue guardada o si estamos en asignar
    if (routeSaved || currentStep === 'assign') return;
    
    switch (currentStep) {
      case 'review':
        setCurrentStep('select');
        break;
    }
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case 'select':
        return {
          title: 'Seleccionar Pedidos',
          description: 'Selecciona los pedidos y modo de optimización',
          icon: Map,
          canNext: selectedOrders.length > 0,
          nextText: 'Optimizar y Revisar'
        };
      case 'review':
        return {
          title: 'Revisar y Guardar',
          description: 'Revisa la ruta optimizada y guárdala en el sistema',
          icon: Save,
          canNext: !isCreatingRoute && trafficOptimizedRoute && !routeSaved,
          nextText: isCreatingRoute ? 'Guardando...' : routeSaved ? 'Ruta Guardada' : 'Guardar Ruta'
        };
      case 'assign':
        return {
          title: 'Asignar Piloto',
          description: 'Asigna la ruta a un piloto disponible',
          icon: Users,
          canNext: selectedPilot !== '' && !driversLoading && drivers.length > 0,
          nextText: driversLoading ? 'Cargando...' : drivers.length === 0 ? 'Sin conductores' : 'Asignar Ruta'
        };
    }
  };

  const canGoBack = currentStep !== 'select' && !routeSaved && currentStep !== 'assign';
  const stepInfo = getStepInfo();
  
  // Definir los pasos y el índice actual
  const steps = ['select', 'review', 'assign'];
  const currentStepIndex = steps.indexOf(currentStep);

  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Route className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Selecciona una organización</h1>
          <p className="text-gray-600">Necesitas seleccionar una organización para crear rutas</p>
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
        title="Gestion de Rutas"
        subtitle={`Gestion de rutas para ${currentOrganization.name}`}
      >
        <div className="min-h-screen bg-gray-50">
          {/* Header con pestañas */}
          <div className="bg-white border-b border-gray-200">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              {/* Pestañas */}
              <div className="flex space-x-8 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'create'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    Crear Ruta
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('routes')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'routes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Mis Rutas
                  </div>
                </button>
              </div>
              
              {/* Información del paso actual (solo en pestaña crear) */}
              {activeTab === 'create' && (
                <div className="flex items-center justify-between h-16">
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
              )}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {activeTab === 'create' ? (
                <>
                  {/* Botones de navegación en la parte superior */}
                  <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
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

                  {/* Contenido del paso actual */}
                  <div className="p-8">
                {currentStep === 'select' && (
                  <div className="space-y-8">
                    {/* Opciones de optimización */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Modo de optimización</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="relative flex items-start p-4 bg-white rounded-lg border-2 cursor-pointer hover:border-blue-300 transition-colors">
                          <input
                            type="radio"
                            name="queueMode"
                            checked={queueMode}
                            onChange={() => setQueueMode(true)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 ${
                            queueMode ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                          }`}>
                            {queueMode && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Cronológico</div>
                            <div className="text-sm text-gray-500">Mantener orden de recepción</div>
                          </div>
                        </label>
                        
                        <label className="relative flex items-start p-4 bg-white rounded-lg border-2 cursor-pointer hover:border-blue-300 transition-colors">
                          <input
                            type="radio"
                            name="queueMode"
                            checked={!queueMode}
                            onChange={() => setQueueMode(false)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 ${
                            !queueMode ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                          }`}>
                            {!queueMode && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Eficiencia</div>
                            <div className="text-sm text-gray-500">Optimizar tiempo y distancia</div>
                          </div>
                        </label>
                      </div>
                    </div>

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
                )}

                {currentStep === 'review' && (
                  <div className="space-y-8">
                    {isTrafficOptimizing ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Optimizando ruta...</h3>
                        <p className="text-gray-600 text-center max-w-md">
                          Estamos calculando la mejor ruta para {selectedOrders.length} pedidos
                          <br />
                          <span className="text-blue-600 font-medium">Modo: {queueMode ? 'Cronológico' : 'Eficiencia'}</span>
                        </p>
                      </div>
                    ) : trafficOptimizedRoute ? (
                      <div className="space-y-6">
                        <div className={`border rounded-lg p-6 ${
                          routeSaved 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              routeSaved 
                                ? 'bg-blue-100' 
                                : 'bg-green-100'
                            }`}>
                              <CheckCircle className={`w-5 h-5 ${
                                routeSaved 
                                  ? 'text-blue-600' 
                                  : 'text-green-600'
                              }`} />
                            </div>
                            <div>
                              <h4 className={`font-semibold ${
                                routeSaved 
                                  ? 'text-blue-900' 
                                  : 'text-green-900'
                              }`}>
                                {routeSaved ? 'Ruta guardada exitosamente' : 'Ruta optimizada generada'}
                              </h4>
                              <p className={`text-sm ${
                                routeSaved 
                                  ? 'text-blue-700' 
                                  : 'text-green-700'
                              }`}>
                                Modo: {queueMode ? 'Cronológico' : 'Eficiencia'} 
                                {routeSaved ? ' - La ruta ya fue guardada en el sistema' : ' - Revisa la ruta y guárdala cuando estés listo'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <TrafficOptimizedRouteMap
                          trafficOptimizedRoute={trafficOptimizedRoute}
                          showAlternatives={true}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                          <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error en la optimización</h3>
                        <p className="text-gray-600 text-center max-w-md">
                          {trafficError || 'No se pudo generar la ruta optimizada. Por favor, inténtalo de nuevo.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 'assign' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Información de la ruta */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Detalles de la Ruta</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <span className="text-gray-600">Pedidos:</span>
                            <span className="font-semibold text-blue-600">{selectedOrders.length}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <span className="text-gray-600">Modo:</span>
                            <span className="font-semibold text-gray-900">{queueMode ? 'Cronológico' : 'Eficiencia'}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <span className="text-gray-600">Route UUID:</span>
                            <span className="font-mono text-xs text-gray-500">{createdRouteUuid || 'No disponible'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Selector de piloto */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Asignar Piloto</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Piloto disponible
                            </label>
                            {driversLoading ? (
                              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                                <span className="text-gray-600">Cargando conductores...</span>
                              </div>
                            ) : driversError ? (
                              <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-700">
                                Error al cargar conductores: {driversError}
                              </div>
                            ) : drivers.length === 0 ? (
                              <div className="w-full px-4 py-3 border border-yellow-300 rounded-lg bg-yellow-50 text-yellow-700">
                                No hay conductores disponibles en esta organización
                              </div>
                            ) : (
                              <select
                                value={selectedPilot}
                                onChange={(e) => setSelectedPilot(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                              >
                                <option value="">Selecciona un piloto...</option>
                                {drivers.map((driver) => (
                                  <option key={driver.user_uuid} value={driver.user_uuid}>
                                    {driver.name} - {driver.status === 'ACTIVE' ? 'Disponible' : 'Inactivo'}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Hora de inicio
                            </label>
                            <input
                              type="datetime-local"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Hora de fin estimada
                            </label>
                            <input
                              type="datetime-local"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Notas adicionales (opcional)
                            </label>
                            <textarea
                              value={pilotNotes}
                              onChange={(e) => setPilotNotes(e.target.value)}
                              placeholder="Instrucciones especiales para el piloto..."
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                </>
              ) : (
                /* Pestaña de Mis Rutas */
                <div className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Rutas</h2>
                    <p className="text-gray-600">Administra y visualiza las rutas de {currentOrganization?.name}</p>
                  </div>

                  {/* Header con controles */}
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Filtros */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-gray-500" />
                          <select
                            value={filterStatus}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="all">Todas las rutas</option>
                            <option value="PLANNED">Planificadas</option>
                            <option value="ASSIGNED">Asignadas</option>
                            <option value="IN_PROGRESS">En Progreso</option>
                            <option value="COMPLETED">Completadas</option>
                            <option value="CANCELLED">Canceladas</option>
                            <option value="PAUSED">Pausadas</option>
                          </select>
                        </div>
                      </div>

                      {/* Controles de vista y acciones */}
                      <div className="flex items-center gap-3">
                        {/* Toggle de vista */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-colors ${
                              viewMode === 'table'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                            title="Vista de tabla"
                          >
                            <List className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-colors ${
                              viewMode === 'grid'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                            title="Vista de cuadrícula"
                          >
                            <Grid className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Botón crear nueva ruta */}
                        <button
                          onClick={() => setActiveTab('create')}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Nueva Ruta
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas por estado */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas por Estado</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Planificadas</p>
                            <p className="text-xl font-bold text-blue-800">
                              {routes.filter(route => route.status === 'PLANNED').length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Asignadas</p>
                            <p className="text-xl font-bold text-purple-800">
                              {routes.filter(route => route.status === 'ASSIGNED').length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Route className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-green-600 font-medium">En Progreso</p>
                            <p className="text-xl font-bold text-green-800">
                              {routes.filter(route => route.status === 'IN_PROGRESS').length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-emerald-600 font-medium">Completadas</p>
                            <p className="text-xl font-bold text-emerald-800">
                              {routes.filter(route => route.status === 'COMPLETED').length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-orange-600 font-medium">Pausadas</p>
                            <p className="text-xl font-bold text-orange-800">
                              {routes.filter(route => route.status === 'PAUSED').length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-xs text-red-600 font-medium">Canceladas</p>
                            <p className="text-xl font-bold text-red-800">
                              {routes.filter(route => route.status === 'CANCELLED').length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de rutas */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {routesError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar rutas</h3>
                        <p className="text-red-700">{routesError}</p>
                      </div>
                    ) : viewMode === 'table' ? (
                      <DataTable
                        data={filteredRoutes}
                        columns={columns}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onSort={handleSort}
                        loading={routesLoading}
                        emptyMessage="No hay rutas disponibles"
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {routesLoading ? (
                          <div className="col-span-full flex items-center justify-center py-12">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                              <p className="text-gray-600">Cargando rutas...</p>
                            </div>
                          </div>
                        ) : filteredRoutes.length === 0 ? (
                          <div className="col-span-full bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay rutas disponibles</h3>
                            <p className="text-gray-600">No se encontraron rutas con los filtros seleccionados.</p>
                          </div>
                        ) : (
                          filteredRoutes.map((route) => (
                            <div
                              key={route.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                            >
                              {/* Header con título y estado */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">{route.route_name}</h4>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRouteStatusColor(route.status)}`}>
                                      {getRouteStatusText(route.status)}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(route.priority)}`}>
                                      {getPriorityText(route.priority)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={() => handleViewRoute(route)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Ver detalles"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  
                                  {route.status === 'PLANNED' && (
                                    <button
                                      onClick={() => handleAssignRouteFromTable(route)}
                                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                      title="Asignar ruta"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Información básica compacta */}
                              <div className="space-y-2 mb-3">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                  <span className="truncate">{route.origin_name}</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-3 h-3 text-green-500" />
                                    <span>{route.orders.length} pedidos</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-orange-500" />
                                    <span>{Math.round(route.traffic_delay / 60)}min</span>
                                  </div>
                                </div>
                              </div>

                              {/* Acciones compactas */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-500">ID: {route.uuid.slice(0, 8)}</span>
                                
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleViewRoute(route)}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                                  >
                                    Ver
                                  </button>
                                  
                                  {route.status === 'PLANNED' && (
                                    <button
                                      onClick={() => handleAssignRouteFromTable(route)}
                                      className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
                                    >
                                      Asignar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Page>
      
      {/* Toast Container para notificaciones */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}