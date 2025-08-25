'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { 
  Users, 
  Building2, 
  Truck,
  Package,
  Shield,
  Crown,
  Calendar,
  Globe
} from 'lucide-react';

export default function DashboardPage() {
  const { 
    user, 
    currentOrganization, 
    organizations,
    hasPermission 
  } = useAuth();

  if (!currentOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró la organización</p>
      </div>
    );
  }

  const isPlatformAdmin = currentOrganization.roles.some(role => role.name === 'PLATFORM_ADMIN');
  const isOwner = currentOrganization.is_owner;
  const isAdmin = currentOrganization.is_admin;

  return (
    <div className="space-y-6">
      {/* Header con información de la organización */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {currentOrganization.logo_url ? (
              <img 
                src={currentOrganization.logo_url} 
                alt={`${currentOrganization.name} logo`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            )}
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard - {currentOrganization.name}
              </h1>
              <p className="text-gray-600">{currentOrganization.description}</p>
              
              <div className="flex items-center space-x-2 mt-2">
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
                {currentOrganization.plan_type === 'ENTERPRISE' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Enterprise
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-1" />
              {currentOrganization.domain}
            </div>
            <div className="flex items-center mt-1">
              <Calendar className="w-4 h-4 mr-1" />
              Expira {new Date(currentOrganization.subscription_expires_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Building2}
          title="Organizaciones"
          value={organizations.length}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />

        <StatCard
          icon={Users}
          title="Miembros"
          value="12"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />

        <StatCard
          icon={Truck}
          title="Conductores"
          value="8"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />

        <StatCard
          icon={Package}
          title="Pedidos Hoy"
          value="24"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </div>

      {/* Permisos del usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(currentOrganization.permissions).map(([module, permissions]) => {
              if (!permissions || typeof permissions !== 'object') return null;
              
              const grantedPermissions = Object.values(permissions).filter(Boolean).length;
              const totalPermissions = Object.keys(permissions).length;
              
              return (
                <div key={module} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm capitalize mb-1">
                    {module.replace('_', ' ')}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {grantedPermissions}/{totalPermissions} permisos
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hasPermission('orders', 'create') && (
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <Package className="w-6 h-6 text-blue-600 mb-2" />
                <h4 className="font-medium">Crear Pedido</h4>
                <p className="text-sm text-gray-600">Nuevo pedido</p>
              </button>
            )}
            
            {hasPermission('drivers', 'create') && (
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <Truck className="w-6 h-6 text-green-600 mb-2" />
                <h4 className="font-medium">Agregar Conductor</h4>
                <p className="text-sm text-gray-600">Nuevo conductor</p>
              </button>
            )}
            
            {hasPermission('customers', 'create') && (
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <Users className="w-6 h-6 text-purple-600 mb-2" />
                <h4 className="font-medium">Agregar Cliente</h4>
                <p className="text-sm text-gray-600">Nuevo cliente</p>
              </button>
            )}
            
            {hasPermission('reports', 'read') && (
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <Building2 className="w-6 h-6 text-orange-600 mb-2" />
                <h4 className="font-medium">Ver Reportes</h4>
                <p className="text-sm text-gray-600">Analíticas</p>
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
