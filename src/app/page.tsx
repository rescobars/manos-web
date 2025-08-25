'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, defaultOrganization } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && defaultOrganization) {
        // Redirigir al dashboard de la organización por defecto
        router.push(`/${defaultOrganization.slug}/dashboard`);
      } else if (isAuthenticated) {
        // Si está autenticado pero no hay organización por defecto, ir al login
        router.push('/login');
      } else {
        // Si no está autenticado, ir al login
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, defaultOrganization, router]);

  // Mostrar loading mientras se verifica la autenticación
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}
