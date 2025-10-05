'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Package, Save, Navigation, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { TextAreaField } from './FormField';
import { OrdersMap } from './leaflet/orders';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener ubicación actual al montar el componente
  useEffect(() => {
    getCurrentLocation();
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

  // Buscar direcciones
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
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
    setDeliveryLocation(location);
    setMapCenter([location.lat, location.lng]);
    setMapKey(prev => prev + 1);
    setSearchQuery(location.address);
    setShowSearchResults(false);
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
        
        setDeliveryLocation(locationWithAddress);
        setSearchQuery(address);
      }
    } catch (err) {
      // Ya tenemos la ubicación básica, no es crítico
    }
  };

  const handleSubmit = async () => {
    if (!deliveryLocation) {
      setError('Por favor selecciona una ubicación de entrega');
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
        delivery_address: deliveryLocation.address,
        delivery_lat: deliveryLocation.lat,
        delivery_lng: deliveryLocation.lng,
      };

      console.log('Order data:', orderData);

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

      <div className="flex-1 flex flex-col">
        {/* Mapa - 100% horizontal */}
        <div className="flex-1 p-4">
          <div className="bg-white rounded-lg border theme-border overflow-hidden h-full relative" style={{ borderColor: colors.border }}>
            {/* Buscador sobre el mapa */}
            <div className="absolute top-4 left-4 right-4 z-50" style={{ zIndex: 9999 }}>
              <div className="bg-white rounded-lg shadow-lg border theme-border p-3" style={{ borderColor: colors.border }}>
                <h3 className="font-semibold theme-text-primary flex items-center mb-3" style={{ color: colors.textPrimary }}>
                  <MapPin className="w-5 h-5 mr-2" />
                  Ubicación de entrega
                </h3>
                
                {/* Buscador de direcciones */}
                <div className="relative">
                  <div className="flex">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar dirección de entrega..."
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
            
            <div className="h-[calc(100vh-200px)] relative">
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
              Información del pedido
            </h3>
            
            {/* Información del punto de entrega */}
            <div className="mb-4">
              <div className="p-3 rounded-lg theme-bg-2 border theme-border" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
                <div className="flex items-start">
                  <Package className="w-5 h-5 mr-3 mt-0.5" style={{ color: colors.success }} />
                  <div className="flex-1">
                    <p className="font-medium theme-text-primary" style={{ color: colors.textPrimary }}>Punto de entrega</p>
                    <p className="text-sm theme-text-secondary mt-1" style={{ color: colors.textSecondary }}>
                      {deliveryLocation ? deliveryLocation.address : 'Busca una dirección o haz clic en el mapa'}
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
                  disabled={loading || !deliveryLocation}
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
            <div>
              <TextAreaField
                label="Descripción del pedido"
                value={description}
                onChange={setDescription}
                placeholder="¿Qué contiene el pedido?"
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
  );
}