import { useState, useEffect, useCallback } from 'react';
import { organizationMembersApiService, Driver } from '@/lib/api/organization-members';

interface UseDriversReturn {
  drivers: Driver[];
  isLoading: boolean;
  error: string | null;
  fetchDrivers: (organizationUuid: string) => Promise<void>;
  refetch: () => void;
}

export function useDrivers(): UseDriversReturn {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOrganizationUuid, setCurrentOrganizationUuid] = useState<string | null>(null);

  const fetchDrivers = useCallback(async (organizationUuid: string) => {
    if (!organizationUuid) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setCurrentOrganizationUuid(organizationUuid);
      
      const response = await organizationMembersApiService.getDrivers(organizationUuid);
      
      if (response.success && response.data) {
        setDrivers(response.data);
      } else {
        setError('Error al cargar los conductores');
        setDrivers([]);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Error al cargar los conductores');
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (currentOrganizationUuid) {
      fetchDrivers(currentOrganizationUuid);
    }
  }, [currentOrganizationUuid, fetchDrivers]);

  return {
    drivers,
    isLoading,
    error,
    fetchDrivers,
    refetch
  };
}
