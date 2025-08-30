'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, MapPin, Clock, Navigation, Car } from 'lucide-react';

interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

interface Order {
  id: string;
  orderNumber: string;
  deliveryLocation: {
    lat: number;
    lng: number;
    address: string;
    id: string;
  };
  description?: string;
  totalAmount: number;
  createdAt: string;
}

interface TrafficOptimizedRouteMapProps {
  pickupLocation: PickupLocation;
  trafficOptimizedRoute: any; // Respuesta de TomTom
  orders: Order[];
}

export function TrafficOptimizedRouteMap({
  pickupLocation,
  trafficOptimizedRoute,
  orders
}: TrafficOptimizedRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState<any>(null);

  useEffect(() => {
    console.log('🔄 TrafficOptimizedRouteMap recibió datos:', trafficOptimizedRoute);
    
    // Verificar si la solución ya está lista
    if ('routes' in trafficOptimizedRoute || 'optimized_route' in trafficOptimizedRoute) {
      console.log('✅ Solución lista, configurando mapa...');
      setSolution(trafficOptimizedRoute);
      setIsLoading(false);
    } else {
      console.log('⏳ Solución aún procesándose, iniciando polling...');
      // La solución aún está procesándose, hacer polling
      pollForSolution(trafficOptimizedRoute.id);
    }
  }, [trafficOptimizedRoute]);

  const pollForSolution = async (id: string) => {
    try {
      const response = await fetch(`/api/route-optimization-mapbox?id=${id}`);
      const result = await response.json();
      
      if (result.success && ('routes' in result.data || 'optimized_route' in result.data)) {
        setSolution(result.data);
        setIsLoading(false);
      } else if (result.success && result.data.status === 'processing') {
        // Esperar 5 segundos y verificar de nuevo
        setTimeout(() => pollForSolution(id), 5000);
      } else {
        setError('Error al obtener la solución de optimización');
        setIsLoading(false);
      }
    } catch (error) {
      setError('Error de conexión');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!solution || !mapRef.current) return;

    // Importar Leaflet dinámicamente
    const initMap = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        // Crear el mapa
        const leafletMap = L.map(mapRef.current!).setView([pickupLocation.lat, pickupLocation.lng], 12);

        // Agregar capa de OpenStreetMap
        (L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMap);

        // Agregar marcador del almacén
        const warehouseIcon = L.divIcon({
          className: 'warehouse-marker',
          html: '<div class="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><MapPin className="w-4 h-4 text-white" /></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker([pickupLocation.lat, pickupLocation.lng], { icon: warehouseIcon })
          .addTo(leafletMap)
          .bindPopup('<b>Almacén</b><br/>Punto de partida', {
            className: 'custom-popup'
          });

        // Agregar marcadores de pedidos
        const orderMarkers: any[] = [];
        
        // Verificar si tenemos rutas de TomTom
        const routes = solution.routes || solution.optimized_route?.routes || [];
        console.log('Rutas encontradas:', routes);
        
        if (routes.length > 0) {
          routes.forEach((route: any, routeIndex: number) => {
            console.log(`Procesando ruta ${routeIndex}:`, route);
            
            route.stops.forEach((stop: any, stopIndex: number) => {
              console.log(`Procesando parada ${stopIndex}:`, stop);
              
              // Para TomTom, las paradas de tipo 'dropoff' son las entregas
              if (stop.type === 'dropoff') {
                // Extraer el ID del pedido del nombre de la ubicación
                const locationName = stop.location;
                const orderId = locationName.replace('stop-', '');
                console.log(`Buscando pedido con ID: ${orderId}`);
                
                const order = orders.find(o => o.id === orderId);
                
                if (order) {
                  console.log(`Pedido encontrado:`, order);
                  
                  const orderIcon = L.divIcon({
                    className: 'order-marker',
                    html: `<div class="w-5 h-5 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">${stopIndex}</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  });

                  const marker = L.marker([order.deliveryLocation.lat, order.deliveryLocation.lng], { icon: orderIcon })
                    .addTo(leafletMap)
                    .bindPopup(`
                      <div class="text-sm">
                        <b>Pedido #${order.orderNumber}</b><br/>
                        <b>Parada ${stopIndex}</b><br/>
                        <b>ETA:</b> ${new Date(stop.eta).toLocaleTimeString()}<br/>
                        <b>Distancia:</b> ${(stop.odometer / 1000).toFixed(1)}km<br/>
                        ${stop.wait ? `<b>Espera:</b> ${Math.round(stop.wait / 60)}min<br/>` : ''}
                        ${stop.duration ? `<b>Duración:</b> ${Math.round(stop.duration / 60)}min` : ''}
                      </div>
                    `, {
                      className: 'custom-popup'
                    });

                  orderMarkers.push(marker);
                } else {
                  console.warn(`Pedido no encontrado para ID: ${orderId}`);
                }
              }
            });
          });
        } else {
          console.warn('No se encontraron rutas en la solución');
        }

        // Dibujar rutas optimizadas
        if (routes.length > 0) {
          routes.forEach((route: any, routeIndex: number) => {
            console.log(`Dibujando ruta ${routeIndex}:`, route);
            const routeCoordinates: [number, number][] = [];
            
            route.stops.forEach((stop: any) => {
              if (stop.type === 'start') {
                routeCoordinates.push([pickupLocation.lat, pickupLocation.lng]);
              } else if (stop.type === 'dropoff') {
                // Extraer el ID del pedido del nombre de la ubicación
                const locationName = stop.location;
                const orderId = locationName.replace('stop-', '');
                const order = orders.find(o => o.id === orderId);
                
                if (order) {
                  routeCoordinates.push([order.deliveryLocation.lat, order.deliveryLocation.lng]);
                }
              } else if (stop.type === 'end') {
                routeCoordinates.push([pickupLocation.lat, pickupLocation.lng]);
              }
            });

            console.log(`Coordenadas de ruta ${routeIndex}:`, routeCoordinates);

            if (routeCoordinates.length > 1) {
              const routeLine = L.polyline(routeCoordinates, {
                color: routeIndex === 0 ? '#3B82F6' : '#10B981',
                weight: 4,
                opacity: 0.8,
                dashArray: routeIndex === 0 ? undefined : '10, 5'
              }).addTo(leafletMap);

              // Agregar información de la ruta
              const routeInfo = L.divIcon({
                className: 'route-info',
                html: `<div class="bg-white px-2 py-1 rounded shadow text-xs font-medium border">Ruta ${routeIndex + 1}</div>`,
                iconSize: [60, 20],
                iconAnchor: [30, 10]
              });

              // Colocar etiqueta en el medio de la ruta
              const midPoint = Math.floor(routeCoordinates.length / 2);
              if (routeCoordinates[midPoint]) {
                L.marker(routeCoordinates[midPoint], { icon: routeInfo })
                  .addTo(leafletMap);
              }
            }
          });
        }

        // Ajustar vista para mostrar todas las ubicaciones
        if (orderMarkers.length > 0) {
          const group = (L as any).featureGroup([...orderMarkers]);
          leafletMap.fitBounds(group.getBounds().pad(0.1));
        }

        setMap(leafletMap);
        setIsLoading(false);

      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Error al inicializar el mapa');
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [solution, pickupLocation, orders]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error en el mapa</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🚦</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Ruta Optimizada con TomTom
            </h3>
            <p className="text-sm text-gray-600">
              Optimización usando TomTom Routing API con datos de tráfico
            </p>
          </div>
        </div>
      </div>

      {/* Información de la optimización */}
      {solution && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Rutas generadas</p>
                <p className="text-lg font-bold text-blue-700">
                  {solution.routes?.length || solution.optimized_route?.routes?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Vehículos utilizados</p>
                <p className="text-lg font-bold text-blue-700">
                  {solution.routes?.length || solution.optimized_route?.routes?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Estado</p>
                <p className="text-lg font-bold text-blue-700">Optimizado con TomTom</p>
              </div>
            </div>
          </div>
          
          {/* Información adicional de la ruta */}
          {solution.routes && solution.routes[0] && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 font-medium">Total de paradas</p>
                  <p className="text-blue-900 font-bold">{solution.routes[0].stops.length}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Distancia total</p>
                  <p className="text-blue-900 font-bold">
                    {solution.routes[0].stops[solution.routes[0].stops.length - 1]?.odometer 
                      ? (solution.routes[0].stops[solution.routes[0].stops.length - 1].odometer / 1000).toFixed(1) + ' km'
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Tiempo estimado</p>
                  <p className="text-blue-900 font-bold">
                    {solution.routes[0].stops[solution.routes[0].stops.length - 1]?.eta 
                      ? new Date(solution.routes[0].stops[solution.routes[0].stops.length - 1].eta).toLocaleTimeString()
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Pedidos optimizados</p>
                  <p className="text-blue-900 font-bold">
                    {solution.routes[0].stops.filter((stop: any) => stop.type === 'dropoff').length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mapa */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          🗺️ Mapa de Rutas Optimizadas
        </h4>
        <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="relative">
            {/* Indicador de estado del mapa */}
            {isLoading && (
              <div className="absolute inset-0 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando mapa optimizado...</p>
                </div>
              </div>
            )}
            
            <div 
              ref={mapRef} 
              className={`w-full h-96 rounded-lg overflow-hidden ${
                isLoading ? 'opacity-50' : 'opacity-100'
              } transition-opacity duration-300`}
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>
      </div>

      {/* Leyenda del mapa */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-3">Leyenda del Mapa</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <span>Almacén</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            <span>Paradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Ruta principal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Rutas secundarias</span>
          </div>
        </div>
      </div>
    </div>
  );
}
