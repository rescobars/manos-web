'use client';

import React from 'react';
import { Order, OrderStatus } from '@/types';
import { Button } from './Button';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Edit3, 
  Eye,
  Clock as ClockIcon,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package
} from 'lucide-react';

interface OrdersTableProps {
  orders: Order[];
  onEdit?: (order: Order) => void;
  onView?: (order: Order) => void;
  className?: string;
}

export function OrdersTable({ orders, onEdit, onView, className = '' }: OrdersTableProps) {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: ClockIcon,
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          text: 'Pendiente'
        };
      case 'ASSIGNED':
        return {
          icon: Package,
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          text: 'Asignado'
        };
      case 'IN_ROUTE':
        return {
          icon: Truck,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'En Camino'
        };
      case 'COMPLETED':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Entregado'
        };
      case 'CANCELLED':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Cancelado'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'theme-bg-1 theme-text-primary theme-border',
          text: status
        };
    }
  };

  const formatAmount = (amount: any) => {
    const value = parseFloat(amount?.toString() || '0');
    return isNaN(value) ? 'Q0.00' : `Q${value.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className={`theme-bg-3 rounded-2xl shadow-sm border theme-divider overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="theme-bg-2 border-b theme-border">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                Pedido
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                Recogida
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                Entrega
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium theme-text-muted uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="theme-bg-3 divide-y divide-gray-200">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <tr key={order.uuid} className="hover:theme-bg-2 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium theme-text-primary">
                        #{order.order_number}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.text}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm theme-text-primary max-w-xs">
                      {order.description ? truncateText(order.description) : 'Sin descripción'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 max-w-xs">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm theme-text-primary">
                        {truncateText(order.pickup_address)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 max-w-xs">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm theme-text-primary">
                        {truncateText(order.delivery_address)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm font-medium theme-text-primary">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      {formatAmount(order.total_amount)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm theme-text-muted">
                      <Clock className="w-4 h-4" />
                      {formatDate(order.created_at)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      {onView && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onView(order)}
                          className="h-8 px-3 text-xs theme-border hover:theme-border hover:theme-bg-2"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(order)}
                          className="h-8 px-3 text-xs theme-border hover:border-blue-300 hover:bg-blue-50 theme-text-primary hover:text-blue-700"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {orders.length === 0 && (
        <div className="p-12 text-center">
          <div className="w-24 h-24 theme-bg-1 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 theme-text-muted" />
          </div>
          <h3 className="text-lg font-semibold theme-text-primary mb-2">No hay pedidos</h3>
          <p className="theme-text-secondary max-w-md mx-auto">
            No se encontraron pedidos para mostrar
          </p>
        </div>
      )}
    </div>
  );
}
