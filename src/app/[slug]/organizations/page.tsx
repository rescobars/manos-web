'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Building2, 
  Plus,
  Shield,
  Crown,
  Calendar,
  Globe,
  Users,
  CheckCircle
} from 'lucide-react';

export default function OrganizationsPage() {
  const { 
    organizations, 
    currentOrganization,
    hasPermission 
  } = useAuth();

  const canCreateOrganizations = hasPermission('organizations', 'create');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizaciones</h1>
          <p className="text-gray-600">
            Gestiona todas tus organizaciones
          </p>
        </div>
        
        {canCreateOrganizations && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear Organización
          </Button>
        )}
      </div>

      {/* Grid de organizaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <Card 
            key={org.uuid} 
            className={`hover:shadow-md transition-shadow cursor-pointer ${
              currentOrganization?.uuid === org.uuid ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {org.logo_url ? (
                    <img 
                      src={org.logo_url} 
                      alt={`${org.name} logo`}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <p className="text-sm text-gray-600">{org.description}</p>
                  </div>
                </div>
                
                {currentOrganization?.uuid === org.uuid && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Roles del usuario */}
                <div className="flex flex-wrap gap-1">
                  {org.roles.map((role) => (
                    <span 
                      key={role.uuid}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        role.name === 'PLATFORM_ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : role.name === 'OWNER'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {role.name === 'PLATFORM_ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                      {role.name === 'OWNER' && <Crown className="w-3 h-3 mr-1" />}
                      {role.name}
                    </span>
                  ))}
                </div>

                {/* Información de la organización */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    <span>{org.domain}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {org.plan_type} - Expira {new Date(org.subscription_expires_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Miembro desde {new Date(org.member_since).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    org.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {org.status}
                  </span>
                  
                  {org.is_owner && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Crown className="w-3 h-3 mr-1" />
                      Propietario
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sin organizaciones */}
      {organizations.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes organizaciones
            </h3>
            <p className="text-gray-600 mb-4">
              Aún no has sido agregado a ninguna organización.
            </p>
            {canCreateOrganizations && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Crear Organización
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
