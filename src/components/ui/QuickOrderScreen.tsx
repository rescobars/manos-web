'use client';

import React, { useState } from 'react';
import { X, MapPin, Package, Save } from 'lucide-react';
import { LocationSelector } from './LocationSelector';
import { Button } from './Button';
import { BRANCH_LOCATION } from '@/lib/constants';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface QuickOrderScreenProps {
  organizationUuid: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function QuickOrderScreen({ 
  organizationUuid, 
  onClose, 
  onSubmit 
}: QuickOrderScreenProps) {
  const { colors } = useDynamicTheme();
  const [deliveryLocation, setDeliveryLocation] = useState<Location | null>(null);
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!deliveryLocation) {
      alert('Por favor selecciona un punto de entrega');
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        organization_uuid: organizationUuid,
        description: description || 'Pedido rápido',
        total_amount: parseFloat(totalAmount) || 0,
        pickup_address: BRANCH_LOCATION.address,
        delivery_address: deliveryLocation.address,
        pickup_lat: BRANCH_LOCATION.lat,
        pickup_lng: BRANCH_LOCATION.lng,
        delivery_lat: deliveryLocation.lat,
        delivery_lng: deliveryLocation.lng,
      };

      await onSubmit(orderData);
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al crear el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryLocationChange = (location: Location) => {
    setDeliveryLocation(location);
  };

  const handleDeliveryLocationClear = () => {
    setDeliveryLocation(null);
  };

  return (
    <div className="min-h-screen theme-bg-1 flex flex-col">
      {/* Header */}
      <div className="theme-bg-3 border-b theme-border px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: colors.buttonPrimary1 }} />
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold theme-text-primary">Nuevo Pedido Rápido</h1>
          </div>
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-2 hover:theme-bg-2"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
        <p className="text-sm sm:text-base theme-text-secondary mt-2">
          Selecciona el punto de entrega en el mapa y crea tu pedido en segundos
        </p>
      </div>

      {/* Contenido principal - Layout responsive */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Columna Izquierda - Solo Punto A y Punto B */}
        <div className="w-full lg:w-80 theme-bg-2 border-b lg:border-b-0 lg:border-r theme-border p-3 lg:p-6 order-1 lg:order-1">
          {/* Versión minimalista para móviles */}
          <div className="lg:hidden">
            <h3 className="font-semibold theme-text-primary mb-2 text-sm">Ubicaciones</h3>
            
            {/* Punto A y Punto B en la misma fila - SIN SCROLL */}
            <div className="grid grid-cols-2 gap-2">
              {/* Punto A - Versión ultra compacta */}
              <div className="theme-bg-3 border theme-border rounded-lg p-2" style={{ backgroundColor: colors.background3, borderColor: colors.border }}>
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.info }}></div>
                  <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>Sucursal</span>
                </div>
                <p className="text-xs leading-tight" style={{ color: colors.textSecondary }}>{BRANCH_LOCATION.address}</p>
              </div>

              {/* Punto B - Versión ultra compacta */}
              <div className="theme-bg-3 border theme-border rounded-lg p-2" style={{ backgroundColor: colors.background3, borderColor: colors.border }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.success }}></div>
                    <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>Entrega</span>
                  </div>
                  {deliveryLocation && (
                    <button
                      onClick={handleDeliveryLocationClear}
                      className="p-0.5 hover:opacity-75"
                      style={{ color: colors.textSecondary }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                {deliveryLocation ? (
                  <p className="text-xs leading-tight" style={{ color: colors.textSecondary }}>{deliveryLocation.address}</p>
                ) : (
                  <p className="text-xs italic leading-tight" style={{ color: colors.textMuted }}>Selecciona</p>
                )}
              </div>
            </div>
          </div>

          {/* Versión completa para desktop */}
          <div className="hidden lg:block space-y-6">
            {/* Punto A - Sucursal */}
            <div className="theme-bg-3 border theme-border rounded-lg p-4" style={{ backgroundColor: colors.background3, borderColor: colors.border }}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5" style={{ color: colors.info }} />
                <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Punto A: Sucursal</h3>
              </div>
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{BRANCH_LOCATION.address}</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                Coordenadas: {BRANCH_LOCATION.lat.toFixed(6)}, {BRANCH_LOCATION.lng.toFixed(6)}
              </p>
            </div>

            {/* Punto B - Entrega */}
            <div className="theme-bg-3 border theme-border rounded-lg p-4" style={{ backgroundColor: colors.background3, borderColor: colors.border }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: colors.success }} />
                  <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Punto B: Entrega</h3>
                </div>
                {deliveryLocation && (
                  <button
                    onClick={handleDeliveryLocationClear}
                    className="p-1 hover:opacity-75"
                    style={{ color: colors.textSecondary }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {deliveryLocation ? (
                <>
                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{deliveryLocation.address}</p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>
                    Coordenadas: {deliveryLocation.lat.toFixed(6)}, {deliveryLocation.lng.toFixed(6)}
                  </p>
                </>
              ) : (
                <p className="text-sm italic" style={{ color: colors.textMuted }}>
                  Haz clic en el mapa o busca una dirección
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Columna Central - Mapa y controles */}
        <div className="flex-1 flex flex-col order-3 lg:order-2 overflow-y-auto">
          {/* Espacio arriba para móviles */}
          <div className="lg:hidden h-4"></div>
          
          <div className="px-3 lg:px-6 pb-4">
            <LocationSelector
              pickupLocation={{
                lat: BRANCH_LOCATION.lat,
                lng: BRANCH_LOCATION.lng,
                address: BRANCH_LOCATION.address
              }}
              deliveryLocation={deliveryLocation}
              onPickupChange={() => {}} // No permitir cambiar la sucursal
              onDeliveryChange={handleDeliveryLocationChange}
              onDeliveryClear={handleDeliveryLocationClear}
            />
          </div>
          
          {/* Detalles del pedido y botones debajo del mapa */}
          <div className="px-3 lg:px-6 pb-4 lg:pb-6">
            <div className="theme-bg-2 rounded-lg p-3 lg:p-4 mb-4" style={{ backgroundColor: colors.background2 }}>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm lg:text-base" style={{ color: colors.textPrimary }}>
                <Package className="w-4 h-4" style={{ color: colors.textSecondary }} />
                Detalles del Pedido (Opcional)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="¿Qué contiene el pedido?"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm theme-bg-3 theme-border theme-text-primary"
                    style={{ 
                      backgroundColor: colors.background3, 
                      borderColor: colors.border, 
                      color: colors.textPrimary 
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                    Monto Total
                  </label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm theme-bg-3 theme-border theme-text-primary"
                    style={{ 
                      backgroundColor: colors.background3, 
                      borderColor: colors.border, 
                      color: colors.textPrimary 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 w-full sm:w-auto theme-border theme-text-primary hover:theme-bg-2"
                style={{ 
                  borderColor: colors.border, 
                  color: colors.textPrimary 
                }}
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={!deliveryLocation || loading}
                className="px-6 py-2 w-full sm:w-auto theme-btn-primary"
                style={{ 
                  backgroundColor: colors.buttonPrimary1, 
                  color: colors.buttonText 
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-b-2" style={{ borderColor: colors.buttonText }}></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Crear Pedido
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Solo Resumen del pedido */}
        <div className="w-full lg:w-80 theme-bg-2 border-t lg:border-t-0 lg:border-l theme-border p-4 sm:p-6 overflow-y-auto order-2 lg:order-3" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
          {/* RESUMEN COMPLETAMENTE OCULTO EN MÓVILES */}
          <div className="hidden lg:block">
            <div className="sticky top-0">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Package className="w-5 h-5" style={{ color: colors.textSecondary }} />
                Resumen del Pedido
              </h3>
              
              {deliveryLocation ? (
                <div className="space-y-4">
                  {/* Información de la ruta */}
                  <div className="theme-bg-3 border theme-border rounded-lg p-4" style={{ backgroundColor: colors.background3, borderColor: colors.border }}>
                    <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>Ruta de Entrega</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: colors.info }}></div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>Desde</p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>{BRANCH_LOCATION.address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: colors.success }}></div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>Hasta</p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>{deliveryLocation.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalles del pedido */}
                  <div className="theme-bg-3 border theme-border rounded-lg p-4" style={{ backgroundColor: colors.background3, borderColor: colors.border }}>
                    <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>Detalles</h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: colors.textSecondary }}>Descripción:</span>
                        <span style={{ color: colors.textPrimary }}>{description || 'Pedido rápido'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Monto:</span>
                        <span className="text-xs" style={{ color: colors.textPrimary }}>Q{totalAmount || '0.00'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Estado de validación */}
                  <div className="rounded-lg p-4" style={{ backgroundColor: `${colors.success}20`, borderColor: colors.success, border: '1px solid' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.success }}></div>
                      <span className="text-sm font-medium" style={{ color: colors.success }}>Pedido listo para crear</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: colors.success }}>
                      Todos los campos requeridos están completos
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: `${colors.warning}20`, borderColor: colors.warning, border: '1px solid' }}>
                  <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: colors.warning }} />
                  <p className="text-sm" style={{ color: colors.warning }}>
                    Selecciona un punto de entrega en el mapa para ver el resumen
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
