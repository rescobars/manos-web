'use client';

import React from 'react';
import { RouteCreationModal } from '@/features/route-optimization/components/RouteCreationModal';
import { useRouter, useParams } from 'next/navigation';

export default function CreateRoutePage() {
  const router = useRouter();
  const params = useParams();

  const handleClose = () => {
    const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
    router.push(`/${slug}/route-optimization`);
  };

  return (
    <RouteCreationModal
      asPage
      onClose={handleClose}
      onRouteCreated={handleClose}
    />
  );
}


