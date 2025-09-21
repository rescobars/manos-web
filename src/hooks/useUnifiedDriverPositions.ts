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

  // Estado para controlar cuando el mapa ya se centró
  const [mapCentered, setMapCentered] = useState(false);

  // Integrar WebSocket para actualizaciones en tiempo real
  const { isConnected: wsConnected } = useWebSocketDriverUpdates({
    driverPositions,
    setDriverPositions,
    selectedRouteIds,
    isInitialLoadComplete: !loading && !authLoading && mapCentered
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

  // Update selected routes and fetch accordingly
  const updateSelectedRoutes = useCallback((routeIds: string[]) => {
    setSelectedRouteIds(routeIds);
    
    if (routeIds.length > 0) {
      fetchRouteDrivers(routeIds);
    } else {
      fetchAllDrivers();
    }
  }, [fetchRouteDrivers, fetchAllDrivers]);

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

  return {
    driverPositions,
    selectedRouteIds,
    loading: loading || authLoading,
    error,
    updateSelectedRoutes,
    wsConnected,
    setMapCentered,
  };
}