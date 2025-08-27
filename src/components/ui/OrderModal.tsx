'use client';

import { useState, useEffect } from 'react';
import { Order, CreateOrderFormData, UpdateOrderFormData, OrderStatus } from '@/types';
import { BaseModal } from './BaseModal';
import { InputField, TextAreaField, SelectField } from './FormField';
import { ModalActions } from './ModalActions';
import { Package, Save } from 'lucide-react';
import { Button } from './Button';

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

  const statusOptions = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'ASSIGNED', label: 'Asignado' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ];

  const modalIcon = <Package className="w-5 h-5 text-gray-600" />;
  const modalTitle = mode === 'create' ? 'Crear Pedido' : 'Editar Pedido';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      icon={modalIcon}
      loading={loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Organization UUID (hidden) */}
        <input type="hidden" value={organizationUuid} />

        {/* Description */}
        <TextAreaField
          label="Descripción del Pedido"
          value={formData.description || ''}
          onChange={(value) => handleInputChange('description', value)}
          placeholder="Describe qué contiene el pedido..."
          rows={3}
          error={errors.description}
        />

        {/* Total Amount */}
        <InputField
          label="Monto Total"
          type="number"
          value={formData.total_amount}
          onChange={(value) => handleInputChange('total_amount', parseFloat(value as string) || 0)}
          placeholder="0.00"
          step="0.01"
          min={0}
          required
          error={errors.total_amount}
        />

        {/* Pickup Address */}
        <InputField
          label="Dirección de Recogida"
          type="text"
          value={formData.pickup_address}
          onChange={(value) => handleInputChange('pickup_address', value)}
          placeholder="¿Dónde se recogerá el pedido?"
          required
          error={errors.pickup_address}
        />

        {/* Pickup Coordinates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Latitud de Recogida"
            type="number"
            value={formData.pickup_lat || ''}
            onChange={(value) => handleInputChange('pickup_lat', value ? parseFloat(value as string) : undefined)}
            placeholder="14.6349"
            step="any"
          />
          <InputField
            label="Longitud de Recogida"
            type="number"
            value={formData.pickup_lng || ''}
            onChange={(value) => handleInputChange('pickup_lng', value ? parseFloat(value as string) : undefined)}
            placeholder="-90.5069"
            step="any"
          />
        </div>

        {/* Delivery Address */}
        <InputField
          label="Dirección de Entrega"
          type="text"
          value={formData.delivery_address}
          onChange={(value) => handleInputChange('delivery_address', value)}
          placeholder="¿Dónde se entregará el pedido?"
          required
          error={errors.delivery_address}
        />

        {/* Delivery Coordinates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Latitud de Entrega"
            type="number"
            value={formData.delivery_lat || ''}
            onChange={(value) => handleInputChange('delivery_lat', value ? parseFloat(value as string) : undefined)}
            placeholder="14.6349"
            step="any"
          />
          <InputField
            label="Longitud de Entrega"
            type="number"
            value={formData.delivery_lng || ''}
            onChange={(value) => handleInputChange('delivery_lng', value ? parseFloat(value as string) : undefined)}
            placeholder="-90.5069"
            step="any"
          />
        </div>

        {/* Status (only for edit mode) */}
        {mode === 'edit' && (
          <SelectField
            label="Estado del Pedido"
            value={((formData as any).status as string) || 'PENDING'}
            onChange={(value) => (formData as any).status = value as OrderStatus}
            options={statusOptions}
          />
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
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
          >
            {loading ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-b-2 border-blue-600"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Crear' : 'Actualizar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
