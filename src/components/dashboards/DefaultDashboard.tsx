'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
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

export default function DefaultDashboard() {
  const { colors } = useDynamicTheme();
  const { 
    user, 
    currentOrganization, 
    organizations,
    hasPermission 
  } = useAuth();

  if (!currentOrganization) {
    return (
      <div className="text-center py-12">
        <p className="theme-text-secondary">No se encontró la organización</p>
      </div>
    );
  }

  const isPlatformAdmin = currentOrganization.roles.some(role => role.name === 'PLATFORM_ADMIN');
  const isOwner = currentOrganization.is_owner;
  const isAdmin = currentOrganization.is_admin;

  return (
    <div 
      className="space-y-4 sm:space-y-6 p-4 sm:p-6"
      style={{ backgroundColor: colors.background1 }}
    >
      {/* Header con información de la organización */}
      <div 
        className="theme-bg-3 rounded-lg shadow-sm border theme-border p-4 sm:p-6"
        style={{
          backgroundColor: colors.background3,
          borderColor: colors.border,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {currentOrganization.logo_url ? (
              <img 
                src={currentOrganization.logo_url} 
                alt={`${currentOrganization.name} logo`}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover mx-auto sm:mx-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            )}
            
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Dashboard - {currentOrganization.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">{currentOrganization.description}</p>
              
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-2">
                {isPlatformAdmin && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Shield className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Administrador de Plataforma</span>
                    <span className="sm:hidden">Admin</span>
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

          <div className="text-center lg:text-right text-sm text-gray-500 space-y-1">
            <div className="flex items-center justify-center lg:justify-end">
              <Globe className="w-4 h-4 mr-1" />
              <span className="truncate">{currentOrganization.domain}</span>
            </div>
            <div className="flex items-center justify-center lg:justify-end">
              <Calendar className="w-4 h-4 mr-1" />
              <span className="truncate">Expira {new Date(currentOrganization.subscription_expires_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          icon={Building2}
          title="Organizaciones"
          value={organizations.length}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        
        <StatCard
          icon={Package}
          title="Pedidos Hoy"
          value="24"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
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


      </div>

      {/* Permisos del usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Object.entries(currentOrganization.permissions).map(([module, permissions]) => {
              if (!permissions || typeof permissions !== 'object') return null;
              
              const grantedPermissions = Object.values(permissions).filter(Boolean).length;
              const totalPermissions = Object.keys(permissions).length;
              
              return (
                <div key={module} className="p-3 border rounded-lg text-center sm:text-left">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {hasPermission('orders', 'create') && (
              <button className="p-4 border rounded-lg text-center sm:text-left transition-colors theme-bg-3 theme-border hover:theme-bg-2" style={{ backgroundColor: colors.background3, borderColor: colors.border }}>
                <Package className="w-6 h-6 mb-2 mx-auto sm:mx-0" style={{ color: colors.info }} />
                <h4 className="font-medium text-sm sm:text-base" style={{ color: colors.textPrimary }}>Crear Pedido</h4>
                <p className="text-xs sm:text-sm" style={{ color: colors.textSecondary }}>Nuevo pedido</p>
              </button>
            )}
            
            {hasPermission('drivers', 'create') && (
              <button className="p-4 border rounded-lg text-center sm:text-left transition-colors theme-bg-3 theme-border hover:theme-bg-2" style={{ backgroundColor: colors.background3, borderColor: colors.border }}>
                <Truck className="w-6 h-6 mb-2 mx-auto sm:mx-0" style={{ color: colors.success }} />
                <h4 className="font-medium text-sm sm:text-base" style={{ color: colors.textPrimary }}>Agregar Conductor</h4>
                <p className="text-xs sm:text-sm" style={{ color: colors.textSecondary }}>Nuevo conductor</p>
              </button>
            )}
            
            {hasPermission('customers', 'create') && (
              <button className="p-4 border rounded-lg text-center sm:text-left transition-colors theme-bg-3 theme-border hover:theme-bg-2" style={{ backgroundColor: colors.background3, borderColor: colors.border }}>
                <Users className="w-6 h-6 mb-2 mx-auto sm:mx-0" style={{ color: colors.warning }} />
                <h4 className="font-medium text-sm sm:text-base" style={{ color: colors.textPrimary }}>Agregar Cliente</h4>
                <p className="text-xs sm:text-sm" style={{ color: colors.textSecondary }}>Nuevo cliente</p>
              </button>
            )}
            
            {hasPermission('reports', 'read') && (
              <button className="p-4 border rounded-lg text-center sm:text-left transition-colors theme-bg-3 theme-border hover:theme-bg-2" style={{ backgroundColor: colors.background3, borderColor: colors.border }}>
                <Building2 className="w-6 h-6 mb-2 mx-auto sm:mx-0" style={{ color: colors.error }} />
                <h4 className="font-medium text-sm sm:text-base" style={{ color: colors.textPrimary }}>Ver Reportes</h4>
                <p className="text-xs sm:text-sm" style={{ color: colors.textSecondary }}>Analíticas</p>
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
