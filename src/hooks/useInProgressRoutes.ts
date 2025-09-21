import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SavedRoute } from '@/types';

interface InProgressRoutesResponse {
  success: boolean;
  data: SavedRoute[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useInProgressRoutes() {
  const [inProgressRoutes, setInProgressRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentOrganization, isLoading: authLoading } = useAuth();

  const fetchInProgressRoutes = useCallback(async () => {
    if (!currentOrganization?.uuid) {
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/routes?status=IN_PROGRESS&limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': currentOrganization.uuid,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch in-progress routes: ${response.status}`);
      }

      const data: InProgressRoutesResponse = await response.json();
      
      if (data.success) {
        setInProgressRoutes(data.data);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching in-progress routes:', err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.uuid]);

  // Fetch routes when organization changes
  useEffect(() => {
    if (authLoading || !currentOrganization?.uuid) return;

    fetchInProgressRoutes();
  }, [currentOrganization?.uuid, fetchInProgressRoutes, authLoading]);

  return {
    inProgressRoutes,
    loading: loading || authLoading,
    error,
    refetch: fetchInProgressRoutes,
  };
}
