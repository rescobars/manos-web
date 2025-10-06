import { useState } from 'react';

interface RouteAssignmentRequest {
  driver_notes?: string;
}

interface RouteAssignmentResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
}

export function useRouteAssignment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignDriverToRoute = async (
    routeUuid: string,
    membershipUuid: string,
    assignmentData: RouteAssignmentRequest,
    organizationId: string
  ): Promise<RouteAssignmentResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Obtener el token de autorización del localStorage
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`/api/route-drivers/assign/${routeUuid}/${membershipUuid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': organizationId,
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(assignmentData),
      });

      const result: RouteAssignmentResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Error del servidor: ${response.status}`);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al asignar conductor';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    assignDriverToRoute,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
