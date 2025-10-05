'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Package, MapPin, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TextAreaField } from '@/components/ui/FormField';
import { OrdersMap } from '@/components/ui/leaflet/orders';
import { useDebounce } from '@/hooks/useDebounce';
import { PublicOrderUrl } from '@/components/ui/PublicOrderUrl';
import { usePublicOrganizationTheme } from '@/hooks/usePublicOrganizationTheme';

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

  // Estados del mapa
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.6349, -90.5069]); // Guatemala City por defecto
  const [mapKey, setMapKey] = useState(0);
  const [locationLoading, setLocationLoading] = useState(true);
  const [activeMap, setActiveMap] = useState<'pickup' | 'delivery'>('pickup');

  // Estados del buscador
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Debounce para la búsqueda (500ms de delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Estados del formulario
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Cerrar resultados de búsqueda al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSearchResults) {
        // Verificar si el clic fue en los resultados de búsqueda
        const searchResults = document.querySelector('[data-search-results]');
        if (searchResults && !searchResults.contains(event.target as Node)) {
          setShowSearchResults(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSearchResults]);

  // Ejecutar búsqueda cuando cambie el debouncedSearchQuery
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      handleSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearchQuery]);

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

  // Buscar direcciones
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Agregar "Guatemala" a la búsqueda para limitar resultados
      const fullSearchQuery = `${query} Guatemala`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullSearchQuery)}&limit=5&addressdetails=1&countrycodes=gt`,
        {
          headers: {
            'User-Agent': 'MovigoApp/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const results: Location[] = data.map((item: any) => ({
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.display_name
        }));
        
        setSearchResults(results);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error('Error searching addresses:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Seleccionar resultado de búsqueda
  const handleSelectSearchResult = (location: Location) => {
    if (activeMap === 'pickup') {
      setPickupLocation(location);
    } else {
      setDeliveryLocation(location);
    }
    setMapCenter([location.lat, location.lng]);
    setMapKey(prev => prev + 1);
    setSearchQuery(location.address);
    setShowSearchResults(false);
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
        total_amount: parseFloat(totalAmount) || 0,
        description: description || 'Pedido público',
        details: {
          customer_name: customerName.trim(),
          phone: customerPhone.trim(),
          special_instructions: specialInstructions.trim()
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
        alert('¡Pedido creado exitosamente!');
        // Resetear formulario
        setDescription('');
        setTotalAmount('');
        setCustomerName('');
        setCustomerPhone('');
        setSpecialInstructions('');
        setPickupLocation(null);
        setDeliveryLocation(null);
        setSearchQuery('');
      } else {
        setError(responseData.error || 'Error al crear el pedido');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Error al crear el pedido. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-bg-1 flex flex-col" style={{ backgroundColor: colors.background1 }}>
      {/* Container con ancho responsivo */}
      <div className="w-full max-w-none mx-auto lg:max-w-[80%] xl:max-w-[80%] 2xl:max-w-[80%]">
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-3">
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

        <div className="flex-1 flex flex-col">
          {/* Selector de mapa */}
          <div className="p-4 border-b theme-border" style={{ borderColor: colors.border }}>
            <div className="flex space-x-4">
              <Button
                onClick={() => setActiveMap('pickup')}
                variant={activeMap === 'pickup' ? 'primary' : 'outline'}
                className="flex items-center"
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
                className="flex items-center"
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

          {/* Mapa - 100% horizontal */}
          <div className="flex-1 p-4 relative">
            {/* Buscador sobre el mapa */}
            <div className="absolute top-4 left-4 right-4 z-50" style={{ zIndex: 9999 }}>
              <div className="bg-white rounded-lg shadow-lg border theme-border p-3" style={{ borderColor: colors.border }}>
                <h3 className="font-semibold theme-text-primary flex items-center mb-3" style={{ color: colors.textPrimary }}>
                  <MapPin className="w-5 h-5 mr-2" />
                  {activeMap === 'pickup' ? 'Ubicación de recogida' : 'Ubicación de entrega'}
                </h3>
                
                {/* Buscador de direcciones */}
                <div className="relative">
                  <div className="flex">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Buscar ${activeMap === 'pickup' ? 'dirección de recogida' : 'dirección de entrega'}...`}
                      className="flex-1"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.buttonPrimary1 }} />
                      </div>
                    )}
                  </div>
                  
                  {/* Resultados de búsqueda */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div 
                      data-search-results
                      className="absolute z-50 w-full mt-1 bg-white border theme-border rounded-lg shadow-lg max-h-60 overflow-y-auto" 
                      style={{ borderColor: colors.border, zIndex: 10000 }}
                    >
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectSearchResult(result);
                          }}
                          className="w-full p-3 text-left hover:bg-gray-50 border-b theme-border last:border-b-0"
                          style={{ borderColor: colors.border }}
                        >
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: colors.buttonPrimary1 }} />
                            <div className="flex-1">
                              <p className="text-sm font-medium theme-text-primary" style={{ color: colors.textPrimary }}>
                                {result.address}
                              </p>
                              <p className="text-xs theme-text-secondary" style={{ color: colors.textSecondary }}>
                                {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border theme-border overflow-hidden h-full" style={{ borderColor: colors.border }}>
              <div className="h-[calc(100vh-300px)] relative">
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

          {/* Formulario - Abajo, optimizado */}
          <div className="p-4 border-t theme-border bg-white" style={{ borderColor: colors.border, backgroundColor: colors.background1 }}>
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold theme-text-primary mb-4" style={{ color: colors.textPrimary }}>
                Información del Encargo
              </h3>
              
              {/* Información de ubicaciones seleccionadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Ubicación de recogida */}
                <div className="p-3 rounded-lg theme-bg-2 border theme-border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
                  <div className="flex items-start">
                    <Navigation className="w-5 h-5 mr-3 mt-0.5" style={{ color: colors.warning }} />
                    <div className="flex-1">
                      <p className="font-medium theme-text-primary" style={{ color: colors.textPrimary }}>Punto de recogida</p>
                      <p className="text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
                        {pickupLocation ? pickupLocation.address : 'Selecciona una ubicación de recogida'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ubicación de entrega */}
                <div className="p-3 rounded-lg theme-bg-2 border theme-border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
                  <div className="flex items-start">
                    <Package className="w-5 h-5 mr-3 mt-0.5" style={{ color: colors.success }} />
                    <div className="flex-1">
                      <p className="font-medium theme-text-primary" style={{ color: colors.textPrimary }}>Punto de entrega</p>
                      <p className="text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
                        {deliveryLocation ? deliveryLocation.address : 'Selecciona una ubicación de entrega'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario en grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Nombre del cliente */}
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-1" style={{ color: colors.textPrimary }}>
                    Nombre del cliente *
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
                    Teléfono del cliente *
                  </label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Número de teléfono"
                    type="tel"
                  />
                </div>

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

                {/* Botón de envío */}
                <div className="flex items-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !pickupLocation || !deliveryLocation || !customerName || !customerPhone}
                    className="w-full theme-btn-primary"
                    style={{ 
                      backgroundColor: colors.buttonPrimary1, 
                      color: colors.buttonText 
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creando...
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

              {/* Descripción - Ancho completo */}
              <div className="mb-4">
                <TextAreaField
                  label="Descripción del pedido"
                  value={description}
                  onChange={setDescription}
                  placeholder="¿Qué contiene el pedido?"
                  rows={2}
                />
              </div>

              {/* Instrucciones especiales */}
              <div>
                <TextAreaField
                  label="Instrucciones especiales"
                  value={specialInstructions}
                  onChange={setSpecialInstructions}
                  placeholder="Instrucciones adicionales para la entrega (opcional)"
                  rows={2}
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
