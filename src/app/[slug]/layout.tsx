'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const { 
    user, 
    organizations, 
    currentOrganization, 
    setCurrentOrganization, 
    getOrganizationBySlug,
    isAuthenticated,
    isLoading,
    logout
  } = useAuth();

  const slug = params.slug as string;

  useEffect(() => {
    // Si no está autenticado, redirigir a login
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Si está autenticado pero no hay organizaciones, esperar
    if (!isLoading && isAuthenticated && (!organizations || organizations.length === 0)) {
      return;
    }

    // Si está autenticado y hay organizaciones
    if (!isLoading && isAuthenticated && organizations && organizations.length > 0) {
      // Buscar la organización por slug
      const organization = getOrganizationBySlug(slug);

      if (organization) {
        // Si la organización actual es diferente, actualizarla
        if (!currentOrganization || currentOrganization.uuid !== organization.uuid) {
          setCurrentOrganization(organization);
        }
      } else {
        // Si no se encuentra la organización, redirigir a la primera disponible
        const firstOrg = organizations[0];
        if (firstOrg && firstOrg.slug !== slug) {
          router.push(`/${firstOrg.slug}/dashboard`);
        }
      }
    }
  }, [slug, organizations, currentOrganization, isAuthenticated, isLoading, router, setCurrentOrganization, getOrganizationBySlug]);

  // Mostrar loading mientras se verifica la organización
  if (isLoading || !isAuthenticated || !organizations || organizations.length === 0 || !currentOrganization || currentOrganization.slug !== slug) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando organización...</p>
        </div>
      </div>
    );
  }

  // Detectar si estamos en el dashboard para usar pantalla completa
  const isDashboard = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard');
  
  return (
    <DashboardLayout user={user} onLogout={logout} currentSlug={slug} isFullScreen={isDashboard}>
      {children}
    </DashboardLayout>
  );
}
