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
import { FilterBar } from '@/components/ui/FilterBar';
import { OrderCard } from '@/components/ui/OrderCard';
import { OrdersTable } from '@/components/ui/OrdersTable';
import { Page } from '@/components/ui/Page';
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle,
  Plus,
  Map
} from 'lucide-react';

export default function OrdersPage() {
  const { currentOrganization } = useAuth();
  const { success, error: showError, toasts, removeToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    if (currentOrganization) {
      loadOrders();
      loadPendingOrders();
    }
  }, [currentOrganization]);

  const loadOrders = async () => {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      const response = await ordersApiService.getOrganizationOrders(currentOrganization.uuid);
      
      if (response.success && response.data) {
        setOrders(response.data);
      } else {
        showError('Error loading orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingOrders = async () => {
    if (!currentOrganization) return;
    
    try {
      const response = await ordersApiService.getPendingOrders(currentOrganization.uuid);
      
      if (response.success && response.data) {
        setPendingOrders(response.data);
      }
    } catch (error) {
      console.error('Error loading pending orders:', error);
    }
  };

  const handleCreateOrder = async (data: any) => {
    try {
      const response = await ordersApiService.createOrder(data);
      
      if (response.success) {
        success('Pedido creado exitosamente');
        loadOrders();
        loadPendingOrders();
      } else {
        showError(response.error || 'Error al crear el pedido');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Error al crear el pedido');
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

  const filteredOrders = orders.filter(order => {
    // Handle status filtering - if selectedStatus is empty, undefined, or 'ALL', show all
    const matchesStatus = !selectedStatus || selectedStatus === 'ALL' || order.status === selectedStatus;
    
    // Handle search filtering
    const matchesSearch = !searchTerm || searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.delivery_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Filtering order:', {
        orderNumber: order.order_number,
        orderStatus: order.status,
        selectedStatus,
        matchesStatus,
        searchTerm,
        matchesSearch
      });
    }
    
    return matchesStatus && matchesSearch;
  });

  const filterOptions = [
    { value: 'ALL', label: 'Todos los estados' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'ASSIGNED', label: 'Asignados' },
    { value: 'IN_ROUTE', label: 'En Camino' },
    { value: 'COMPLETED', label: 'Entregados' },
    { value: 'CANCELLED', label: 'Cancelados' }
  ];

  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Package className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Selecciona una organización</h1>
          <p className="text-gray-600">Necesitas seleccionar una organización para gestionar los pedidos</p>
        </div>
      </div>
    );
  }

  const headerActions = (
    <Button
      onClick={handleQuickOrder}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      <Map className="w-4 h-4 mr-2" />
      Pedido Rápido
    </Button>
  );

  return (
    <>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      <Page
        title="Pedidos"
        subtitle={`Gestiona los pedidos de ${currentOrganization.name}`}
        headerActions={headerActions}
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <StatCard
            title="Total Pedidos"
            value={orders.length}
            icon={Package}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          
          <StatCard
            title="Pendientes"
            value={pendingOrders.length}
            icon={Clock}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
          />
          
          <StatCard
            title="Asignados"
            value={orders.filter(o => o.status === 'ASSIGNED').length}
            icon={Package}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          
          <StatCard
            title="En Camino"
            value={orders.filter(o => o.status === 'IN_ROUTE').length}
            icon={Truck}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          
          <StatCard
            title="Entregados"
            value={orders.filter(o => o.status === 'COMPLETED').length}
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
        </div>

        {/* Filters and Search */}
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por número, descripción o dirección..."
          filterValue={selectedStatus}
          onFilterChange={(value) => {
            // Ensure we handle empty values properly
            const newStatus = value === '' ? 'ALL' : (value as OrderStatus | 'ALL');
            setSelectedStatus(newStatus);
          }}
          filterOptions={filterOptions}
          filterPlaceholder="Todos los estados"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showViewToggle={true}
        />

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pedidos</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm || selectedStatus !== 'ALL' 
                ? 'No se encontraron pedidos con los filtros aplicados'
                : 'Comienza creando tu primer pedido para gestionar las entregas'
              }
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.uuid}
                order={order}
                onEdit={() => {}} // Función vacía ya que no hay modal de edición
                onView={handleViewOrder}
              />
            ))}
          </div>
        ) : (
          <OrdersTable
            orders={filteredOrders}
            onEdit={() => {}} // Función vacía ya que no hay modal de edición
            onView={handleViewOrder}
          />
        )}
      </Page>



      {/* Order Detail Modal */}
      <OrderDetail
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        order={selectedOrderForDetail}
      />

      {/* Quick Order Screen */}
      {isQuickOrderOpen && (
        <QuickOrderScreen
          organizationUuid={currentOrganization.uuid}
          onClose={handleCloseQuickOrder}
          onSubmit={handleCreateOrder}
        />
      )}
    </>
  );
}
