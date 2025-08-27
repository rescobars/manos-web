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

    // Validaciones según documentación de Mapbox
    if (deliveryLocations.length > 24) {
      throw new Error('Mapbox Directions API solo permite máximo 25 waypoints (1 pickup + 24 entregas)');
    }
    
    // Nota: El parámetro optimize=true no está disponible en este plan de Mapbox
    // Usaremos optimización manual basada en distancia

    if (!pickupLocation.lat || !pickupLocation.lng) {
      throw new Error('Ubicación de pickup inválida');
    }

    if (deliveryLocations.some(loc => !loc.lat || !loc.lng)) {
      throw new Error('Algunas ubicaciones de entrega son inválidas');
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

      // Parámetros de la API - Sin optimize ya que no está disponible
      const params = new URLSearchParams({
        access_token: token,
        alternatives: 'false',
        annotations: 'distance,duration',
        steps: 'true',
        overview: 'full',
        geometries: 'geojson'  // Forzar JSON en lugar de PBF
        // Nota: optimize=true no está disponible en este plan de Mapbox
      });

      const url = `${baseUrl}/${profile}/${coordinates}?${params}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en la API Mapbox: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Como optimize=true no está disponible, usamos optimización manual simple
        // Basada en distancia desde el pickup
        const optimizedDeliveryLocations = [...deliveryLocations].sort((a, b) => {
          const distA = Math.sqrt(
            Math.pow(a.lat - pickupLocation.lat, 2) + 
            Math.pow(a.lng - pickupLocation.lng, 2)
          );
          const distB = Math.sqrt(
            Math.pow(b.lat - pickupLocation.lat, 2) + 
            Math.pow(b.lng - pickupLocation.lng, 2)
          );
          return distA - distB; // Ordenar por distancia (más cercano primero)
        });
        
        // Crear array de waypoints optimizados manualmente
        const waypoints: Location[] = [pickupLocation, ...optimizedDeliveryLocations];

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
