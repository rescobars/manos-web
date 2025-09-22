'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DriverMap } from '@/features/map';
import { MapControlsProvider } from '@/contexts/MapControlsContext';
import { MapControlsContainer } from '@/components/map/MapControlsContainer';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function OwnerDashboard() {
  const { currentOrganization, user, logout } = useAuth();

  if (!currentOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró la organización</p>
      </div>
    );
  }

  return (
    <MapControlsProvider>
      <DashboardLayout 
        user={user} 
        onLogout={logout} 
        currentSlug={currentOrganization.slug}
        isFullScreen={true}
        rightSidebar={<MapControlsContainer />}
      >
        <div className="relative w-full h-full overflow-hidden">
          {/* Mapa ocupa toda el área disponible */}
          <DriverMap 
            className="w-full h-full"
            onDriverClick={(driver) => {
              console.log('Driver clicked:', driver);
              // Aquí puedes agregar lógica para mostrar detalles del conductor
            }}
          />
        </div>
      </DashboardLayout>
    </MapControlsProvider>
  );
}
