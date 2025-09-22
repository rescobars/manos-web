import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DriverPosition } from './useDriverPositions';
import { RouteDriverPosition } from './useRouteDriverPositions';
import { useWebSocketDriverUpdates } from './useWebSocketDriverUpdates';

type UnifiedDriverPosition = DriverPosition | RouteDriverPosition;

interface UnifiedDriverPositionsResponse {
  success: boolean;
  data: DriverPosition[];
}

interface RouteDriverPositionsResponse {
  success: boolean;
  data: RouteDriverPosition[];
}

export function useUnifiedDriverPositions() {
  const [driverPositions, setDriverPositions] = useState<UnifiedDriverPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const { currentOrganization, isLoading: authLoading } = useAuth();

  // PUNTO 4: Conectar WebSocket después del centrado del mapa
  const [mapCentered, setMapCentered] = useState(false);
  const [mapCenteringComplete, setMapCenteringComplete] = useState(false);
  const [wsReady, setWsReady] = useState(false);

  // Integrar WebSocket para actualizaciones en tiempo real
  const { isConnected: wsConnected } = useWebSocketDriverUpdates({
    driverPositions,
    setDriverPositions,
    selectedRouteIds,
    isInitialLoadComplete: !loading && !authLoading && mapCenteringComplete && wsReady
  });

  // Fetch all drivers (GET endpoint)
  const fetchAllDrivers = useCallback(async () => {
    if (!currentOrganization?.uuid) {
      setDriverPositions([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/driver-positions/organizations/${currentOrganization.uuid}/drivers/last-positions`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch driver positions: ${response.status}`);
      }

      const data: UnifiedDriverPositionsResponse = await response.json();
      
      if (data.success) {
        console.log('✅ TODOS LOS CONDUCTORES CARGADOS:', data.data.length, 'conductores');
        setDriverPositions(data.data);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching driver positions:', err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.uuid]);

  // Fetch drivers for specific routes (POST endpoint)
  const fetchRouteDrivers = useCallback(async (routeIds: string[]) => {
    if (!currentOrganization?.uuid || routeIds.length === 0) {
      setDriverPositions([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/driver-positions/routes/drivers/last-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': currentOrganization.uuid,
        },
        body: JSON.stringify({ routeIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch route driver positions: ${response.status}`);
      }

      const data: RouteDriverPositionsResponse = await response.json();
      
      if (data.success) {
        console.log('✅ CONDUCTORES DE RUTAS CARGADOS:', data.data.length, 'conductores para rutas:', routeIds);
        setDriverPositions(data.data);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching route driver positions:', err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.uuid]);

  // Update selected routes - solo actualizar el estado, el filtrado se hace en el frontend
  const updateSelectedRoutes = useCallback((routeIds: string[]) => {
    console.log('🔄 ACTUALIZANDO RUTAS SELECCIONADAS:', routeIds);
    setSelectedRouteIds(routeIds);
    
    // Solo cargar conductores si no tenemos datos
    if (driverPositions.length === 0) {
      if (routeIds.length > 0) {
        console.log('📍 CARGANDO CONDUCTORES DE RUTAS:', routeIds);
        fetchRouteDrivers(routeIds);
      } else {
        console.log('🌐 CARGANDO TODOS LOS CONDUCTORES');
        fetchAllDrivers();
      }
    } else {
      console.log('✅ USANDO CONDUCTORES EXISTENTES - Filtrado en frontend');
    }
  }, [fetchRouteDrivers, fetchAllDrivers, driverPositions.length]);

  // Initial load only - no auto-refresh
  useEffect(() => {
    if (authLoading || !currentOrganization?.uuid) return;

    // Initial fetch only
    if (selectedRouteIds.length > 0) {
      fetchRouteDrivers(selectedRouteIds);
    } else {
      fetchAllDrivers();
    }
  }, [selectedRouteIds, fetchRouteDrivers, fetchAllDrivers, authLoading, currentOrganization?.uuid]);

  // PUNTO 4: Activar WebSocket después del centrado del mapa
  useEffect(() => {
    if (!loading && !authLoading && mapCenteringComplete && !wsReady) {
      const timer = setTimeout(() => {
        setWsReady(true);
      }, 500); // Reducido de 1000ms a 500ms

      return () => clearTimeout(timer);
    }
  }, [loading, authLoading, mapCenteringComplete, wsReady]);

  return {
    driverPositions,
    selectedRouteIds,
    loading: loading || authLoading,
    error,
    updateSelectedRoutes,
    wsConnected,
    setMapCentered,
    setMapCenteringComplete,
    wsReady,
  };
}