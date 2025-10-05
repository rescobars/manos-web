'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextAreaField } from '@/components/ui/FormField';
import { LeafletMap } from '@/components/ui/LeafletMap';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Package, MapPin, Navigation, Loader2 } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface OrderFormData {
  description: string;
  total_amount: number;
  customer_name: string;
  customer_phone: string;
}


export default function CreateOrderPage() {
  const searchParams = useSearchParams();
  const orgUuid = searchParams.get('org_uuid');
  const { colors } = useDynamicTheme();
  const { currentOrganization } = useAuth();

  // Estados del mapa
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.6349, -90.5069]); // Guatemala City por defecto
  const [mapKey, setMapKey] = useState(0); // Para forzar re-render del mapa

  // Estados del formulario
  const [formData, setFormData] = useState<OrderFormData>({
    description: '',
    total_amount: 0,
    customer_name: '',
    customer_phone: ''
  });

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener ubicación actual
  useEffect(() => {
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
            setMapKey(prev => prev + 1); // Forzar re-render del mapa
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

    getCurrentLocation();
  }, []);

  // Manejar clic en el mapa para seleccionar punto de entrega
  const handleMapClick = async (lat: number, lng: number) => {
    try {
      // Obtener dirección usando reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      const address = data.display_name || `${lat}, ${lng}`;
      
      const location: Location = {
        lat,
        lng,
        address
      };
      
      setDeliveryLocation(location);
    } catch (err) {
      console.error('Error getting address:', err);
      const location: Location = {
        lat,
        lng,
        address: `${lat}, ${lng}`
      };
      setDeliveryLocation(location);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        organization_uuid: orgUuid || currentOrganization?.uuid,
        description: formData.description || 'Pedido creado desde la app',
        total_amount: formData.total_amount,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        pickup_address: currentLocation.address,
        delivery_address: deliveryLocation.address,
        pickup_lat: currentLocation.lat,
        pickup_lng: currentLocation.lng,
        delivery_lat: deliveryLocation.lat,
        delivery_lng: deliveryLocation.lng,
      };

      // Aquí harías la llamada a tu API para crear el pedido
      console.log('Order data:', orderData);
      
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('¡Pedido creado exitosamente!');
      
      // Resetear formulario
      setFormData({
        description: '',
        total_amount: 0,
        customer_name: '',
        customer_phone: ''
      });
      setDeliveryLocation(null);
      
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Error al crear el pedido. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-bg-1" style={{ backgroundColor: colors.background1 }}>
      <div className="px-4 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold theme-text-primary" style={{ color: colors.textPrimary }}>
              Crear Pedido
            </h1>
            <p className="text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
              Selecciona el punto de entrega en el mapa
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mapa */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border theme-border overflow-hidden" style={{ borderColor: colors.border }}>
              <div className="p-4 border-b theme-border" style={{ borderColor: colors.border }}>
                <h3 className="font-semibold theme-text-primary flex items-center" style={{ color: colors.textPrimary }}>
                  <MapPin className="w-5 h-5 mr-2" />
                  Selecciona punto de entrega
                </h3>
                <p className="text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
                  Haz clic en el mapa para elegir dónde entregar el pedido
                </p>
              </div>
              
              <div className="h-96 relative">
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

            {/* Información de ubicaciones */}
            <div className="space-y-3">
              {/* Ubicación actual */}
              <div className="p-3 rounded-lg theme-bg-2 border theme-border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
                <div className="flex items-start">
                  <Navigation className="w-5 h-5 mr-3 mt-0.5" style={{ color: colors.buttonPrimary1 }} />
                  <div className="flex-1">
                    <p className="font-medium theme-text-primary" style={{ color: colors.textPrimary }}>Origen (Tu ubicación)</p>
                    <p className="text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
                      {currentLocation ? currentLocation.address : 'Obteniendo ubicación...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Punto de entrega */}
              <div className="p-3 rounded-lg theme-bg-2 border theme-border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
                <div className="flex items-start">
                  <Package className="w-5 h-5 mr-3 mt-0.5" style={{ color: colors.success }} />
                  <div className="flex-1">
                    <p className="font-medium theme-text-primary" style={{ color: colors.textPrimary }}>Destino (Punto de entrega)</p>
                    <p className="text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
                      {deliveryLocation ? deliveryLocation.address : 'Haz clic en el mapa para seleccionar'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border theme-border p-6" style={{ borderColor: colors.border }}>
              <h3 className="font-semibold theme-text-primary mb-4" style={{ color: colors.textPrimary }}>
                Información del pedido
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre del cliente */}
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>
                    Nombre del cliente *
                  </label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Nombre completo"
                    required
                  />
                </div>

                {/* Teléfono del cliente */}
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>
                    Teléfono del cliente *
                  </label>
                  <Input
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    placeholder="Número de teléfono"
                    type="tel"
                    required
                  />
                </div>

                {/* Descripción */}
                <TextAreaField
                  label="Descripción del pedido"
                  value={formData.description}
                  onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
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
                    value={formData.total_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
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
                  type="submit"
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
