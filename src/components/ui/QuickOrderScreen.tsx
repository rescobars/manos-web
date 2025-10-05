'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Package, Save, Navigation, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { TextAreaField } from './FormField';
import { LeafletMap } from './LeafletMap';
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
  
  // Estados del mapa
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.6349, -90.5069]); // Guatemala City por defecto
  const [mapKey, setMapKey] = useState(0);
  const [locationLoading, setLocationLoading] = useState(true);

  // Estados del formulario
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener ubicación actual al montar el componente
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Obtener ubicación actual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por este navegador');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Obtener dirección usando reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          const address = data.display_name || `${latitude}, ${longitude}`;
          
          const location: Location = {
            lat: latitude,
            lng: longitude,
            address
          };
          
          setCurrentLocation(location);
          setMapCenter([latitude, longitude]);
          setMapKey(prev => prev + 1);
          setLocationLoading(false);
        } catch (err) {
          console.error('Error getting address:', err);
          const location: Location = {
            lat: latitude,
            lng: longitude,
            address: `${latitude}, ${longitude}`
          };
          setCurrentLocation(location);
          setMapCenter([latitude, longitude]);
          setMapKey(prev => prev + 1);
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('No se pudo obtener tu ubicación actual');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // Manejar clic en el mapa para seleccionar punto de entrega
  const handleMapClick = async (lat: number, lng: number) => {
    // Crear ubicación básica primero
    const location: Location = {
      lat,
      lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };
    
    setDeliveryLocation(location);
    
    // Intentar obtener dirección usando reverse geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MovigoApp/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        const locationWithAddress: Location = {
          lat,
          lng,
          address
        };
        
        setDeliveryLocation(locationWithAddress);
      }
    } catch (err) {
      // Ya tenemos la ubicación básica, no es crítico
    }
  };

  const handleSubmit = async () => {
    if (!deliveryLocation) {
      setError('Por favor selecciona un punto de entrega en el mapa');
      return;
    }

    if (!currentLocation) {
      setError('No se pudo obtener tu ubicación actual');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const orderData = {
        organization_uuid: organizationUuid,
        description: description || 'Pedido rápido',
        total_amount: parseFloat(totalAmount) || 0,
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_address: currentLocation.address,
        delivery_address: deliveryLocation.address,
        pickup_lat: currentLocation.lat,
        pickup_lng: currentLocation.lng,
        delivery_lat: deliveryLocation.lat,
        delivery_lng: deliveryLocation.lng,
      };

      await onSubmit(orderData);
      onClose();
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Error al crear el pedido. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-bg-1 flex flex-col" style={{ backgroundColor: colors.background1 }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b theme-border" style={{ borderColor: colors.border }}>
        <div>
          <h1 className="text-xl font-bold theme-text-primary" style={{ color: colors.textPrimary }}>
            Crear Pedido Rápido
          </h1>
          <p className="text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
            Selecciona el punto de entrega en el mapa
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="theme-text-secondary hover:opacity-75"
          style={{ color: colors.textSecondary }}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Mapa */}
        <div className="flex-1 p-4">
          <div className="bg-white rounded-lg border theme-border overflow-hidden h-full" style={{ borderColor: colors.border }}>
            <div className="p-4 border-b theme-border" style={{ borderColor: colors.border }}>
              <h3 className="font-semibold theme-text-primary flex items-center" style={{ color: colors.textPrimary }}>
                <MapPin className="w-5 h-5 mr-2" />
                Selecciona punto de entrega
              </h3>
              <p className="text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
                Haz clic en el mapa para elegir dónde entregar el pedido
              </p>
            </div>
            
            <div className="h-[calc(100vh-200px)] relative">
              {locationLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: colors.buttonPrimary1 }} />
                    <p className="text-sm theme-text-secondary">Obteniendo tu ubicación...</p>
                  </div>
                </div>
              ) : (
                <LeafletMap
                  key={mapKey}
                  center={mapCenter}
                  zoom={15}
                  deliveryLocation={deliveryLocation}
                  onMapClick={handleMapClick}
                  colors={colors}
                />
              )}
            </div>
          </div>

          {/* Información del punto de entrega */}
          <div className="mt-4">
            <div className="p-3 rounded-lg theme-bg-2 border theme-border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
              <div className="flex items-start">
                <Package className="w-5 h-5 mr-3 mt-0.5" style={{ color: colors.success }} />
                <div className="flex-1">
                  <p className="font-medium theme-text-primary" style={{ color: colors.textPrimary }}>Punto de entrega</p>
                  <p className="text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
                    {deliveryLocation ? deliveryLocation.address : 'Haz clic en el mapa para seleccionar'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="w-full lg:w-96 p-4 border-l theme-border" style={{ borderColor: colors.border }}>
          <div className="space-y-4">
            <h3 className="font-semibold theme-text-primary" style={{ color: colors.textPrimary }}>
              Información del pedido
            </h3>
            
            {/* Nombre del cliente */}
            <div>
              <label className="block text-sm font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>
                Nombre del cliente
              </label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>

            {/* Teléfono del cliente */}
            <div>
              <label className="block text-sm font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>
                Teléfono del cliente
              </label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Número de teléfono"
                type="tel"
              />
            </div>

            {/* Descripción */}
            <TextAreaField
              label="Descripción del pedido"
              value={description}
              onChange={setDescription}
              placeholder="¿Qué contiene el pedido?"
              rows={3}
            />

            {/* Monto total */}
            <div>
              <label className="block text-sm font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>
                Monto total (Q)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Botón de envío */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !deliveryLocation || !currentLocation}
              className="w-full theme-btn-primary"
              style={{ 
                backgroundColor: colors.buttonPrimary1, 
                color: colors.buttonText 
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando pedido...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Crear pedido
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}