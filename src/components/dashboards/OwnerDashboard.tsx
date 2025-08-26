'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Crown,
  Settings,
  BarChart3,
  UserPlus,
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header específico para propietarios */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {currentOrganization.logo_url ? (
              <img 
                src={currentOrganization.logo_url} 
                alt={`${currentOrganization.name} logo`}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover mx-auto sm:mx-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            )}
            
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Dashboard de Propietario - {currentOrganization.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Administra tu organización y supervisa el rendimiento
              </p>
              
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-2">
                {isPlatformAdmin && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Shield className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Administrador de Plataforma</span>
                    <span className="sm:hidden">Admin</span>
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Crown className="w-3 h-3 mr-1" />
                  Propietario
                </span>
                {currentOrganization.plan_type === 'ENTERPRISE' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Enterprise
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats específicos para propietarios */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          icon={Building2}
          title="Organizaciones"
          value={organizations.length}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />

        <StatCard
          icon={Users}
          title="Total Miembros"
          value="45"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />

        <StatCard
          icon={DollarSign}
          title="Ingresos Mes"
          value="$12,450"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />

        <StatCard
          icon={TrendingUp}
          title="Crecimiento"
          value="+15%"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Métricas de rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-lg">85%</h4>
              <p className="text-sm text-gray-600">Satisfacción del cliente</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-lg">92%</h4>
              <p className="text-sm text-gray-600">Entregas a tiempo</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-lg">78%</h4>
              <p className="text-sm text-gray-600">Retención de empleados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones administrativas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Administrativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <UserPlus className="w-6 h-6 text-blue-600 mb-2 mx-auto" />
              <h4 className="font-medium text-sm">Invitar Miembros</h4>
              <p className="text-xs text-gray-600">Agregar nuevos usuarios</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <Settings className="w-6 h-6 text-green-600 mb-2 mx-auto" />
              <h4 className="font-medium text-sm">Configuración</h4>
              <p className="text-xs text-gray-600">Ajustes de organización</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <BarChart3 className="w-6 h-6 text-purple-600 mb-2 mx-auto" />
              <h4 className="font-medium text-sm">Reportes</h4>
              <p className="text-xs text-gray-600">Analíticas detalladas</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de permisos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Permisos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Object.entries(currentOrganization.permissions).map(([module, permissions]) => {
              if (!permissions || typeof permissions !== 'object') return null;
              
              const grantedPermissions = Object.values(permissions).filter(Boolean).length;
              const totalPermissions = Object.keys(permissions).length;
              
              return (
                <div key={module} className="p-3 border rounded-lg text-center">
                  <h4 className="font-medium text-sm capitalize mb-1">
                    {module.replace('_', ' ')}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {grantedPermissions}/{totalPermissions} permisos
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(grantedPermissions / totalPermissions) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
