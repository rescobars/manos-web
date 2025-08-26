import { useState, useEffect } from 'react';

interface OrganizationInfo {
  uuid: string;
  name: string;
  slug: string;
  description: string;
  domain: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  status: string;
  plan_type: string;
  logo_url?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: OrganizationInfo;
  error?: string;
}

export function useOrganizationInfo(orgUuid: string | null) {
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgUuid) {
      setOrganization(null);
      return;
    }

    const fetchOrganization = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/organizations/public/${orgUuid}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data: ApiResponse = await response.json();

        if (data.success && data.data) {
          setOrganization(data.data);
        } else {
          setError(data.error || 'Error al cargar la organización');
        }
      } catch (err) {
        setError('Error al cargar la organización');
        console.error('Error fetching organization:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [orgUuid]);

  return { organization, loading, error };
}
