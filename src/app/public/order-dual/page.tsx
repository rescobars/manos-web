'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, MapPin, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { GooglePlacesAutocomplete, GoogleMapsWrapper } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { TextAreaField } from '@/components/ui/FormField';
import { OrdersMap } from '@/components/ui/leaflet/orders';
import { PublicOrderUrl } from '@/components/ui/PublicOrderUrl';
import { usePublicOrganizationTheme } from '@/hooks/usePublicOrganizationTheme';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

export default function PublicOrderDualPage() {
  const searchParams = useSearchParams();
  const orgUuid = searchParams.get('org_uuid');
  
  // Obtener tema de la organización
  const { colors, branding, isLoading: themeLoading, error: themeError } = usePublicOrganizationTheme(orgUuid);
  
  // Hook para toast
  const { success: showSuccess, error: showError, toasts, removeToast } = useToast();

  // Estados del mapa
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.6349, -90.5069]); // Guatemala City por defecto
  const [mapKey, setMapKey] = useState(0);
  const [locationLoading, setLocationLoading] = useState(true);
  const [activeMap, setActiveMap] = useState<'pickup' | 'delivery'>('pickup');

  // Mobile steps: 0 = ubicaciones, 1 = datos cliente/destinatario, 2 = detalles encargo
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0);

  // Helpers para habilitar siguiente en cada paso (solo mobile)

  // Estados del buscador
  const [searchQuery, setSearchQuery] = useState('');

  // Estados del formulario
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Estados para persona que recibirá el pedido
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de validación (ahora manejados por el componente Input)
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [recipientPhoneError, setRecipientPhoneError] = useState<string | null>(null);
  const [recipientEmailError, setRecipientEmailError] = useState<string | null>(null);

  // Funciones de validación para verificar estado antes del envío
  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) {
      return 'El teléfono es requerido';
    }
    
    // Remover espacios, guiones y paréntesis
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Validar que sea un número
    if (!/^\d+$/.test(cleanPhone)) {
      return 'El teléfono debe contener solo números';
    }
    
    // Validar longitud exacta para Guatemala (8 dígitos)
    if (cleanPhone.length !== 8) {
      return 'El teléfono debe tener exactamente 8 dígitos';
    }
    
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return 'El email es requerido';
    }
    
    // Expresión regular para validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return 'Ingresa un email válido (ejemplo: correo@ejemplo.com)';
    }
    
    return null;
  };

  // Helpers para habilitar siguiente en cada paso (solo mobile)
  const canContinueStep1 = !!pickupLocation && !!deliveryLocation;

  const canContinueStep2 =
    !!customerName.trim() &&
    !validatePhone(customerPhone) &&
    !validateEmail(customerEmail) &&
    !!recipientName.trim() &&
    !validatePhone(recipientPhone) &&
    !validateEmail(recipientEmail);

  // Obtener ubicación actual al montar el componente
  useEffect(() => {
    getCurrentLocation();
    
    // Timeout de respaldo para mostrar el mapa aunque falle la geolocalización
    const fallbackTimeout = setTimeout(() => {
      if (locationLoading) {
        setLocationLoading(false);
      }
    }, 8000); // 8 segundos de timeout

    return () => clearTimeout(fallbackTimeout);
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
        const newLocation: Location = {
          lat: latitude,
          lng: longitude,
          address: 'Tu ubicación actual'
        };
        setCurrentLocation(newLocation);
        setMapCenter([latitude, longitude]);
        setMapKey(prev => prev + 1); // Forzar re-render del mapa
        
        // Intentar obtener dirección legible
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'MovigoApp/1.0'
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            newLocation.address = data.display_name || 'Tu ubicación actual';
            setCurrentLocation({ ...newLocation });
          }
        } catch (err) {
          console.error('Error getting current location address:', err);
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.error('Error getting current location:', err);
        setError('No se pudo obtener tu ubicación actual. Por favor, actívala en tu navegador.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 300000
      }
    );
  };

  // Seleccionar ubicación desde Google Autocomplete
  const handleLocationSelect = (location: Location) => {
    if (activeMap === 'pickup') {
      setPickupLocation(location);
    } else {
      setDeliveryLocation(location);
    }
    setMapCenter([location.lat, location.lng]);
    setMapKey(prev => prev + 1);
    setSearchQuery(location.address);
  };

  // Manejar clic en el mapa para seleccionar punto
  const handleMapClick = async (lat: number, lng: number) => {
    // Crear ubicación básica primero
    const location: Location = {
      lat,
      lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };
    
    if (activeMap === 'pickup') {
      setPickupLocation(location);
    } else {
      setDeliveryLocation(location);
    }
    setSearchQuery(location.address);
    
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
        
        if (activeMap === 'pickup') {
          setPickupLocation(locationWithAddress);
        } else {
          setDeliveryLocation(locationWithAddress);
        }
        setSearchQuery(address);
      }
    } catch (err) {
      // Ya tenemos la ubicación básica, no es crítico
    }
  };

  const handleSubmit = async () => {
    if (!pickupLocation) {
      setError('Por favor selecciona una ubicación de recogida');
      return;
    }

    if (!deliveryLocation) {
      setError('Por favor selecciona una ubicación de entrega');
      return;
    }

    // Validar campos requeridos del cliente
    if (!customerName.trim()) {
      setError('El nombre del cliente es requerido');
      return;
    }

    // Validar teléfono del cliente
    const phoneValidationError = validatePhone(customerPhone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    // Validar email del cliente
    const emailValidationError = validateEmail(customerEmail);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    // Validar campos requeridos del destinatario
    if (!recipientName.trim()) {
      setError('El nombre de quien recibirá el pedido es requerido');
      return;
    }

    // Validar teléfono del destinatario
    const recipientPhoneValidationError = validatePhone(recipientPhone);
    if (recipientPhoneValidationError) {
      setRecipientPhoneError(recipientPhoneValidationError);
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    // Validar email del destinatario
    const recipientEmailValidationError = validateEmail(recipientEmail);
    if (recipientEmailValidationError) {
      setRecipientEmailError(recipientEmailValidationError);
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const orderData = {
        organization_uuid: orgUuid,
        delivery_address: deliveryLocation.address,
        delivery_lat: deliveryLocation.lat,
        delivery_lng: deliveryLocation.lng,
        pickup_address: pickupLocation.address,
        pickup_lat: pickupLocation.lat,
        pickup_lng: pickupLocation.lng,
        description: description || 'Encargo público',
        details: {
          // Estructura que espera el API actual
          customer_name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          special_instructions: specialInstructions.trim(),
          // Datos adicionales del destinatario
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim(),
          recipient_email: recipientEmail.trim()
        }
      };
      // Enviar a la API externa
      const response = await fetch('/api/orders/public-external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        // Mostrar mensaje de éxito
        showSuccess('¡El encargo se ha creado!', 'Tu encargo está siendo revisado. Serás contactado por email o WhatsApp para recibir confirmación y detalles de entrega.');
        // Resetear formulario
        setDescription('');
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setSpecialInstructions('');
        setRecipientName('');
        setRecipientPhone('');
        setRecipientEmail('');
        setPickupLocation(null);
        setDeliveryLocation(null);
        setSearchQuery('');
        // Limpiar errores de validación
        setPhoneError(null);
        setEmailError(null);
        setRecipientPhoneError(null);
        setRecipientEmailError(null);
      } else {
        showError('Error al crear el encargo', responseData.error || 'No se pudo crear el encargo');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      showError('Error al crear el encargo', 'Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras se carga el tema
  if (themeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background1 }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: colors.buttonPrimary1 }} />
          <p className="text-sm" style={{ color: colors.textSecondary }}>Cargando tema de la organización...</p>
        </div>
      </div>
    );
  }

  // Validar org_uuid
  if (!orgUuid) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background1 }}>
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
            Error: Organización no encontrada
          </h1>
          <p style={{ color: colors.textSecondary }}>
            El parámetro org_uuid es requerido para crear pedidos públicos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsWrapper>
      <div className="min-h-screen theme-bg-1" style={{ backgroundColor: colors.background1 }}>
      {/* Header fijo */}
      <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo de la organización */}
            {branding?.logo_url && (
              <img 
                src={branding.logo_url} 
                alt="Logo de la organización"
                className="w-8 h-8 object-contain"
              />
            )}
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
              Crear Encargo
            </h2>
          </div>
        </div>
      </div>

      {/* Mobile-only 3-step flow */}
      <div className="lg:hidden">
        {/* Progress header */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-center space-x-4">
            {[0,1,2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold`}
                  style={{
                    backgroundColor: activeStep === step ? colors.buttonPrimary1 : colors.background2,
                    color: activeStep === step ? colors.buttonText : colors.textSecondary,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  {step + 1}
                </div>
                {step < 2 && (
                  <div
                    className="w-10 h-0.5 mx-2"
                    style={{ backgroundColor: colors.border }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-3 text-sm" style={{ color: colors.textSecondary }}>
            {activeStep === 0 && 'Seleccionar ubicaciones'}
            {activeStep === 1 && 'Datos de cliente y destinatario'}
            {activeStep === 2 && 'Detalles del encargo'}
          </div>
        </div>

        {/* Step content */}
        <div className="p-4 space-y-4">
          {activeStep === 0 && (
            <div className="space-y-4">
              {/* Selector de tipo de ubicación */}
              <div className="space-y-2">
                <Button
                  onClick={() => setActiveMap('pickup')}
                  variant={activeMap === 'pickup' ? 'primary' : 'outline'}
                  className="w-full flex items-center justify-start"
                  style={{
                    backgroundColor: activeMap === 'pickup' ? colors.buttonPrimary1 : 'transparent',
                    color: activeMap === 'pickup' ? colors.buttonText : colors.textPrimary,
                    borderColor: colors.border
                  }}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Ubicación de Recogida
                </Button>
                <Button
                  onClick={() => setActiveMap('delivery')}
                  variant={activeMap === 'delivery' ? 'primary' : 'outline'}
                  className="w-full flex items-center justify-start"
                  style={{
                    backgroundColor: activeMap === 'delivery' ? colors.buttonPrimary1 : 'transparent',
                    color: activeMap === 'delivery' ? colors.buttonText : colors.textPrimary,
                    borderColor: colors.border
                  }}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Ubicación de Entrega
                </Button>
              </div>

              {/* Buscador */}
              <div>
                <h4 className="font-medium theme-text-primary mb-2 text-sm" style={{ color: colors.textPrimary }}>
                  {activeMap === 'pickup' ? 'Buscar Dirección de Recogida' : 'Buscar Dirección de Entrega'}
                </h4>
                <GooglePlacesAutocomplete
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onLocationSelect={handleLocationSelect}
                  placeholder={`Buscar ${activeMap === 'pickup' ? 'dirección de recogida' : 'dirección de entrega'}...`}
                  className="w-full"
                  colors={colors}
                />
              </div>

              {/* Mapa */}
              <div className="bg-white rounded-lg border theme-border overflow-hidden h-72" style={{ borderColor: colors.border }}>
                <div className="h-full relative">
                  {locationLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: colors.buttonPrimary1 }} />
                        <p className="text-sm theme-text-secondary">Obteniendo tu ubicación...</p>
                      </div>
                    </div>
                  ) : (
                    <OrdersMap
                      key={mapKey}
                      center={mapCenter}
                      zoom={15}
                      pickupLocation={pickupLocation}
                      deliveryLocation={deliveryLocation}
                      onMapClick={handleMapClick}
                      colors={colors}
                    />
                  )}
                </div>
              </div>

              {/* Ubicaciones seleccionadas */}
              <div className="space-y-2">
                {pickupLocation && (
                  <div className="p-3 rounded-lg theme-bg-2 border theme-border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
                    <div className="flex items-start">
                      <Navigation className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: colors.warning }} />
                      <div className="flex-1">
                        <p className="text-xs font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>Recogida</p>
                        <p className="text-xs theme-text-secondary" style={{ color: colors.textSecondary }}>
                          {pickupLocation.address}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {deliveryLocation && (
                  <div className="p-3 rounded-lg theme-bg-2 border theme-border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
                    <div className="flex items-start">
                      <Package className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                      <div className="flex-1">
                        <p className="text-xs font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>Entrega</p>
                        <p className="text-xs theme-text-secondary" style={{ color: colors.textSecondary }}>
                          {deliveryLocation.address}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium theme-text-primary text-sm" style={{ color: colors.textPrimary }}>
                  Información del Cliente (Quien Envía)
                </h4>
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>
                    Nombre del cliente *
                  </label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    label="Teléfono del cliente"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="12345678 (8 dígitos)"
                    type="tel"
                    className="w-full"
                    required
                    error={phoneError || undefined}
                  />
                </div>
                <div>
                  <Input
                    label="Email del cliente"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    type="email"
                    className="w-full"
                    required
                    error={emailError || undefined}
                  />
                </div>
              </div>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: colors.border }}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white theme-text-secondary" style={{ color: colors.textSecondary, backgroundColor: colors.background1 }}>
                    Persona que recibirá el pedido
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium theme-text-primary text-sm" style={{ color: colors.textPrimary }}>
                  Información de Quien Recibirá el Pedido
                </h4>
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>
                    Nombre de quien recibirá *
                  </label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    label="Teléfono de quien recibirá"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="12345678 (8 dígitos)"
                    type="tel"
                    className="w-full"
                    required
                    error={recipientPhoneError || undefined}
                  />
                </div>
                <div>
                  <Input
                    label="Email de quien recibirá"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    type="email"
                    className="w-full"
                    required
                    error={recipientEmailError || undefined}
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium theme-text-primary text-sm" style={{ color: colors.textPrimary }}>
                  Información del Encargo
                </h4>
                <div>
                  <TextAreaField
                    label="Descripción del encargo"
                    value={description}
                    onChange={setDescription}
                    placeholder="¿Qué contiene el encargo?"
                    rows={3}
                  />
                </div>
                <div>
                  <TextAreaField
                    label="Instrucciones especiales"
                    value={specialInstructions}
                    onChange={setSpecialInstructions}
                    placeholder="Instrucciones adicionales para la entrega (opcional)"
                    rows={3}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !pickupLocation ||
                    !deliveryLocation ||
                    !customerName ||
                    !customerPhone ||
                    !customerEmail ||
                    !recipientName ||
                    !recipientPhone ||
                    !recipientEmail ||
                    !!phoneError ||
                    !!emailError ||
                    !!recipientPhoneError ||
                    !!recipientEmailError
                  }
                  className="w-full theme-btn-primary"
                  style={{ backgroundColor: colors.buttonPrimary1, color: colors.buttonText }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Crear Encargo
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Step navigation (sticky bottom) */}
        <div
          className="sticky bottom-0 bg-white border-t theme-border p-3 flex items-center justify-between"
          style={{ borderColor: colors.border }}
        >
          <Button
            onClick={() => setActiveStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2) : s))}
            variant="outline"
            className="min-w-[100px]"
            style={{ borderColor: colors.border, color: colors.textPrimary }}
            disabled={activeStep === 0 || loading}
          >
            Atrás
          </Button>

          {activeStep < 2 ? (
            <Button
              onClick={() => setActiveStep((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : s))}
              className="min-w-[140px]"
              style={{ backgroundColor: colors.buttonPrimary1, color: colors.buttonText }}
              disabled={loading || (activeStep === 0 && !canContinueStep1) || (activeStep === 1 && !canContinueStep2)}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="min-w-[140px]"
              style={{ backgroundColor: colors.buttonPrimary1, color: colors.buttonText }}
              disabled={
                loading ||
                !pickupLocation ||
                !deliveryLocation ||
                !customerName ||
                !customerPhone ||
                !customerEmail ||
                !recipientName ||
                !recipientPhone ||
                !recipientEmail ||
                !!phoneError ||
                !!emailError ||
                !!recipientPhoneError ||
                !!recipientEmailError
              }
            >
              {loading ? 'Creando...' : 'Crear Encargo'}
            </Button>
          )}
        </div>
      </div>

      {/* Desktop layout (unchanged) */}
      {/* Layout principal - Desktop only */}
      <div className="hidden lg:flex lg:overflow-hidden lg:min-h-0">
        {/* Columna izquierda - Selector de ubicación (desktop) / Arriba (mobile) */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 border-r theme-border bg-white lg:h-auto lg:min-h-full" style={{ borderColor: colors.border }}>
          <div className="flex flex-col">
            {/* Header del selector */}
            <div className="p-2 sm:p-4 border-b theme-border" style={{ borderColor: colors.border }}>
              <h3 className="font-semibold theme-text-primary flex items-center text-sm sm:text-base" style={{ color: colors.textPrimary }}>
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Seleccionar Ubicaciones
              </h3>
              <p className="text-xs sm:text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
                Elige los puntos de recogida y entrega
              </p>
            </div>

            {/* Botones de selección de tipo de ubicación */}
            <div className="p-2 sm:p-4 border-b theme-border" style={{ borderColor: colors.border }}>
              <div className="space-y-2">
                <Button
                  onClick={() => setActiveMap('pickup')}
                  variant={activeMap === 'pickup' ? 'primary' : 'outline'}
                  className="w-full flex items-center justify-start"
                  style={{ 
                    backgroundColor: activeMap === 'pickup' ? colors.buttonPrimary1 : 'transparent',
                    color: activeMap === 'pickup' ? colors.buttonText : colors.textPrimary,
                    borderColor: colors.border
                  }}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Ubicación de Recogida
                </Button>
                <Button
                  onClick={() => setActiveMap('delivery')}
                  variant={activeMap === 'delivery' ? 'primary' : 'outline'}
                  className="w-full flex items-center justify-start"
                  style={{ 
                    backgroundColor: activeMap === 'delivery' ? colors.buttonPrimary1 : 'transparent',
                    color: activeMap === 'delivery' ? colors.buttonText : colors.textPrimary,
                    borderColor: colors.border
                  }}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Ubicación de Entrega
                </Button>
              </div>
            </div>

            {/* Buscador de direcciones */}
            <div className="p-2 sm:p-4 flex-1">
              <div className="space-y-2 sm:space-y-4">
                <div className="relative z-[9999]">
                  <h4 className="font-medium theme-text-primary mb-1 sm:mb-2 text-xs sm:text-sm" style={{ color: colors.textPrimary }}>
                    {activeMap === 'pickup' ? 'Buscar Dirección de Recogida' : 'Buscar Dirección de Entrega'}
                  </h4>
                  <div className="relative" style={{ zIndex: 9999 }}>
                    <GooglePlacesAutocomplete
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onLocationSelect={handleLocationSelect}
                      placeholder={`Buscar ${activeMap === 'pickup' ? 'dirección de recogida' : 'dirección de entrega'}...`}
                      className="w-full"
                      colors={colors}
                    />
                  </div>
                </div>

                {/* Ubicaciones seleccionadas */}
                <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-96">
                  {/* Ubicación de recogida seleccionada */}
                  {pickupLocation && (
                    <div className="p-3 rounded-lg theme-bg-2 border theme-border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
                      <div className="flex items-start">
                        <Navigation className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: colors.warning }} />
                        <div className="flex-1">
                          <p className="text-xs font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>Recogida</p>
                          <p className="text-xs theme-text-secondary" style={{ color: colors.textSecondary }}>
                            {pickupLocation.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ubicación de entrega seleccionada */}
                  {deliveryLocation && (
                    <div className="p-3 rounded-lg theme-bg-2 border theme-border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
                      <div className="flex items-start">
                        <Package className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                        <div className="flex-1">
                          <p className="text-xs font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>Entrega</p>
                          <p className="text-xs theme-text-secondary" style={{ color: colors.textSecondary }}>
                            {deliveryLocation.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna central - Mapa prominente */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-2 sm:p-4">
            <div className="bg-white rounded-lg border theme-border overflow-hidden h-64 sm:h-80 lg:h-full" style={{ borderColor: colors.border }}>
              <div className="h-full relative">
                {locationLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: colors.buttonPrimary1 }} />
                      <p className="text-sm theme-text-secondary">Obteniendo tu ubicación...</p>
                    </div>
                  </div>
                ) : (
                  <OrdersMap
                    key={mapKey}
                    center={mapCenter}
                    zoom={15}
                    pickupLocation={pickupLocation}
                    deliveryLocation={deliveryLocation}
                    onMapClick={handleMapClick}
                    colors={colors}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha - Formulario (desktop) / Abajo (mobile) */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 border-l theme-border bg-white lg:h-auto lg:min-h-full" style={{ borderColor: colors.border }}>
          <div className="flex flex-col">
            {/* Header del formulario */}
            <div className="p-2 sm:p-4 border-b theme-border flex-shrink-0" style={{ borderColor: colors.border }}>
              <h3 className="font-semibold theme-text-primary flex items-center text-sm sm:text-base" style={{ color: colors.textPrimary }}>
                <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Información del Encargo
              </h3>
              <p className="text-xs sm:text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
                Completa los detalles del encargo
              </p>
            </div>

            {/* Formulario - Scrollable en mobile */}
            <div className="p-2 sm:p-4 lg:flex-1 lg:overflow-y-auto lg:pb-24">
              <div className="space-y-2 sm:space-y-4">
                {/* Información del cliente (quien envía) */}
                <div className="space-y-2 sm:space-y-3">
                  <h4 className="font-medium theme-text-primary text-xs sm:text-sm" style={{ color: colors.textPrimary }}>
                    Información del Cliente (Quien Envía)
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>
                      Nombre del cliente *
                    </label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Input
                      label="Teléfono del cliente"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="12345678 (8 dígitos)"
                      type="tel"
                      className="w-full"
                      required
                      error={phoneError || undefined}
                    />
                  </div>

                  <div>
                    <Input
                      label="Email del cliente"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      type="email"
                      className="w-full"
                      required
                      error={emailError || undefined}
                    />
                  </div>
                </div>

                {/* División visual */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: colors.border }}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white theme-text-secondary" style={{ color: colors.textSecondary, backgroundColor: colors.background1 }}>
                      Persona que recibirá el pedido
                    </span>
                  </div>
                </div>

                {/* Información de quien recibirá el pedido */}
                <div className="space-y-2 sm:space-y-3">
                  <h4 className="font-medium theme-text-primary text-xs sm:text-sm" style={{ color: colors.textPrimary }}>
                    Información de Quien Recibirá el Pedido
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>
                      Nombre de quien recibirá *
                    </label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Input
                      label="Teléfono de quien recibirá"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="12345678 (8 dígitos)"
                      type="tel"
                      className="w-full"
                      required
                      error={recipientPhoneError || undefined}
                    />
                  </div>

                  <div>
                    <Input
                      label="Email de quien recibirá"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      type="email"
                      className="w-full"
                      required
                      error={recipientEmailError || undefined}
                    />
                  </div>
                </div>

                {/* División visual */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: colors.border }}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white theme-text-secondary" style={{ color: colors.textSecondary, backgroundColor: colors.background1 }}>
                      Detalles del encargo
                    </span>
                  </div>
                </div>

                {/* Información del encargo */}
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <TextAreaField
                      label="Descripción del encargo"
                      value={description}
                      onChange={setDescription}
                      placeholder="¿Qué contiene el encargo?"
                      rows={2}
                    />
                  </div>

                  <div>
                    <TextAreaField
                      label="Instrucciones especiales"
                      value={specialInstructions}
                      onChange={setSpecialInstructions}
                      placeholder="Instrucciones adicionales para la entrega (opcional)"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botón de envío - Solo en mobile (reemplazado por el stepper, se oculta) */}
            <div className="hidden p-2 sm:p-4 border-t theme-border flex-shrink-0" style={{ borderColor: colors.border }}>
              <Button
                onClick={handleSubmit}
                disabled={true}
                className="w-full theme-btn-primary"
                style={{ 
                  backgroundColor: colors.buttonPrimary1, 
                  color: colors.buttonText 
                }}
              >
                Crear Encargo
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      {/* Botón flotante para desktop */}
      <div className="hidden lg:block fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[99999]">
        <div className="bg-white rounded-2xl shadow-2xl border-2 p-4" style={{ borderColor: colors.border, boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px ${colors.border}` }}>
          <Button
            onClick={handleSubmit}
            disabled={loading || !pickupLocation || !deliveryLocation || !customerName || !customerPhone || !customerEmail || !recipientName || !recipientPhone || !recipientEmail || !!phoneError || !!emailError || !!recipientPhoneError || !!recipientEmailError}
            className="px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            style={{ 
              backgroundColor: colors.buttonPrimary1, 
              color: colors.buttonText,
              minWidth: '200px'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Creando Encargo...
              </>
            ) : (
              <>
                <Package className="w-5 h-5 mr-3" />
                Crear Encargo
              </>
            )}
          </Button>
        </div>
      </div>
      </div>
    </GoogleMapsWrapper>
  );
}
