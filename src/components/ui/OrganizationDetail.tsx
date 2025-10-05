'use client';

import React from 'react';
import { Organization } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { AuthenticationUrls } from './AuthenticationUrls';
import { PublicOrderUrl } from './PublicOrderUrl';
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Crown,
  Users,
  ExternalLink,
  X
} from 'lucide-react';

interface OrganizationDetailProps {
  organization: Organization;
  onClose: () => void;
  onEdit: (org: Organization) => void;
}

export function OrganizationDetail({
  organization,
  onClose,
  onEdit
}: OrganizationDetailProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'theme-bg-1 theme-text-primary';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'theme-bg-1 theme-text-primary';
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'FREE':
        return 'theme-bg-1 theme-text-primary';
      case 'BASIC':
        return 'bg-blue-100 text-blue-800';
      case 'PRO':
        return 'bg-purple-100 text-purple-800';
      case 'ENTERPRISE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'theme-bg-1 theme-text-primary';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            {organization.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={`${organization.name} logo`}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{organization.name}</CardTitle>
              <p className="text-sm theme-text-secondary">ID: {organization.uuid}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Estado y Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(organization.status)}`}>
                {organization.status}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(organization.plan_type)}`}>
                {organization.plan_type}
              </span>
            </div>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium theme-text-primary mb-3">Información General</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium theme-text-primary">Slug</label>
                    <p className="text-sm theme-text-primary font-mono theme-bg-2 px-2 py-1 rounded">
                      {organization.slug}
                    </p>
                  </div>
                  
                  {organization.description && (
                    <div>
                      <label className="block text-sm font-medium theme-text-primary">Descripción</label>
                      <p className="text-sm theme-text-primary">{organization.description}</p>
                    </div>
                  )}

                  {organization.domain && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 theme-text-muted" />
                      <div>
                        <label className="block text-sm font-medium theme-text-primary">Dominio</label>
                        <p className="text-sm theme-text-primary">{organization.domain}</p>
                      </div>
                    </div>
                  )}

                  {organization.website_url && (
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4 theme-text-muted" />
                      <div>
                        <label className="block text-sm font-medium theme-text-primary">Sitio web</label>
                        <a 
                          href={organization.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {organization.website_url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium theme-text-primary mb-3">Información de Contacto</h3>
                <div className="space-y-3">
                  {organization.contact_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 theme-text-muted" />
                      <div>
                        <label className="block text-sm font-medium theme-text-primary">Email</label>
                        <a 
                          href={`mailto:${organization.contact_email}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {organization.contact_email}
                        </a>
                      </div>
                    </div>
                  )}

                  {organization.contact_phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 theme-text-muted" />
                      <div>
                        <label className="block text-sm font-medium theme-text-primary">Teléfono</label>
                        <a 
                          href={`tel:${organization.contact_phone}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {organization.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {organization.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 theme-text-muted mt-0.5" />
                      <div>
                        <label className="block text-sm font-medium theme-text-primary">Dirección</label>
                        <p className="text-sm theme-text-primary">{organization.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fechas importantes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 theme-text-muted" />
              <div>
                <label className="block text-sm font-medium theme-text-primary">Miembro desde</label>
                <p className="text-sm theme-text-primary">{formatDate(organization.member_since)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 theme-text-muted" />
              <div>
                <label className="block text-sm font-medium theme-text-primary">Suscripción expira</label>
                <p className="text-sm theme-text-primary">{formatDate(organization.subscription_expires_at)}</p>
              </div>
            </div>
          </div>

          {/* Roles y permisos */}
          <div>
            <h3 className="text-lg font-medium theme-text-primary mb-3">Roles y Permisos</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium theme-text-primary mb-2">Roles del usuario</label>
                <div className="flex flex-wrap gap-2">
                  {organization.roles && organization.roles.length > 0 ? (
                    organization.roles.map((role) => (
                      <span 
                        key={role.uuid}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          role.name === 'PLATFORM_ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : role.name === 'OWNER'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'theme-bg-1 theme-text-primary'
                        }`}
                      >
                        {role.name === 'PLATFORM_ADMIN' && <Shield className="w-4 h-4 mr-1" />}
                        {role.name === 'OWNER' && <Crown className="w-4 h-4 mr-1" />}
                        {role.name}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium theme-bg-1 theme-text-primary">
                      Sin roles asignados
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">Permisos especiales</label>
                  <div className="space-y-1">
                    {organization.is_owner && (
                      <div className="flex items-center space-x-2">
                        <Crown className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm theme-text-primary">Propietario de la organización</span>
                      </div>
                    )}
                    {organization.is_admin && (
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span className="text-sm theme-text-primary">Administrador</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* URLs de Autenticación */}
          <div>
            <h3 className="text-lg font-medium theme-text-primary mb-3">URLs de Autenticación</h3>
            <AuthenticationUrls
              orgUuid={organization.uuid}
              role="DRIVER"
              showLabels={false}
              compact={false}
            />
          </div>

          {/* URL de Pedidos Públicos */}
          <div>
            <h3 className="text-lg font-medium theme-text-primary mb-3">URL de Pedidos Públicos</h3>
            <PublicOrderUrl
              orgUuid={organization.uuid}
              showLabels={false}
              compact={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
