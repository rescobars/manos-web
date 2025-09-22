'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DriverMap } from '@/features/map';

export default function OwnerDashboard() {
  const { currentOrganization } = useAuth();

  if (!currentOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró la organización</p>
      </div>
    );
  }

  return (
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
  );
}
