'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApiService } from '@/lib/api/orders';
import { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useToast } from '@/hooks/useToast';
import { OrderDetail } from '@/components/ui/OrderDetail';
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
  MapPin,
  DollarSign,
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
  
  const [filterStatus, setFilterStatus] = useState<string>('REQUESTED');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
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






  // Funciones de utilidad para colores y textos
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'IN_ROUTE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderStatusStyle = (status: string) => {
    switch (status) {
      case 'REQUESTED': return {
        backgroundColor: '#f9731620',
        color: '#f97316',
        borderColor: '#f9731640'
      };
      case 'PENDING': return {
        backgroundColor: colors.warning + '20',
        color: colors.warning,
        borderColor: colors.warning + '40'
      };
      case 'ASSIGNED': return {
        backgroundColor: '#f9731620',
        color: '#f97316',
        borderColor: '#f9731640'
      };
      case 'IN_ROUTE': return {
        backgroundColor: colors.info + '20',
        color: colors.info,
        borderColor: colors.info + '40'
      };
      case 'COMPLETED': return {
        backgroundColor: colors.success + '20',
        color: colors.success,
        borderColor: colors.success + '40'
      };
      case 'CANCELLED': return {
        backgroundColor: colors.error + '20',
        color: colors.error,
        borderColor: colors.error + '40'
      };
      default: return {
        backgroundColor: colors.textMuted + '20',
        color: colors.textMuted,
        borderColor: colors.textMuted + '40'
      };
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'Solicitado';
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


  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrderForDetail(null);
  };


  // Función para aceptar un pedido (cambiar de REQUESTED a PENDING) con total_amount
  const handleAcceptOrder = async (orderId: string, totalAmount?: number) => {
    try {
      const updateData: any = { status: 'PENDING' };
      if (totalAmount !== undefined) {
        updateData.total_amount = totalAmount;
      }
      
      const response = await ordersApiService.updateOrder(orderId, updateData);
      
      if (response.success) {
        success('Pedido aceptado exitosamente');
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
        showError(response.error || 'Error al aceptar el pedido');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      showError('Error al aceptar el pedido');
    }
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
      className: 'w-28 min-w-[112px]',
      render: (value: string) => (
        <span 
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap"
          style={getOrderStatusStyle(value)}
        >
          {getOrderStatusText(value)}
        </span>
      )
    },
    {
      key: 'total_amount' as keyof Order,
      label: 'Monto',
      sortable: true,
      className: 'w-24 min-w-[96px]',
      render: (value: any) => (
        <div className="text-sm theme-text-secondary font-medium">
          Q{Number(value || 0).toFixed(2)}
        </div>
      )
    },
    {
      key: 'pickup_address' as keyof Order,
      label: 'Recogida',
      sortable: true,
      className: 'w-1/4 min-w-[200px]',
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
      className: 'w-1/4 min-w-[200px]',
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
      className: 'w-24 min-w-[96px]',
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
      className: 'w-28 min-w-[112px]',
      render: (value: any, item: Order) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewOrder(item)}
            className="px-2 py-1 text-white text-xs font-medium rounded transition-colors flex items-center gap-1 theme-btn-primary"
            title={item.status === 'REQUESTED' ? 'Aceptar pedido' : 'Ver detalles'}
          >
            <Eye className="w-3 h-3" />
            {item.status === 'REQUESTED' ? 'Aceptar' : 'Ver'}
          </button>
        </div>
      )
    }
  ];

  // Calcular contadores para las tarjetas KPI
  const totalOrders = allOrders.length;
  const requestedOrders = allOrders.filter(order => order.status === 'REQUESTED').length;
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



  return (
    <>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      <Page
        title="Pedidos"
        subtitle={`Gestiona los pedidos de ${currentOrganization.name}`}
      >
        {/* Header compacto */}
        <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-lg sm:text-xl font-bold theme-text-primary">Pedidos</h1>
              <p className="text-xs sm:text-sm theme-text-secondary truncate">{currentOrganization.name}</p>
            </div>
          </div>
        </div>
        {/* Stats Cards - Clickables para filtrar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 px-2 sm:px-4 lg:px-6 xl:px-8">
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
              iconColor={colors.textPrimary}
              iconBgColor={colors.background2}
            />
          </div>
          
          <div 
            onClick={() => handleFilterChange('REQUESTED')}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
              filterStatus === 'REQUESTED' ? 'ring-2' : ''
            }`}
            style={{
              '--tw-ring-color': filterStatus === 'REQUESTED' ? '#f97316' : 'transparent'
            } as React.CSSProperties}
          >
            <StatCard
              title="Solicitados"
              value={requestedOrders}
              icon={Package}
              iconColor="#f97316"
              iconBgColor="#f9731620"
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
              iconColor={colors.warning}
              iconBgColor={colors.warning + '20'}
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
              title="Asignados"
              value={assignedOrders}
              icon={Package}
              iconColor={colors.warning}
              iconBgColor={colors.warning + '20'}
            />
          </div>
          
          <div 
            onClick={() => handleFilterChange('IN_ROUTE')}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
              filterStatus === 'IN_ROUTE' ? 'ring-2' : ''
            }`}
            style={{
              '--tw-ring-color': filterStatus === 'IN_ROUTE' ? colors.info : 'transparent'
            } as React.CSSProperties}
          >
            <StatCard
              title="En Camino"
              value={inRouteOrders}
              icon={Truck}
              iconColor={colors.info}
              iconBgColor={colors.info + '20'}
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
              iconColor={colors.success}
              iconBgColor={colors.success + '20'}
            />
          </div>
        </div>

        {/* DataTable con paginación */}
        <div className="px-2 sm:px-4 lg:px-6 xl:px-8">
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
              <div 
                className="grid-card"
                style={{
                  backgroundColor: colors.background3,
                  borderColor: colors.divider
                }}
                onClick={() => handleViewOrder(order)}
              >
                {/* Header con número de pedido y estado */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold theme-text-primary truncate mb-1">{order.order_number}</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                        style={getOrderStatusStyle(order.status)}
                      >
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información básica compacta */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs theme-text-secondary">
                    <DollarSign className="w-3 h-3 flex-shrink-0" style={{ color: colors.success }} />
                    <span>Q{Number(order.total_amount || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs theme-text-secondary">
                    <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: colors.buttonPrimary1 }} />
                    <span className="truncate">{order.pickup_address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs theme-text-secondary">
                    <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: colors.error }} />
                    <span className="truncate">{order.delivery_address}</span>
                  </div>
                </div>

                {/* Fecha de creación */}
                <div className="flex items-center justify-between pt-2 theme-divider" style={{ borderColor: colors.divider }}>
                  <span className="text-xs theme-text-muted">
                    {new Date(order.created_at).toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
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
        onOrderUpdated={() => {
          // Recargar pedidos cuando se actualiza un pedido
          if (currentOrganization) {
            fetchAllOrders(currentOrganization.uuid);
            fetchOrders(currentOrganization.uuid, {
              status: filterStatus === 'all' ? undefined : filterStatus,
              page: 1,
              limit: itemsPerPage
            });
          }
        }}
        onSuccess={(message) => success('Éxito', message)}
        onError={(message) => showError('Error', message)}
      />

    </>
  );
}
