import React from 'react';
import { Organization } from '@/types';
import { Card, CardContent } from './Card';
import { Building2, Crown, Calendar, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { RoleBadges } from './RoleBadge';

interface OrganizationInfoProps {
  organization: Organization;
  showDetails?: boolean;
}

export function OrganizationInfo({ organization, showDetails = false }: OrganizationInfoProps) {
  const isPro = organization.plan_type === 'PRO';
  const isActive = organization.status === 'ACTIVE';
  
  // Calcular días restantes de suscripción
  const subscriptionExpires = new Date(organization.subscription_expires_at);
  const daysUntilExpiry = Math.ceil((subscriptionExpires.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry < 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Logo */}
          <div className="flex-shrink-0">
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
          </div>

          {/* Información principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold theme-text-primary truncate">
                {organization.name}
              </h3>
              {isPro && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  PRO
                </span>
              )}
              {!isActive && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Inactiva
                </span>
              )}
            </div>

            {organization.description && (
              <p className="text-sm theme-text-secondary mb-3 line-clamp-2">
                {organization.description}
              </p>
            )}

            {/* Roles */}
            <div className="mb-3">
              <RoleBadges 
                roles={organization.roles.map(role => role.name)} 
                size="sm" 
                showIcon={false}
              />
            </div>

            {/* Estado de suscripción */}
            <div className="flex items-center space-x-4 text-sm theme-text-muted">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {isExpired ? (
                  <span className="text-red-600 font-medium">Suscripción expirada</span>
                ) : isExpiringSoon ? (
                  <span className="text-orange-600 font-medium">Expira en {daysUntilExpiry} días</span>
                ) : (
                  <span>Expira {subscriptionExpires.toLocaleDateString()}</span>
                )}
              </div>
              
              {organization.domain && (
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-1" />
                  <span>{organization.domain}</span>
                </div>
              )}
            </div>

            {/* Detalles adicionales */}
            {showDetails && (
              <div className="mt-4 pt-4 border-t theme-border space-y-2">
                {organization.contact_email && (
                  <div className="flex items-center text-sm theme-text-secondary">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{organization.contact_email}</span>
                  </div>
                )}
                
                {organization.contact_phone && (
                  <div className="flex items-center text-sm theme-text-secondary">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{organization.contact_phone}</span>
                  </div>
                )}
                
                {organization.address && (
                  <div className="flex items-center text-sm theme-text-secondary">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="truncate">{organization.address}</span>
                  </div>
                )}
                
                {organization.website_url && (
                  <div className="flex items-center text-sm theme-text-secondary">
                    <Globe className="w-4 h-4 mr-2" />
                    <a 
                      href={organization.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 truncate"
                    >
                      {organization.website_url}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
