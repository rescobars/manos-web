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
    <div className="h-screen flex flex-col">
      {/* Header compacto */}
      <div className="bg-white border-b p-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          {currentOrganization.logo_url ? (
            <img 
              src={currentOrganization.logo_url} 
              alt={`${currentOrganization.name} logo`}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
          )}
          
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {currentOrganization.name}
            </h1>
            <div className="flex items-center space-x-2">
              {isPlatformAdmin && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </span>
              )}
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <Crown className="w-3 h-3 mr-1" />
                Propietario
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa principal */}
      <div className="flex-1 relative">
        <DriverMap 
          className="w-full h-full"
          onDriverClick={(driver) => {
            console.log('Driver clicked:', driver);
            // Aquí puedes agregar lógica para mostrar detalles del conductor
          }}
        />
      </div>
    </div>
  );
}
