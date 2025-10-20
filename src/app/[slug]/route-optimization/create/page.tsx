'use client';

import React from 'react';
import { RouteCreationModal } from '@/features/route-optimization/components/RouteCreationModal';
import { useRouter } from 'next/navigation';

export default function CreateRoutePage() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  const handleRouteCreated = () => {
    // Redirigir a la página de rutas después de crear
    router.push('../routes');
  };

  return (
    <RouteCreationModal
      onClose={handleClose}
      onRouteCreated={handleRouteCreated}
      asPage={true}
    />
  );
}