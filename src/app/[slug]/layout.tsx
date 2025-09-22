'use client';

import { useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
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

  const slug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : '';
  
  // Detectar si estamos en el dashboard para mostrar controles adicionales
  const isDashboard = pathname?.includes('/dashboard');

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando organización...</p>
        </div>
      </div>
    );
  }

  // Aplicar DashboardLayout a todas las páginas de la organización
  return (
    <DashboardLayout 
      user={user} 
      onLogout={logout} 
      currentSlug={slug}
      isFullScreen={isDashboard}
    >
      {children}
    </DashboardLayout>
  );
}
