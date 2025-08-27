import { useState, useCallback } from 'react';
import { getMapboxToken } from '@/lib/mapbox';

interface Location {
  lat: number;
  lng: number;
  address: string;
  id?: string; // Para identificar el pedido
}

interface OptimizedRoute {
  waypoints: Location[];
  totalDistance: number; // en metros
  totalDuration: number; // en segundos
  route: any; // Respuesta completa de Mapbox
}

interface RouteOptimizationOptions {
  profile?: 'driving' | 'walking' | 'cycling';
  avoid?: 'ferries' | 'tolls' | 'highways' | 'indoor';
  optimize?: boolean;
}

export function useRouteOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeRoute = useCallback(async (
    pickupLocation: Location,
    deliveryLocations: Location[],
    options: RouteOptimizationOptions = {}
  ): Promise<OptimizedRoute | null> => {
    if (deliveryLocations.length === 0) {
      return null;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const token = getMapboxToken();
      if (!token) {
        throw new Error('Mapbox token no configurado');
      }

      // Construir la URL de la API de direcciones
      const baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';
      const profile = options.profile || 'driving';
      
      // Coordenadas en formato requerido por Mapbox: lng,lat
      const coordinates = [
        `${pickupLocation.lng},${pickupLocation.lat}`, // Punto de partida (sucursal)
        ...deliveryLocations.map(loc => `${loc.lng},${loc.lat}`) // Puntos de entrega
      ].join(';');

      // Parámetros de la API
      const params = new URLSearchParams({
        access_token: token,
        alternatives: 'false',
        annotations: 'distance,duration',
        steps: 'true',
        overview: 'full',
        geometries: 'geojson',
        ...(options.optimize !== false && { optimize: 'true' }), // Optimizar por defecto
        ...(options.avoid && { avoid: options.avoid })
      });

      const url = `${baseUrl}/${profile}/${coordinates}?${params}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error en la API: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Crear array de waypoints optimizados
        const waypoints: Location[] = [];
        
        // Agregar punto de partida
        waypoints.push(pickupLocation);
        
        // Agregar puntos de entrega en el orden optimizado
        if (route.legs && route.legs.length > 1) {
          // El primer leg es del pickup al primer delivery
          // Los siguientes legs son entre deliveries
          for (let i = 1; i < route.legs.length; i++) {
            const leg = route.legs[i];
            const deliveryIndex = i - 1;
            if (deliveryIndex < deliveryLocations.length) {
              waypoints.push(deliveryLocations[deliveryIndex]);
            }
          }
        }

        const optimizedRoute: OptimizedRoute = {
          waypoints,
          totalDistance: route.distance,
          totalDuration: route.duration,
          route: data
        };

        return optimizedRoute;
      }

      throw new Error('No se pudo generar la ruta optimizada');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error optimizando ruta:', err);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const getRouteSummary = useCallback((route: OptimizedRoute) => {
    const totalKm = (route.totalDistance / 1000).toFixed(1);
    const totalHours = Math.floor(route.totalDuration / 3600);
    const totalMinutes = Math.floor((route.totalDuration % 3600) / 60);
    
    return {
      totalDistance: `${totalKm} km`,
      totalDuration: totalHours > 0 
        ? `${totalHours}h ${totalMinutes}m`
        : `${totalMinutes}m`,
      waypointCount: route.waypoints.length
    };
  }, []);

  return {
    optimizeRoute,
    getRouteSummary,
    isOptimizing,
    error,
    clearError: () => setError(null)
  };
}
