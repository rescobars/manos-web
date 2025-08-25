'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Building2, 
  Shield,
  Crown,
  Calendar,
  Globe,
  Users,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function OrganizationDetailPage() {
  const params = useParams();
  const { organizations, hasPermission } = useAuth();
  
  const orgId = params.orgId as string;
  const organization = organizations.find(org => org.uuid === orgId);

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Organización no encontrada</p>
        <Link href="/organizations">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Organizaciones
          </Button>
        </Link>
      </div>
    );
  }

  const isPlatformAdmin = organization.roles.some(role => role.name === 'PLATFORM_ADMIN');
  const isOwner = organization.is_owner;
  const isAdmin = organization.is_admin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/organizations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-600">Detalles de la organización</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {hasPermission('organizations', 'update') && (
            <Button variant="outline">
              Editar
            </Button>
          )}
          {hasPermission('organizations', 'delete') && (
            <Button variant="outline" className="text-red-600 hover:text-red-700">
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  {organization.logo_url ? (
                    <img 
                      src={organization.logo_url} 
                      alt={`${organization.name} logo`}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-white" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{organization.name}</h3>
                    <p className="text-gray-600 mb-2">{organization.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {isPlatformAdmin && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Administrador de Plataforma
                        </span>
                      )}
                      {isOwner && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Crown className="w-3 h-3 mr-1" />
                          Propietario
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        organization.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {organization.status}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {organization.plan_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organization.contact_email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600">{organization.contact_email}</p>
                    </div>
                  </div>
                )}
                
                {organization.contact_phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-gray-600">{organization.contact_phone}</p>
                    </div>
                  </div>
                )}
                
                {organization.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Dirección</p>
                      <p className="text-sm text-gray-600">{organization.address}</p>
                    </div>
                  </div>
                )}
                
                {organization.website_url && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Sitio Web</p>
                      <a 
                        href={organization.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {organization.website_url}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Suscripción */}
          <Card>
            <CardHeader>
              <CardTitle>Suscripción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plan</span>
                  <span className="font-medium">{organization.plan_type}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expira</span>
                  <span className="font-medium">
                    {new Date(organization.subscription_expires_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Miembro desde</span>
                  <span className="font-medium">
                    {new Date(organization.member_since).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {organization.roles.map((role) => (
                  <div key={role.uuid} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{role.name}</span>
                      {role.name === 'PLATFORM_ADMIN' && <Shield className="w-4 h-4 text-purple-600" />}
                      {role.name === 'OWNER' && <Crown className="w-4 h-4 text-yellow-600" />}
                    </div>
                    <p className="text-xs text-gray-600">{role.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hasPermission('members', 'invite') && (
                  <Button className="w-full" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Invitar Miembro
                  </Button>
                )}
                
                {hasPermission('organizations', 'update') && (
                  <Button className="w-full" variant="outline">
                    Editar Organización
                  </Button>
                )}
                
                {hasPermission('reports', 'read') && (
                  <Button className="w-full" variant="outline">
                    Ver Reportes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
