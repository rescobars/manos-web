'use client';

import React, { useState } from 'react';
import { X, MapPin, Package, Save } from 'lucide-react';
import { LocationSelector } from './LocationSelector';
import { Button } from './Button';
import { BRANCH_LOCATION } from '@/lib/constants';

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
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Pedido Rápido</h1>
          </div>
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-2 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-gray-600 mt-2">
          Selecciona el punto de entrega en el mapa y crea tu pedido en segundos
        </p>
      </div>

      {/* Contenido principal - Layout de 3 columnas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Columna Izquierda - Solo Punto A y Punto B */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Punto A - Sucursal */}
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Punto A: Sucursal</h3>
              </div>
              <p className="text-sm text-blue-800 mb-2">{BRANCH_LOCATION.address}</p>
              <p className="text-xs text-blue-600">
                Coordenadas: {BRANCH_LOCATION.lat.toFixed(6)}, {BRANCH_LOCATION.lng.toFixed(6)}
              </p>
            </div>

            {/* Punto B - Entrega */}
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Punto B: Entrega</h3>
                </div>
                {deliveryLocation && (
                  <button
                    onClick={handleDeliveryLocationClear}
                    className="text-green-600 hover:text-green-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {deliveryLocation ? (
                <>
                  <p className="text-sm text-green-800 mb-2">{deliveryLocation.address}</p>
                  <p className="text-xs text-green-600">
                    Coordenadas: {deliveryLocation.lat.toFixed(6)}, {deliveryLocation.lng.toFixed(6)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-green-600 italic">
                  Haz clic en el mapa o busca una dirección
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Columna Central - Mapa y controles */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 pb-4">
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
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-600" />
                Detalles del Pedido (Opcional)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="¿Qué contiene el pedido?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Total
                  </label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2"
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={!deliveryLocation || loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-b-2 border-white"></div>
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
        <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
          <div className="sticky top-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600" />
              Resumen del Pedido
            </h3>
            
            {deliveryLocation ? (
              <div className="space-y-4">
                {/* Información de la ruta */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Ruta de Entrega</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Desde</p>
                        <p className="text-xs text-gray-600">{BRANCH_LOCATION.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Hasta</p>
                        <p className="text-xs text-gray-600">{deliveryLocation.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles del pedido */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Detalles</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descripción:</span>
                      <span className="text-gray-900">{description || 'Pedido rápido'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto:</span>
                      <span className="text-gray-900">Q{totalAmount || '0.00'}</span>
                    </div>
                  </div>
                </div>

                {/* Estado de validación */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">Pedido listo para crear</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Todos los campos requeridos están completos
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <MapPin className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-yellow-800">
                  Selecciona un punto de entrega en el mapa para ver el resumen
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
