import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface RouteDriverPosition {
  driverId: string;
  driverName: string;
  routeId: string;
  routeName: string;
  organizationId: string;
  organizationName: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
  };
  status: 'DRIVING' | 'STOPPED' | 'IDLE' | 'OFFLINE' | 'BREAK';
  timestamp: string;
}

interface RouteDriverPositionsResponse {
  success: boolean;
  data: RouteDriverPosition[];
}

export function useRouteDriverPositions() {
  const [routeDriverPositions, setRouteDriverPositions] = useState<RouteDriverPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const { currentOrganization, isLoading: authLoading } = useAuth();

  const fetchRouteDriverPositions = useCallback(async (routeIds: string[]) => {
    if (!currentOrganization?.uuid || routeIds.length === 0) {
      setRouteDriverPositions([]);
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
        setRouteDriverPositions(data.data);
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

  const updateSelectedRoutes = useCallback((routeIds: string[]) => {
    setSelectedRouteIds(routeIds);
    if (routeIds.length > 0) {
      fetchRouteDriverPositions(routeIds);
    } else {
      setRouteDriverPositions([]);
    }
  }, [fetchRouteDriverPositions]);

  // Auto-refresh every 30 seconds when routes are selected
  useEffect(() => {
    if (authLoading || selectedRouteIds.length === 0) return;

    // Initial fetch
    fetchRouteDriverPositions(selectedRouteIds);

    // Set up interval for auto-refresh
    const interval = setInterval(() => {
      fetchRouteDriverPositions(selectedRouteIds);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedRouteIds, fetchRouteDriverPositions, authLoading]);

  return {
    routeDriverPositions,
    selectedRouteIds,
    loading: loading || authLoading,
    error,
    updateSelectedRoutes,
    refetch: () => selectedRouteIds.length > 0 ? fetchRouteDriverPositions(selectedRouteIds) : Promise.resolve(),
  };
}
