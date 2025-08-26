'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface OrganizationAuthLayoutProps {
  children: React.ReactNode;
}

export default function OrganizationAuthLayout({ children }: OrganizationAuthLayoutProps) {
  const params = useParams();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const orgUuid = params.orgUuid as string;

  useEffect(() => {
    // Aquí puedes cargar información de la organización si es necesario
    // Por ahora solo simulamos la carga
    const loadOrganization = async () => {
      try {
        // Puedes hacer una llamada a la API para obtener info de la organización
        // const response = await fetch(`/api/organizations/${orgUuid}`);
        // const data = await response.json();
        // setOrganization(data);
        
        // Por ahora solo simulamos
        setOrganization({
          uuid: orgUuid,
          name: 'Organización',
          logo_url: null
        });
      } catch (error) {
        console.error('Error loading organization:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganization();
  }, [orgUuid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando organización...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
