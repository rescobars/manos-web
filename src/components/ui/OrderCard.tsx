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
  AlertCircle
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
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          bgColor: 'bg-gray-50',
          text: status
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.text}
            </div>
            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {order.order_number}
            </span>
          </div>
          
          <h3 className="font-medium text-gray-900 mb-2">
            {order.description || 'Pedido sin descripción'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-1">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Recogida</p>
                <p className="text-sm text-gray-900">{order.pickup_address}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-50 text-green-600 mt-1">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Entrega</p>
                <p className="text-sm text-gray-900">{order.delivery_address}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">Q{order.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{new Date(order.created_at).toLocaleDateString('es-GT', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(order)}
              className="border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          {onView && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(order)}
              className="border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
