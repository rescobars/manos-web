'use client';

import React from 'react';
import { Order, OrderStatus } from '@/types';
import { BaseModal } from './BaseModal';
import { Package, MapPin, DollarSign, Clock, Calendar, Navigation } from 'lucide-react';

interface OrderDetailProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export function OrderDetail({ isOpen, onClose, order }: OrderDetailProps) {
  if (!order) return null;

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          text: 'Pendiente'
        };
      case 'ASSIGNED':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'En Camino'
        };
      case 'COMPLETED':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Entregado'
        };
      case 'CANCELLED':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Cancelado'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: status
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCoordinates = (lat?: number | string, lng?: number | string) => {
    if (lat && lng) {
      const latNum = typeof lat === 'number' ? lat : parseFloat(lat);
      const lngNum = typeof lng === 'number' ? lng : parseFloat(lng);
      
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        return `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
      }
    }
    return 'No especificadas';
  };

  const validateCoordinate = (coord?: number | string): number | undefined => {
    if (coord === undefined || coord === null || coord === '') {
      return undefined;
    }
    
    const numCoord = typeof coord === 'number' ? coord : parseFloat(coord);
    return isNaN(numCoord) ? undefined : numCoord;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Pedido"
      icon={<Package className="w-5 h-5 text-gray-600" />}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header del pedido */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                {statusConfig.text}
              </span>
              <span className="text-sm font-mono text-gray-500 bg-white px-2 py-1 rounded border">
                {order.order_number}
              </span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                Q{typeof order.total_amount === 'number' ? order.total_amount.toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-gray-500">Monto total</div>
            </div>
          </div>
          
          {order.description && (
            <div className="mt-3">
              <h3 className="font-medium text-gray-900 mb-2">Descripción</h3>
              <p className="text-gray-600 bg-white p-3 rounded border">{order.description}</p>
            </div>
          )}
        </div>

        {/* Información de ubicaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Punto de recogida */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Punto de Recogida</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Dirección</label>
                <p className="text-gray-900">{order.pickup_address}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Coordenadas</label>
                <p className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded">
                  {formatCoordinates(order.pickup_lat, order.pickup_lng)}
                </p>
              </div>
            </div>
          </div>

          {/* Punto de entrega */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <Navigation className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Punto de Entrega</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Dirección</label>
                <p className="text-gray-900">{order.delivery_address}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Coordenadas</label>
                <p className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded">
                  {formatCoordinates(order.delivery_lat, order.delivery_lng)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Información Adicional</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Fecha de Creación</label>
                <p className="text-gray-900">{formatDate(order.created_at)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Última Actualización</label>
                <p className="text-gray-900">{formatDate(order.updated_at)}</p>
              </div>
            </div>
            
          </div>
        </div>

        {/* Botón de cerrar */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
