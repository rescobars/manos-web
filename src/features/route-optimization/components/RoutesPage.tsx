'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Page } from '@/components/ui/Page';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { SavedRoute } from '@/types';
import { Plus, Route, Clock, Users, CheckCircle, AlertCircle, XCircle, MapPin, Package, Truck, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { StatCard } from '@/components/ui/StatCard';
import Link from 'next/link';

export default function RoutesPage() {
  const { colors } = useDynamicTheme();
  const { currentOrganization } = useAuth();
  const { success, error: showError, toasts, removeToast } = useToast();
  const router = useRouter();
  
  // Estados para rutas
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [allRoutes, setAllRoutes] = useState<SavedRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('PLANNED');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | undefined>(undefined);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Estados para modales
  const [showCreateRouteModal, setShowCreateRouteModal] = useState(false);

  // Función para obtener rutas filtradas
  const fetchRoutes = useCallback(async (status?: string, page: number = 1, limit: number = 10) => {
    if (!currentOrganization) return;

    setRoutesLoading(true);
    setRoutesError(null);

    try {
      let apiUrl = '/api/routes';
      const queryParams = new URLSearchParams();
      
      if (status) queryParams.append('status', status);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (queryParams.toString()) {
        apiUrl += `?${queryParams.toString()}`;
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': currentOrganization.uuid,
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Agregar valores por defecto para campos faltantes
        const routesWithDefaults = result.data.map((route: any) => ({
          ...route,
          status: route.status || 'PLANNED',
          priority: route.priority || 'MEDIUM',
          created_at: route.created_at || new Date().toISOString(),
          updated_at: route.updated_at || new Date().toISOString(),
          orders: route.orders || []
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
  }, [currentOrganization]);

  // Función para obtener todas las rutas (para contadores)
  const fetchAllRoutes = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const apiUrl = '/api/routes?limit=1000';
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': currentOrganization.uuid,
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        const routesWithDefaults = result.data.map((route: any) => ({
          ...route,
          status: route.status || 'PLANNED',
          priority: route.priority || 'MEDIUM',
          created_at: route.created_at || new Date().toISOString(),
          updated_at: route.updated_at || new Date().toISOString(),
          orders: route.orders || []
        }));
        setAllRoutes(routesWithDefaults);
      }
    } catch (err) {
      console.error('Error fetching all routes:', err);
    }
  }, [currentOrganization]);

  // Cargar rutas al cargar la página
  useEffect(() => {
    if (currentOrganization) {
      fetchAllRoutes();
      fetchRoutes('PLANNED', 1, itemsPerPage);
    }
  }, [currentOrganization, itemsPerPage, fetchAllRoutes, fetchRoutes]);

  // Función para cambiar filtro desde las tarjetas KPI
  const handleFilterChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    const status = newStatus === 'all' ? undefined : newStatus;
    fetchRoutes(status, 1, itemsPerPage);
  };

  // Función para cambiar página
  const handlePageChange = (page: number) => {
    const status = filterStatus === 'all' ? undefined : filterStatus;
    fetchRoutes(status, page, itemsPerPage);
  };

  // Función para cambiar elementos por página
  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    const status = filterStatus === 'all' ? undefined : filterStatus;
    fetchRoutes(status, 1, newLimit);
  };

  // Función para ordenar
  const handleSort = (key: keyof SavedRoute, direction: 'asc' | 'desc') => {
    const status = filterStatus === 'all' ? undefined : filterStatus;
    fetchRoutes(status, 1);
  };

  // Funciones para modales
  const handleCreateRoute = () => {
    setShowCreateRouteModal(true);
  };

  const handleCloseCreateRouteModal = () => {
    setShowCreateRouteModal(false);
  };

  const handleViewRoute = (route: SavedRoute) => {
    router.push(`./routes/${route.uuid}`);
  };


  // Función para refrescar rutas después de crear una nueva
  const handleRouteCreated = () => {
    if (currentOrganization) {
      fetchAllRoutes();
      const status = filterStatus === 'all' ? undefined : filterStatus;
      fetchRoutes(status, 1, itemsPerPage);
    }
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
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
      default: return priority;
    }
  };

  // Columnas para la tabla
  const columns = [
    {
      key: 'route_name' as keyof SavedRoute,
      label: 'Nombre',
      sortable: true,
      className: 'w-24 sm:w-32 lg:w-48',
      render: (value: any) => (
        <div className="font-medium theme-text-primary truncate text-xs sm:text-sm">{value}</div>
      )
    },
    {
      key: 'status' as keyof SavedRoute,
      label: 'Estado',
      sortable: true,
      className: 'w-16 sm:w-20 lg:w-32',
      render: (value: any) => (
        <span className={`inline-flex items-center gap-1 px-1 sm:px-1.5 lg:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${getRouteStatusColor(value)}`}>
          <span className="hidden sm:inline">{getRouteStatusText(value)}</span>
          <span className="sm:hidden">{getRouteStatusText(value).charAt(0)}</span>
        </span>
      )
    },
    {
      key: 'priority' as keyof SavedRoute,
      label: 'Prioridad',
      sortable: true,
      className: 'w-16 sm:w-20 lg:w-32',
      render: (value: any) => (
        <span className={`inline-flex items-center gap-1 px-1 sm:px-1.5 lg:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${getPriorityColor(value)}`}>
          <span className="hidden sm:inline">{getPriorityText(value)}</span>
          <span className="sm:hidden">{getPriorityText(value).charAt(0)}</span>
        </span>
      )
    },
    {
      key: 'origin_name' as keyof SavedRoute,
      label: 'Origen',
      sortable: true,
      className: 'w-24 sm:w-32 lg:w-48',
      render: (value: any) => (
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm theme-text-secondary">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: colors.buttonPrimary1 }} />
          <span className="truncate">{value}</span>
        </div>
      )
    },
    {
      key: 'orders' as keyof SavedRoute,
      label: 'Pedidos',
      sortable: true,
      className: 'w-12 sm:w-16 lg:w-24',
      render: (value: any) => (
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
          <Package className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
          <span>{value?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'traffic_delay' as keyof SavedRoute,
      label: 'Retraso',
      sortable: true,
      className: 'w-12 sm:w-16 lg:w-24',
      render: (value: any) => (
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
          <span>{Math.round((value || 0) / 60)}min</span>
        </div>
      )
    },
    {
      key: 'actions' as keyof SavedRoute,
      label: 'Acciones',
      sortable: false,
      className: 'w-16 sm:w-20 lg:w-32',
      render: (value: any, route: SavedRoute) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleViewRoute(route)}
            className="px-1.5 sm:px-2 lg:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
            title="Ver detalles"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Ver</span>
          </button>
        </div>
      )
    }
  ];

  // Función para renderizar items en grid
  const gridItemRender = (route: SavedRoute, index: number) => (
    <div
      key={route.id}
      className="rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200 theme-bg-3 border"
      style={{
        backgroundColor: colors.background3,
        borderColor: colors.border
      }}
    >
      {/* Header con título y estado */}
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-semibold theme-text-primary truncate mb-1">{route.route_name}</h4>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium border ${getRouteStatusColor(route.status)}`}>
              <span className="hidden sm:inline">{getRouteStatusText(route.status)}</span>
              <span className="sm:hidden">{getRouteStatusText(route.status).charAt(0)}</span>
            </span>
            <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(route.priority)}`}>
              <span className="hidden sm:inline">{getPriorityText(route.priority)}</span>
              <span className="sm:hidden">{getPriorityText(route.priority).charAt(0)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Información básica compacta */}
      <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs theme-text-secondary">
          <MapPin className="w-3 h-3 theme-info flex-shrink-0" />
          <span className="truncate">{route.origin_name}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs theme-text-secondary">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Package className="w-3 h-3 theme-success flex-shrink-0" />
            <span>{route.orders.length} pedidos</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Clock className="w-3 h-3 theme-warning flex-shrink-0" />
            <span>{Math.round(route.traffic_delay / 60)}min</span>
          </div>
        </div>
      </div>

      {/* Acciones compactas */}
      <div className="flex items-center justify-between pt-2 border-t theme-divider">
        <span className="text-xs theme-text-muted truncate">ID: {route.uuid.slice(0, 8)}</span>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewRoute(route)}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
            title="Ver detalles"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Ver</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!currentOrganization) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: colors.background1 }}
      >
        <div className="text-center">
          <AlertCircle 
            className="w-12 h-12 mx-auto mb-4" 
            style={{ color: colors.warning }}
          />
          <h1 className="text-2xl font-bold theme-text-primary mb-3">Selecciona una organización</h1>
          <p className="theme-text-secondary">Necesitas seleccionar una organización para gestionar rutas</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Page
        title="Gestión de Rutas"
        subtitle={`Administra las rutas de ${currentOrganization.name}`}
      >
        {/* Header con botón de crear ruta - Ya está en Page, pero mantenemos el botón adicional */}
        <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3">
          <div className="flex justify-end">
            <Link href={{ pathname: './route-optimization/create' }}>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Crear Ruta</span>
                <span className="sm:hidden">Crear</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards - Clickables para filtrar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 px-2 sm:px-4 lg:px-6 xl:px-8">
          <div 
            onClick={() => handleFilterChange('all')}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
              filterStatus === 'all' ? 'ring-2' : ''
            }`}
            style={{
              '--tw-ring-color': filterStatus === 'all' ? colors.buttonPrimary1 : 'transparent'
            } as React.CSSProperties}
          >
            <StatCard
              title="Total Rutas"
              value={allRoutes.length}
              icon={Route}
              iconColor={colors.textPrimary}
              iconBgColor={colors.background2}
            />
          </div>
          
          <div 
            onClick={() => handleFilterChange('PLANNED')}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
              filterStatus === 'PLANNED' ? 'ring-2' : ''
            }`}
            style={{
              '--tw-ring-color': filterStatus === 'PLANNED' ? colors.info : 'transparent'
            } as React.CSSProperties}
          >
            <StatCard
              title="Planificadas"
              value={allRoutes.filter(route => route.status === 'PLANNED').length}
              icon={Clock}
              iconColor={colors.info}
              iconBgColor={colors.info + '20'}
            />
          </div>
          
          <div 
            onClick={() => handleFilterChange('ASSIGNED')}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
              filterStatus === 'ASSIGNED' ? 'ring-2' : ''
            }`}
            style={{
              '--tw-ring-color': filterStatus === 'ASSIGNED' ? colors.warning : 'transparent'
            } as React.CSSProperties}
          >
            <StatCard
              title="Asignadas"
              value={allRoutes.filter(route => route.status === 'ASSIGNED').length}
              icon={Package}
              iconColor={colors.warning}
              iconBgColor={colors.warning + '20'}
            />
          </div>
          
          <div 
            onClick={() => handleFilterChange('IN_PROGRESS')}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
              filterStatus === 'IN_PROGRESS' ? 'ring-2' : ''
            }`}
            style={{
              '--tw-ring-color': filterStatus === 'IN_PROGRESS' ? colors.success : 'transparent'
            } as React.CSSProperties}
          >
            <StatCard
              title="En Progreso"
              value={allRoutes.filter(route => route.status === 'IN_PROGRESS').length}
              icon={Truck}
              iconColor={colors.success}
              iconBgColor={colors.success + '20'}
            />
          </div>
          
          <div 
            onClick={() => handleFilterChange('COMPLETED')}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
              filterStatus === 'COMPLETED' ? 'ring-2' : ''
            }`}
            style={{
              '--tw-ring-color': filterStatus === 'COMPLETED' ? colors.success : 'transparent'
            } as React.CSSProperties}
          >
            <StatCard
              title="Completadas"
              value={allRoutes.filter(route => route.status === 'COMPLETED').length}
              icon={CheckCircle}
              iconColor={colors.success}
              iconBgColor={colors.success + '20'}
            />
          </div>
        </div>

        {/* DataTable con paginación */}
        <div className="px-2 sm:px-4 lg:px-6 xl:px-8">
          {routesError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
              <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-red-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Error al cargar rutas</h3>
              <p className="text-sm sm:text-base text-red-700">{routesError}</p>
            </div>
          ) : (
            <DataTable
              data={routes}
              columns={columns}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSort={handleSort}
              loading={routesLoading}
              emptyMessage="No hay rutas disponibles"
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              gridColumns={2}
              gridItemRender={gridItemRender}
            />
          )}
        </div>
      </Page>

      {/* Toast Container para notificaciones */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      {/* Modales */}
      {/* Creación ahora es una página dedicada */}
    </>
  );
}
