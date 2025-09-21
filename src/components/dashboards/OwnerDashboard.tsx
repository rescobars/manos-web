'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DriverMap } from '@/components/ui/mapbox/DriverMap';
import { 
  Crown,
  Shield
} from 'lucide-react';

export default function OwnerDashboard() {
  const { currentOrganization, organizations, hasPermission } = useAuth();

  if (!currentOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró la organización</p>
      </div>
    );
  }

  const isPlatformAdmin = currentOrganization.roles.some(role => role.name === 'PLATFORM_ADMIN');

  return (
    <div className="absolute inset-0 w-full h-full relative overflow-hidden">
      {/* Mapa ocupa toda el área disponible */}
      <DriverMap 
        className="w-full h-full"
        onDriverClick={(driver) => {
          console.log('Driver clicked:', driver);
          // Aquí puedes agregar lógica para mostrar detalles del conductor
        }}
      />
      
      {/* Header flotante minimalista */}
      <div className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center space-x-2">
          {currentOrganization.logo_url ? (
            <img 
              src={currentOrganization.logo_url} 
              alt={`${currentOrganization.name} logo`}
              className="w-6 h-6 rounded object-cover"
            />
          ) : (
            <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded flex items-center justify-center">
              <Crown className="w-3 h-3 text-white" />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-900">
              {currentOrganization.name}
            </span>
            {isPlatformAdmin && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                <Shield className="w-2.5 h-2.5 mr-1" />
                Admin
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
