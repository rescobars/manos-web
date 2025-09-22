import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface DriverPosition {
  driverId: string;
  driverName: string;
  driverUuid: string;
  routeId: string;
  routeName: string;
  organizationId: string;
  organizationName: string;
  vehicleId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
  };
  status: 'DRIVING' | 'IDLE' | 'OFFLINE' | 'BREAK';
  batteryLevel: number;
  signalStrength: number;
  networkType: string;
  timestamp: string;
  transmission_timestamp: string;
  metadata: {
    appVersion: string;
    deviceInfo: string;
    networkType: string;
  };
}

interface DriverPositionsResponse {
  success: boolean;
  data: DriverPosition[];
}

export function useDriverPositions() {
  const [driverPositions, setDriverPositions] = useState<DriverPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentOrganization, isLoading: authLoading } = useAuth();

  const fetchDriverPositions = useCallback(async () => {
    if (!currentOrganization?.uuid) {
      setError(null); // No error if no organization yet
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

      const data: DriverPositionsResponse = await response.json();
      
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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    // Don't fetch if auth is still loading or no organization
    if (authLoading || !currentOrganization?.uuid) return;

    // Initial fetch
    fetchDriverPositions();

    // Set up interval for auto-refresh
    const interval = setInterval(fetchDriverPositions, 30000);

    return () => clearInterval(interval);
  }, [currentOrganization?.uuid, fetchDriverPositions, authLoading]);

  return {
    driverPositions,
    loading: loading || authLoading,
    error,
    refetch: fetchDriverPositions,
  };
}
