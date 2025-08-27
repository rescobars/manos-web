'use client';

import { useState, useEffect } from 'react';
import { Order, CreateOrderFormData, UpdateOrderFormData, OrderStatus } from '@/types';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { TextArea } from './TextArea';
import { Select } from './Select';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOrderFormData | UpdateOrderFormData) => Promise<void>;
  order?: Order | null;
  organizationUuid: string;
  mode: 'create' | 'edit';
}

export function OrderModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  order, 
  organizationUuid, 
  mode 
}: OrderModalProps) {
  const [formData, setFormData] = useState<CreateOrderFormData>({
    organization_uuid: organizationUuid,
    description: '',
    total_amount: 0,
    pickup_address: '',
    delivery_address: '',
    pickup_lat: undefined,
    pickup_lng: undefined,
    delivery_lat: undefined,
    delivery_lng: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (order && mode === 'edit') {
      setFormData({
        organization_uuid: order.organization_uuid,
        description: order.description || '',
        total_amount: order.total_amount,
        pickup_address: order.pickup_address,
        delivery_address: order.delivery_address,
        pickup_lat: order.pickup_lat,
        pickup_lng: order.pickup_lng,
        delivery_lat: order.delivery_lat,
        delivery_lng: order.delivery_lng,
      });
    } else {
      setFormData({
        organization_uuid: organizationUuid,
        description: '',
        total_amount: 0,
        pickup_address: '',
        delivery_address: '',
        pickup_lat: undefined,
        pickup_lng: undefined,
        delivery_lat: undefined,
        delivery_lng: undefined,
      });
    }
    setErrors({});
  }, [order, mode, organizationUuid]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.pickup_address.trim()) {
      newErrors.pickup_address = 'La dirección de recogida es requerida';
    }

    if (!formData.delivery_address.trim()) {
      newErrors.delivery_address = 'La dirección de entrega es requerida';
    }

    if (formData.total_amount <= 0) {
      newErrors.total_amount = 'El monto debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateOrderFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Crear Nuevo Pedido' : 'Editar Pedido'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization UUID (hidden) */}
            <input type="hidden" value={organizationUuid} />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <TextArea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción del pedido (opcional)"
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Total *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.total_amount}
                onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.total_amount ? 'border-red-500' : ''}
              />
              {errors.total_amount && (
                <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>
              )}
            </div>

            {/* Pickup Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección de Recogida *
              </label>
              <Input
                value={formData.pickup_address}
                onChange={(e) => handleInputChange('pickup_address', e.target.value)}
                placeholder="Dirección donde se recogerá el pedido"
                className={errors.pickup_address ? 'border-red-500' : ''}
              />
              {errors.pickup_address && (
                <p className="mt-1 text-sm text-red-600">{errors.pickup_address}</p>
              )}
            </div>

            {/* Pickup Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitud de Recogida
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.pickup_lat || ''}
                  onChange={(e) => handleInputChange('pickup_lat', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="14.6349"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud de Recogida
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.pickup_lng || ''}
                  onChange={(e) => handleInputChange('pickup_lng', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="-90.5069"
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección de Entrega *
              </label>
              <Input
                value={formData.delivery_address}
                onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                placeholder="Dirección donde se entregará el pedido"
                className={errors.delivery_address ? 'border-red-500' : ''}
              />
              {errors.delivery_address && (
                <p className="mt-1 text-sm text-red-600">{errors.delivery_address}</p>
              )}
            </div>

            {/* Delivery Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitud de Entrega
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.delivery_lat || ''}
                  onChange={(e) => handleInputChange('delivery_lat', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="14.6349"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud de Entrega
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.delivery_lng || ''}
                  onChange={(e) => handleInputChange('delivery_lng', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="-90.5069"
                />
              </div>
            </div>

            {/* Status (only for edit mode) */}
            {mode === 'edit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <Select
                  value={formData.status || 'PENDING'}
                  onChange={(e) => handleInputChange('status', e.target.value as OrderStatus)}
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="ASSIGNED">Asignado</option>
                  <option value="COMPLETED">Completado</option>
                  <option value="CANCELLED">Cancelado</option>
                </Select>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Guardando...' : mode === 'create' ? 'Crear Pedido' : 'Actualizar Pedido'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
