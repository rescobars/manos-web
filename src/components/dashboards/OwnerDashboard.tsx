'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DriverMap } from '@/features/map';
import { MapControlsProvider } from '@/contexts/MapControlsContext';
import { MapControlsContainer } from '@/components/map/MapControlsContainer';
import { MobileMapControlsContainer } from '@/components/map/MobileMapControlsContainer';
import { MobileControlsButton } from '@/components/map/MobileControlsButton';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useUnifiedDriverPositions } from '@/hooks/useUnifiedDriverPositions';
import { getRealDriverStatus } from '@/lib/leaflet/utils';

// Componente interno para manejar la lógica de controles móviles
function DashboardContent() {
  const { currentOrganization } = useAuth();
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  
  const { driverPositions, wsConnected } = useUnifiedDriverPositions();

  // Calcular conductores filtrados para el botón móvil
  const filteredDrivers = React.useMemo(() => {
    return driverPositions.filter(driver => {
      const realStatus = getRealDriverStatus(driver);
      return ['DRIVING', 'IDLE', 'STOPPED', 'BREAK', 'OFFLINE'].includes(realStatus);
    });
  }, [driverPositions]);

  if (!currentOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró la organización</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-full overflow-hidden" style={{ zIndex: 1 }}>
        {/* Mapa ocupa toda el área disponible */}
        <DriverMap 
          className="w-full h-full"
          onDriverClick={(driver) => {
            console.log('Driver clicked:', driver);
            // Aquí puedes agregar lógica para mostrar detalles del conductor
          }}
        />
      </div>
      
      {/* Botón flotante para controles móviles - Fuera del contenedor del mapa */}
      <MobileControlsButton
        isOpen={mobileControlsOpen}
        onToggle={() => setMobileControlsOpen(!mobileControlsOpen)}
        driverCount={filteredDrivers.length}
        totalDrivers={driverPositions.length}
        wsConnected={wsConnected}
      />

      {/* Controles móviles */}
      <MobileMapControlsContainer
        isOpen={mobileControlsOpen}
        onClose={() => setMobileControlsOpen(false)}
      />
    </>
  );
}

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
        <DashboardContent />
      </DashboardLayout>
    </MapControlsProvider>
  );
}
