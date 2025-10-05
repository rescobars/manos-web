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

interface OrderCardProps {
  order: Order;
  onEdit?: (order: Order) => void;
  onView?: (order: Order) => void;
  className?: string;
}

export function OrderCard({ order, onEdit, onView, className = '' }: OrderCardProps) {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: ClockIcon,
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          bgColor: 'bg-amber-50',
          text: 'Pendiente'
        };
      case 'ASSIGNED':
        return {
          icon: Package,
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          bgColor: 'bg-purple-50',
          text: 'Asignado'
        };
      case 'IN_ROUTE':
        return {
          icon: Truck,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          bgColor: 'bg-blue-50',
          text: 'En Camino'
        };
      case 'COMPLETED':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-200',
          bgColor: 'bg-green-50',
          text: 'Entregado'
        };
      case 'CANCELLED':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          bgColor: 'bg-red-50',
          text: 'Cancelado'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'theme-bg-1 theme-text-primary theme-border',
          bgColor: 'theme-bg-2',
          text: status
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`theme-bg-3 rounded-xl shadow-sm border theme-border hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Header de la tarjeta */}
      <div className="p-4 border-b theme-divider">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.text}
            </span>
          </div>
          <span className="text-xs font-mono theme-text-muted theme-bg-2 px-2 py-1 rounded">
            #{order.order_number}
          </span>
        </div>
        
        <h3 className="font-medium theme-text-primary text-sm line-clamp-2 mb-2">
          {order.description || 'Pedido sin descripción'}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium theme-text-primary">
            <DollarSign className="w-4 h-4 text-green-600" />
            Q{(() => {
              const amount = parseFloat(order.total_amount?.toString() || '0');
              return isNaN(amount) ? '0.00' : amount.toFixed(2);
            })()}
          </div>
          <div className="flex items-center gap-1 text-xs theme-text-muted">
            <Clock className="w-3 h-3" />
            {new Date(order.created_at).toLocaleDateString('es-GT', { 
              day: '2-digit', 
              month: 'short'
            })}
          </div>
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-4 space-y-3">
        {/* Dirección de recogida */}
        <div className="flex items-start gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 mt-0.5 flex-shrink-0">
            <MapPin className="w-3 h-3" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium theme-text-muted uppercase tracking-wide mb-1">Recogida</p>
            <p className="text-xs theme-text-primary line-clamp-2">{order.pickup_address}</p>
          </div>
        </div>
        
        {/* Dirección de entrega */}
        <div className="flex items-start gap-2">
          <div className="p-1.5 rounded-md bg-green-50 text-green-600 mt-0.5 flex-shrink-0">
            <MapPin className="w-3 h-3" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium theme-text-muted uppercase tracking-wide mb-1">Entrega</p>
            <p className="text-xs theme-text-primary line-clamp-2">{order.delivery_address}</p>
          </div>
        </div>
      </div>

      {/* Footer con acciones */}
      <div className="px-4 py-3 theme-bg-2 rounded-b-xl flex items-center gap-2">
        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(order)}
            className="flex-1 h-8 text-xs theme-border hover:border-blue-300 hover:bg-blue-50 theme-text-primary hover:text-blue-700"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Editar
          </Button>
        )}
        {onView && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(order)}
            className="flex-1 h-8 text-xs theme-border hover:theme-border hover:theme-bg-2"
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver
          </Button>
        )}
      </div>
    </div>
  );
}
