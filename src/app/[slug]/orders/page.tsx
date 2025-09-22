'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApiService } from '@/lib/api/orders';
import { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useToast } from '@/hooks/useToast';
import { OrderDetail } from '@/components/ui/OrderDetail';
import { QuickOrderScreen } from '@/components/ui/QuickOrderScreen';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { Page } from '@/components/ui/Page';
import { useOrders } from '@/hooks/useOrders';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle,
  Plus,
  Map,
  MapPin,
  DollarSign,
  Calendar,
  Eye
} from 'lucide-react';

export default function OrdersPage() {
  const { colors } = useDynamicTheme();
  const { currentOrganization } = useAuth();
  const { success, error: showError, toasts, removeToast } = useToast();
  const { 
    orders, 
    allOrders, 
    loading, 
    error, 
    pagination, 
    fetchOrders, 
    fetchAllOrders 
  } = useOrders();
  
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Cargar pedidos cuando se monta el componente
  useEffect(() => {
    if (currentOrganization) {
      // Cargar todos los pedidos para contadores KPI
      fetchAllOrders(currentOrganization.uuid);
      // Cargar pedidos filtrados para visualización
      fetchOrders(currentOrganization.uuid, {
        status: filterStatus,
        page: 1,
        limit: itemsPerPage
      });
    }
  }, [currentOrganization, filterStatus, itemsPerPage, fetchOrders, fetchAllOrders]);

  // Función para cambiar filtro desde las tarjetas KPI
  const handleFilterChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    if (currentOrganization) {
      fetchOrders(currentOrganization.uuid, {
        status: newStatus === 'all' ? undefined : newStatus,
        page: 1,
        limit: itemsPerPage
      });
    }
  };

  // Función para cambiar página
  const handlePageChange = (page: number) => {
    if (currentOrganization) {
      fetchOrders(currentOrganization.uuid, {
        status: filterStatus === 'all' ? undefined : filterStatus,
        page,
        limit: itemsPerPage
      });
    }
  };

  // Función para cambiar elementos por página
  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    if (currentOrganization) {
      fetchOrders(currentOrganization.uuid, {
        status: filterStatus === 'all' ? undefined : filterStatus,
        page: 1,
        limit: newLimit
      });
    }
  };

  // Función para ordenar
  const handleSort = (key: keyof Order, direction: 'asc' | 'desc') => {
    if (currentOrganization) {
      fetchOrders(currentOrganization.uuid, {
        status: filterStatus === 'all' ? undefined : filterStatus,
        page: 1,
        limit: itemsPerPage,
        sortBy: key as string,
        sortOrder: direction
      });
    }
  };

  const handleCreateOrder = async (data: any) => {
    try {
      const response = await ordersApiService.createOrder(data);
      
      if (response.success) {
        success('Pedido creado exitosamente');
        // Recargar pedidos
        if (currentOrganization) {
          fetchAllOrders(currentOrganization.uuid);
          fetchOrders(currentOrganization.uuid, {
            status: filterStatus === 'all' ? undefined : filterStatus,
            page: 1,
            limit: itemsPerPage
          });
        }
      } else {
        showError(response.error || 'Error al crear el pedido');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Error al crear el pedido');
    }
  };





  // Funciones de utilidad para colores y textos
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'IN_ROUTE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'ASSIGNED': return 'Asignado';
      case 'IN_ROUTE': return 'En Camino';
      case 'COMPLETED': return 'Completado';
      case 'CANCELLED': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrderForDetail(order);
    setIsDetailModalOpen(true);
  };

  const handleQuickOrder = () => {
    setIsQuickOrderOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrderForDetail(null);
  };

  const handleCloseQuickOrder = () => {
    setIsQuickOrderOpen(false);
  };

  // Definir columnas para la tabla
  const columns = [
    {
      key: 'order_number' as keyof Order,
      label: 'Pedido',
      sortable: true,
      className: 'w-1/4',
      render: (value: string, item: Order) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{value}</div>
          <div className="text-xs text-gray-500 truncate">{item.description}</div>
        </div>
      )
    },
    {
      key: 'status' as keyof Order,
      label: 'Estado',
      sortable: true,
      className: 'w-20',
      render: (value: string) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getOrderStatusColor(value)}`}>
          {getOrderStatusText(value)}
        </span>
      )
    },
    {
      key: 'total_amount' as keyof Order,
      label: 'Monto',
      sortable: true,
      className: 'w-20',
      render: (value: any) => (
        <div className="flex items-center gap-2 text-sm theme-text-secondary">
          <DollarSign className="w-4 h-4" style={{ color: colors.success }} />
          <span>Q{Number(value || 0).toFixed(2)}</span>
        </div>
      )
    },
    {
      key: 'pickup_address' as keyof Order,
      label: 'Recogida',
      sortable: true,
      className: 'w-1/5',
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm theme-text-secondary min-w-0">
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: colors.buttonPrimary1 }} />
          <span className="truncate">{value}</span>
        </div>
      )
    },
    {
      key: 'delivery_address' as keyof Order,
      label: 'Entrega',
      sortable: true,
      className: 'w-1/5',
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm theme-text-secondary min-w-0">
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: colors.error }} />
          <span className="truncate">{value}</span>
        </div>
      )
    },
    {
      key: 'created_at' as keyof Order,
      label: 'Creado',
      sortable: true,
      className: 'w-20',
      render: (value: string) => (
        <span className="text-xs theme-text-muted">
          {new Date(value).toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'actions' as keyof Order,
      label: 'Acciones',
      sortable: false,
      className: 'w-20',
      render: (value: any, item: Order) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewOrder(item)}
            className="px-2 py-1 text-white text-xs font-medium rounded transition-colors flex items-center gap-1 theme-btn-primary"
            title="Ver detalles"
          >
            <Eye className="w-3 h-3" />
            Ver
          </button>
        </div>
      )
    }
  ];

  // Calcular contadores para las tarjetas KPI
  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(order => order.status === 'PENDING').length;
  const assignedOrders = allOrders.filter(order => order.status === 'ASSIGNED').length;
  const inRouteOrders = allOrders.filter(order => order.status === 'IN_ROUTE').length;
  const completedOrders = allOrders.filter(order => order.status === 'COMPLETED').length;

  if (!currentOrganization) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: colors.background1 }}
      >
        <div className="text-center max-w-md">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            style={{ backgroundColor: colors.background3 }}
          >
            <Package 
              className="w-10 h-10" 
              style={{ color: colors.buttonPrimary1 }}
            />
          </div>
          <h1 className="text-2xl font-bold theme-text-primary mb-3">Selecciona una organización</h1>
          <p className="theme-text-secondary">Necesitas seleccionar una organización para gestionar los pedidos</p>
        </div>
      </div>
    );
  }


  // Si está abierto el QuickOrderScreen, mostrarlo en lugar del contenido normal
  if (isQuickOrderOpen) {
    return (
      <>
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
        <QuickOrderScreen
          organizationUuid={currentOrganization.uuid}
          onClose={handleCloseQuickOrder}
          onSubmit={handleCreateOrder}
        />
      </>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      <Page
        title="Pedidos"
        subtitle={`Gestiona los pedidos de ${currentOrganization.name}`}
      >
        {/* Header compacto con botón de crear pedido */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold theme-text-primary">Pedidos</h1>
              <p className="text-sm theme-text-secondary">{currentOrganization.name}</p>
            </div>
            <Button onClick={handleQuickOrder} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Crear Pedido
            </Button>
          </div>
        </div>
        {/* Stats Cards - Clickables para filtrar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-4 sm:px-6 lg:px-8">
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
              title="Total Pedidos"
              value={totalOrders}
              icon={Package}
            />
          </div>
          
          <div 
            onClick={() => handleFilterChange('PENDING')}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
              filterStatus === 'PENDING' ? 'ring-2' : ''
            }`}
            style={{
              '--tw-ring-color': filterStatus === 'PENDING' ? colors.warning : 'transparent'
            } as React.CSSProperties}
          >
            <StatCard
              title="Pendientes"
              value={pendingOrders}
              icon={Clock}
            />
          </div>
          
          <div 
            onClick={() => handleFilterChange('ASSIGNED')}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
              filterStatus === 'ASSIGNED' ? 'ring-2' : ''
            }`}
            style={{
              '--tw-ring-color': filterStatus === 'ASSIGNED' ? colors.info : 'transparent'
            } as React.CSSProperties}
          >
            <StatCard
              title="Asignados"
              value={assignedOrders}
              icon={Package}
            />
          </div>
          
          <div 
            onClick={() => handleFilterChange('IN_ROUTE')}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
              filterStatus === 'IN_ROUTE' ? 'ring-2' : ''
            }`}
            style={{
              '--tw-ring-color': filterStatus === 'IN_ROUTE' ? colors.buttonPrimary1 : 'transparent'
            } as React.CSSProperties}
          >
            <StatCard
              title="En Camino"
              value={inRouteOrders}
              icon={Truck}
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
              title="Entregados"
              value={completedOrders}
              icon={CheckCircle}
            />
          </div>
        </div>

        {/* DataTable con paginación */}
        <div className="px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 mb-2">Error al cargar pedidos</div>
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <DataTable
            data={orders}
            columns={columns}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSort={handleSort}
            loading={loading}
            emptyMessage="No hay pedidos disponibles"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            gridColumns={3}
            gridItemRender={(order, index) => (
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                {/* Header con número de pedido y estado */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">{order.order_number}</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                      title="Ver detalles"
                    >
                      <Eye className="w-3 h-3" />
                      Ver
                    </button>
                  </div>
                </div>

                {/* Información básica compacta */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <DollarSign className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span>Q{Number(order.total_amount || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{order.pickup_address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                    <span className="truncate">{order.delivery_address}</span>
                  </div>
                </div>

                {/* Fecha de creación */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  
                  <button
                    onClick={() => handleViewOrder(order)}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Ver
                  </button>
                </div>
              </div>
            )}
          />
        )}
        </div>
      </Page>

      {/* Order Detail Modal */}
      <OrderDetail
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        order={selectedOrderForDetail}
      />

    </>
  );
}
