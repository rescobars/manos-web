'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BaseMap, useMap } from '@/components/ui/mapbox';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui';
import { 
  MapPin, 
  Users, 
  Route, 
  RefreshCw, 
  AlertCircle,
  Wifi,
  WifiOff,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';

interface DriverLocation {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface DriverMarker {
  id: string;
  location: DriverLocation;
  status: string;
  routeId?: string;
  organizationId: string;
  timestamp: string;
}

interface FilterState {
  viewBy: 'organization' | 'route';
  selectedOrganization?: string;
  selectedRoute?: string;
  showOnlyActive: boolean;
}

export function LiveTrackingComponent() {
  const { user, currentOrganization } = useAuth();
  const { map, isMapReady, handleMapReady } = useMap();
  const {
    isConnected,
    isAuthenticated,
    connectionError,
    drivers,
    routeUpdates,
    organizationUpdates,
    connect,
    disconnect,
    joinRoute,
    leaveRoute
  } = useWebSocket();

  const [filters, setFilters] = useState<FilterState>({
    viewBy: 'organization',
    showOnlyActive: false // Cambiado a false para ver todos los drivers inicialmente
  });
  const markersRef = useRef<Map<string, any>>(new Map());
  const trailsRef = useRef<Map<string, Array<[number, number]>>>(new Map()); // Store trails for each driver
  const [showFilters, setShowFilters] = useState(false);
  const [messages, setMessages] = useState<Array<{id: string, text: string, type: 'info' | 'success' | 'error', timestamp: Date}>>([]);

  // Guatemala City center as default
  const defaultCenter: [number, number] = [-90.5069, 14.6349];

  // Message handler
  const addMessage = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessages(prev => {
      // Don't add duplicate messages within 1 second
      const lastMessage = prev[0];
      if (lastMessage && lastMessage.text === text && 
          (Date.now() - lastMessage.timestamp.getTime()) < 1000) {
        return prev;
      }
      
      const newMessage = {
        id: Date.now().toString(),
        text,
        type,
        timestamp: new Date()
      };
      return [newMessage, ...prev].slice(0, 50); // Keep only last 50 messages
    });
  }, []);

  // Filter drivers based on current filters
  const filteredDrivers = useMemo(() => {
    console.log('🔍 Filtering drivers:', { 
      driversCount: drivers.length, 
      filters,
      sampleDriver: drivers[0]
    });
    
    return drivers.filter(driver => {
      // Los datos vienen anidados en driver.data, necesitamos normalizarlos
      let normalizedDriver = driver;
      const driverAny = driver as any; // Type assertion para permitir acceso a .data
      
      // Si los datos vienen en formato WebSocket (driver.data.location), normalizar
      if (driverAny?.data && !driverAny?.driverId && driverAny.data.driverId) {
        console.log('🔄 Normalizing WebSocket structure for driver:', driverAny.data.driverId);
        normalizedDriver = {
          driverId: driverAny.data.driverId,
          location: driverAny.data.location,
          status: driverAny.data.status,
          routeId: driverAny.data.routeId,
          organizationId: driverAny.data.organizationId,
          timestamp: driverAny.data.timestamp
        } as any;
        console.log('✅ Normalized driver structure:', normalizedDriver);
      }
      
      // Normalizar coordenadas: el WebSocket envía latitude/longitude pero esperamos lat/lng
      if (normalizedDriver?.location) {
        const location = normalizedDriver.location as any; // Type assertion para permitir ambos formatos
        if (location.latitude !== undefined && location.longitude !== undefined) {
          console.log('🔄 Normalizing coordinates for driver:', normalizedDriver.driverId, 
            'from latitude/longitude:', location.latitude, location.longitude);
          location.lat = location.latitude;
          location.lng = location.longitude;
          console.log('✅ Normalized to lat/lng:', location.lat, location.lng);
        }
      }
      
      // Actualizar el driver original con los datos normalizados
      Object.assign(driver, normalizedDriver);
      
      // Validar que el driver tenga datos válidos
      if (!driver || !driver.driverId || !driver.location || 
          typeof driver.location.lat !== 'number' || 
          typeof driver.location.lng !== 'number') {
        console.log('❌ Driver filtered out - invalid data:', driver);
        return false;
      }
      
      // Mapear status del WebSocket a estados locales
      const normalizedStatus = {
        'DRIVING': 'active',
        'ACTIVE': 'active', 
        'BUSY': 'busy',
        'OFFLINE': 'offline',
        'IDLE': 'active'
      }[driver.status] || driver.status;
      
      if (filters.showOnlyActive && normalizedStatus !== 'active') {
        console.log('❌ Driver filtered out by status:', driver.driverId, driver.status, '->', normalizedStatus);
        return false;
      }

      if (filters.viewBy === 'organization' && filters.selectedOrganization) {
        return driver.organizationId === filters.selectedOrganization;
      }

      if (filters.viewBy === 'route' && filters.selectedRoute) {
        return driver.routeId === filters.selectedRoute;
      }

      console.log('✅ Driver passed filters:', driver.driverId, normalizedStatus);
      return true;
    });
  }, [drivers, filters.showOnlyActive, filters.viewBy, filters.selectedOrganization, filters.selectedRoute]);

  // Update map markers when drivers data changes (optimized)
  useEffect(() => {
    console.log('🗺️ Map effect triggered:', { 
      map: !!map, 
      isMapReady, 
      filteredDriversCount: filteredDrivers.length,
      allDriversCount: drivers.length,
      filteredDrivers: filteredDrivers.map(d => ({ id: d.driverId, status: d.status, location: d.location }))
    });
    
    if (!map || !isMapReady) {
      console.log('❌ Map not ready yet');
      return;
    }

    // Get current driver IDs
    const currentDriverIds = new Set(filteredDrivers.map(d => d.driverId));
    const existingDriverIds = new Set(markersRef.current.keys());

    // Remove markers for drivers that are no longer in the list
    markersRef.current.forEach((marker, driverId) => {
      if (!currentDriverIds.has(driverId)) {
        console.log('🗑️ Removing marker and trail for driver:', driverId);
        
        // Remove marker
        marker.remove();
        markersRef.current.delete(driverId);
        
        // Remove trail from map
        const trailLayerId = `trail-layer-${driverId}`;
        const trailSourceId = `trail-${driverId}`;
        
        if (map.getLayer(trailLayerId)) {
          map.removeLayer(trailLayerId);
        }
        if (map.getSource(trailSourceId)) {
          map.removeSource(trailSourceId);
        }
        
        // Remove trail from memory
        trailsRef.current.delete(driverId);
      }
    });
    
    // Add or update markers for current drivers
    filteredDrivers.forEach(driver => {
      // Los drivers ya deberían estar normalizados, pero validación adicional por si acaso
      if (!driver?.driverId || !driver?.location || 
          typeof driver.location.lat !== 'number' || 
          typeof driver.location.lng !== 'number') {
        console.log('❌ Skipping invalid driver in marker creation:', driver);
        return;
      }
      
      const existingMarker = markersRef.current.get(driver.driverId);
      const coordinates = [driver.location.lng, driver.location.lat];
      
      // If marker exists, animate to new position smoothly
      if (existingMarker) {
        console.log('🔄 Smoothly moving marker for driver:', driver.driverId, 'to:', coordinates);
        
        // Get current position
        const currentLngLat = existingMarker.getLngLat();
        const newLngLat = coordinates;
        
        // Calculate if the position actually changed significantly (avoid unnecessary animations)
        const distanceThreshold = 0.00001; // Very small threshold for coordinates
        const latDiff = Math.abs(currentLngLat.lat - newLngLat[1]);
        const lngDiff = Math.abs(currentLngLat.lng - newLngLat[0]);
        
        if (latDiff > distanceThreshold || lngDiff > distanceThreshold) {
          // Add current position to trail
          const currentTrail = trailsRef.current.get(driver.driverId) || [];
          currentTrail.push([currentLngLat.lng, currentLngLat.lat]);
          
          // Keep only last 10 positions for trail
          if (currentTrail.length > 10) {
            currentTrail.shift();
          }
          trailsRef.current.set(driver.driverId, currentTrail);
          
          // Add trail line to map if we have enough points
          if (currentTrail.length > 1) {
            const trailSourceId = `trail-${driver.driverId}`;
            const trailLayerId = `trail-layer-${driver.driverId}`;
            
            // Remove existing trail
            if (map.getLayer(trailLayerId)) {
              map.removeLayer(trailLayerId);
            }
            if (map.getSource(trailSourceId)) {
              map.removeSource(trailSourceId);
            }
            
            // Add new trail
            map.addSource(trailSourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: currentTrail
                }
              }
            });
            
            map.addLayer({
              id: trailLayerId,
              type: 'line',
              source: trailSourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#10b981', // Green trail
                'line-width': 3,
                'line-opacity': 0.6
              }
            });
          }
          
          // Animate the marker movement
          const duration = 800; // Animation duration in milliseconds
          const startTime = Date.now();
          
          const animateMarker = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out cubic function for smooth deceleration
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            
            // Interpolate between current and target position
            const lat = currentLngLat.lat + (newLngLat[1] - currentLngLat.lat) * easeOutCubic;
            const lng = currentLngLat.lng + (newLngLat[0] - currentLngLat.lng) * easeOutCubic;
            
            // Update marker position
            existingMarker.setLngLat([lng, lat]);
            
            // Continue animation if not finished
            if (progress < 1) {
              requestAnimationFrame(animateMarker);
            } else {
              // Add final position to trail
              const finalTrail = trailsRef.current.get(driver.driverId) || [];
              finalTrail.push([newLngLat[0], newLngLat[1]]);
              if (finalTrail.length > 10) {
                finalTrail.shift();
              }
              trailsRef.current.set(driver.driverId, finalTrail);
            }
          };
          
          requestAnimationFrame(animateMarker);
        }
        
        // Update popup content with current data
        const popup = existingMarker.getPopup();
        if (popup) {
          const normalizedStatus = {
            'DRIVING': 'active',
            'ACTIVE': 'active', 
            'BUSY': 'busy',
            'OFFLINE': 'offline',
            'IDLE': 'active'
          }[driver.status] || driver.status;
          
          popup.setHTML(`
            <div class="p-3 min-w-[200px]">
              <h3 class="font-semibold text-lg mb-2">🚗 Driver ${driver.driverId?.slice(-6) || 'Unknown'}</h3>
              <p class="text-sm text-gray-600 mb-1">Estado: <span class="font-medium ${
                normalizedStatus === 'active' ? 'text-green-600' :
                normalizedStatus === 'busy' ? 'text-yellow-600' :
                normalizedStatus === 'offline' ? 'text-gray-600' : 'text-blue-600'
              }">${driver.status || 'Unknown'}</span></p>
              <p class="text-sm text-gray-600 mb-1">📍 Lat: ${driver.location?.lat?.toFixed(6) || 'N/A'}</p>
              <p class="text-sm text-gray-600 mb-1">📍 Lng: ${driver.location?.lng?.toFixed(6) || 'N/A'}</p>
              ${driver.routeId ? `<p class="text-sm text-gray-600 mb-1">🛣️ Ruta: ${driver.routeId.slice(-6)}</p>` : ''}
              <p class="text-xs text-gray-500 border-t pt-2">⏰ ${driver.timestamp ? new Date(driver.timestamp).toLocaleString() : 'No timestamp'}</p>
            </div>
          `);
        }
        return;
      }
      
      // Create new marker only if it doesn't exist
      console.log('🆕 Creating new marker for driver:', driver.driverId, 'at', driver.location);
      
      // Normalizar status para la UI
      const normalizedStatus = {
        'DRIVING': 'active',
        'ACTIVE': 'active', 
        'BUSY': 'busy',
        'OFFLINE': 'offline',
        'IDLE': 'active'
      }[driver.status] || driver.status;
      
      // Create marker element with better styling
      const markerElement = document.createElement('div');
      markerElement.className = 'driver-marker';
      markerElement.style.cssText = `
        transition: transform 0.3s ease-out;
        transform-origin: center center;
      `;
      markerElement.innerHTML = `
        <div class="relative transform transition-all duration-300 hover:scale-110">
          <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-2xl border-4 border-white ${
            normalizedStatus === 'active' ? 'bg-gradient-to-br from-green-400 to-green-600' :
            normalizedStatus === 'busy' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
            normalizedStatus === 'offline' ? 'bg-gradient-to-br from-gray-400 to-gray-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'
          }" style="box-shadow: 0 8px 30px rgba(0,0,0,0.4);">
            🚗
          </div>
          <div class="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-3 border-white ${
            normalizedStatus === 'active' ? 'bg-green-400 animate-pulse' :
            normalizedStatus === 'busy' ? 'bg-yellow-400 animate-bounce' :
            normalizedStatus === 'offline' ? 'bg-gray-400' : 'bg-blue-400 animate-ping'
          }" style="animation-duration: 2s;"></div>
          <div class="absolute inset-0 rounded-full ${
            normalizedStatus === 'active' ? 'animate-ping bg-green-400' : ''
          }" style="animation-duration: 3s; animation-iteration-count: infinite; opacity: 0.2;"></div>
        </div>
      `;
      
      try {
        // Create popup
        const popup = new window.mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-3 min-w-[200px]">
              <h3 class="font-semibold text-lg mb-2">🚛 Driver ${driver.driverId?.slice(-6) || 'Unknown'}</h3>
              <p class="text-sm text-gray-600 mb-1">Estado: <span class="font-medium ${
                normalizedStatus === 'active' ? 'text-green-600' :
                normalizedStatus === 'busy' ? 'text-yellow-600' :
                normalizedStatus === 'offline' ? 'text-gray-600' : 'text-blue-600'
              }">${driver.status || 'Unknown'}</span></p>
              <p class="text-sm text-gray-600 mb-1">📍 Lat: ${driver.location?.lat?.toFixed(6) || 'N/A'}</p>
              <p class="text-sm text-gray-600 mb-1">📍 Lng: ${driver.location?.lng?.toFixed(6) || 'N/A'}</p>
              ${driver.routeId ? `<p class="text-sm text-gray-600 mb-1">🛣️ Ruta: ${driver.routeId.slice(-6)}</p>` : ''}
              <p class="text-xs text-gray-500 border-t pt-2">⏰ ${driver.timestamp ? new Date(driver.timestamp).toLocaleString() : 'No timestamp'}</p>
            </div>
          `);

        // Create marker with popup
        const marker = new window.mapboxgl.Marker(markerElement)
          .setLngLat(coordinates)
          .setPopup(popup)
          .addTo(map);
          
        markersRef.current.set(driver.driverId, marker);
        console.log('✅ New marker created successfully for driver:', driver.driverId);
      } catch (error) {
        console.error('❌ Error creating marker:', error, 'for driver:', driver.driverId);
      }
    });

    // Auto-centering removed per user request
  }, [map, isMapReady, filteredDrivers]);

  // Monitor WebSocket events and show messages
  useEffect(() => {
    if (isConnected) {
      addMessage('✅ Conectado al servidor WebSocket', 'success');
    }
  }, [isConnected, addMessage]);

  useEffect(() => {
    if (isAuthenticated) {
      addMessage('🔐 Autenticación exitosa', 'success');
    }
  }, [isAuthenticated, addMessage]);

  useEffect(() => {
    if (connectionError) {
      addMessage(`❌ ${connectionError}`, 'error');
    }
  }, [connectionError, addMessage]);

  // Monitor driver updates (only when count actually changes significantly)
  const prevDriverCount = useRef(0);
  useEffect(() => {
    if (drivers.length > 0 && drivers.length !== prevDriverCount.current) {
      addMessage(`📡 ${drivers.length} driver(s) activos transmitiendo`, 'info');
      prevDriverCount.current = drivers.length;
    }
  }, [drivers.length, addMessage]);

  // Get unique organizations and routes for filters
  const availableOrganizations = [...new Set(drivers.map(d => d.organizationId))];
  const availableRoutes = [...new Set(drivers.map(d => d.routeId).filter(Boolean))];

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    
    // Si se especifica una ruta, unirse automáticamente a esa sala
    if (newFilters.selectedRoute && isAuthenticated) {
      joinRoute(newFilters.selectedRoute);
      addMessage(`Uniéndose a la ruta: ${newFilters.selectedRoute}`, 'info');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <div className="flex items-center space-x-2 text-green-600">
                <Wifi className="w-5 h-5" />
                <span className="font-medium">Conectado</span>
                {isAuthenticated && <span className="text-sm text-green-500">(Autenticado)</span>}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600">
                <WifiOff className="w-5 h-5" />
                <span className="font-medium">Desconectado</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>
            
            <button
              onClick={() => {
                if (isConnected) {
                  disconnect();
                  addMessage('🔌 Desconectando del servidor...', 'info');
                } else {
                  connect();
                  addMessage('🔌 Intentando conectar al servidor...', 'info');
                }
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isConnected 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isConnected ? 'Desconectar' : 'Conectar'}</span>
            </button>
          </div>
        </div>

        {connectionError && (
          <div className="mt-3 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{connectionError}</span>
          </div>
        )}

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <div><strong>Debug Info:</strong></div>
            <div>User Available: {user ? 'Yes' : 'No'}</div>
            <div>User ID: {user?.uuid || 'Missing'}</div>
            <div>Org Available: {currentOrganization ? 'Yes' : 'No'}</div>
            <div>Org ID: {currentOrganization?.uuid || 'Missing'}</div>
            <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
            <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
            <div>Drivers Data: {JSON.stringify(drivers.slice(0, 1), null, 2)}</div>
            <div>Filtered Count: {filteredDrivers.length}</div>
          </div>
        )}
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ver por</label>
              <select 
                value={filters.viewBy}
                onChange={(e) => handleFilterChange({ 
                  viewBy: e.target.value as 'organization' | 'route',
                  selectedOrganization: undefined,
                  selectedRoute: undefined
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="organization">Organización</option>
                <option value="route">Ruta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {filters.viewBy === 'organization' ? 'ID de Organización' : 'ID de Ruta'}
              </label>
              <input
                type="text"
                placeholder={filters.viewBy === 'organization' ? 'Ingresa el ID de la organización' : 'Ingresa el ID de la ruta'}
                value={filters.viewBy === 'organization' ? (filters.selectedOrganization || '') : (filters.selectedRoute || '')}
                onChange={(e) => handleFilterChange({ 
                  [filters.viewBy === 'organization' ? 'selectedOrganization' : 'selectedRoute']: e.target.value || undefined
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {filters.viewBy === 'organization' 
                  ? 'Deja vacío para ver todas las organizaciones' 
                  : 'Deja vacío para ver todas las rutas'
                }
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showOnlyActive}
                  onChange={(e) => handleFilterChange({ showOnlyActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Solo activos</span>
              </label>
              
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleFilterChange({ 
                    selectedOrganization: undefined, 
                    selectedRoute: undefined 
                  })}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Limpiar filtros
                </button>
                
                {filters.viewBy === 'route' && filters.selectedRoute && isAuthenticated && (
                  <button
                    onClick={() => {
                      joinRoute(filters.selectedRoute!);
                      addMessage(`🚚 Uniéndose a la ruta: ${filters.selectedRoute!.slice(-8)}`, 'info');
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Unirse a ruta
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Drivers</p>
              <p className="text-xl font-bold text-gray-900">{drivers.length}</p>
            </div>
            <Users className="w-6 h-6 text-blue-500" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Activos</p>
              <p className="text-xl font-bold text-green-600">
                {drivers.filter(d => ['DRIVING', 'ACTIVE', 'IDLE'].includes(d.status)).length}
              </p>
            </div>
            <MapPin className="w-6 h-6 text-green-500" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">En Ruta</p>
              <p className="text-xl font-bold text-yellow-600">
                {drivers.filter(d => d.status === 'BUSY').length}
              </p>
            </div>
            <Route className="w-6 h-6 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Filtrados</p>
              <p className="text-xl font-bold text-blue-600">{filteredDrivers.length}</p>
            </div>
            <Filter className="w-6 h-6 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Map */}
      <Card className="p-0 overflow-hidden">
        <div className="h-[800px] w-full">
          <BaseMap
            center={defaultCenter}
            zoom={13}
            onMapReady={handleMapReady}
            className="w-full h-[800px]"
          >
            {/* Map content is handled by useEffect above */}
          </BaseMap>
        </div>
      </Card>

      {/* Messages Log */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Actividad en Tiempo Real
            </h3>
            <button
              onClick={() => setMessages([])}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Limpiar mensajes
            </button>
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {messages.length === 0 ? (
            <div key={messages.length} className="p-8 text-center">
              <div className="w-12 h-12 text-gray-400 mx-auto mb-4">📡</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sin actividad
              </h3>
              <p className="text-gray-600">
                Los mensajes de actividad del WebSocket aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`p-3 ${
                    message.type === 'success' ? 'bg-green-50' :
                    message.type === 'error' ? 'bg-red-50' :
                    'bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className={`text-sm font-medium ${
                      message.type === 'success' ? 'text-green-800' :
                      message.type === 'error' ? 'text-red-800' :
                      'text-blue-800'
                    }`}>
                      {message.text}
                    </p>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Driver List */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Conductores ({filteredDrivers.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredDrivers.length === 0 ? (
            <div key={3} className="p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay conductores {filters.showOnlyActive ? 'activos' : ''}
              </h3>
              <p className="text-gray-600">
                {!isConnected 
                  ? 'Conecta al WebSocket para ver los datos en tiempo real'
                  : 'Los conductores aparecerán aquí cuando estén transmitiendo su ubicación'
                }
              </p>
            </div>
          ) : (
            filteredDrivers.map(driver => (
              <div key={driver?.driverId || ''} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      ['DRIVING', 'ACTIVE', 'IDLE'].includes(driver.status) ? 'bg-green-500 animate-pulse' :
                      driver.status === 'BUSY' ? 'bg-yellow-500' :
                      driver.status === 'OFFLINE' ? 'bg-gray-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">
                        Driver {driver?.driverId?.slice(-6)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {driver?.location?.lat?.toFixed(4)}, {driver?.location?.lng?.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      ['DRIVING', 'ACTIVE', 'IDLE'].includes(driver.status) ? 'text-green-600 bg-green-100' :
                      driver.status === 'BUSY' ? 'text-yellow-600 bg-yellow-100' :
                      driver.status === 'OFFLINE' ? 'text-gray-600 bg-gray-100' : 'text-blue-600 bg-blue-100'
                    }`}>
                      {driver.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(driver.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                {driver.routeId && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Ruta:</span> {driver.routeId.slice(-6)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
