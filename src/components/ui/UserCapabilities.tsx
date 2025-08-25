import React from 'react';
import { Permissions } from '@/types';
import { Check, X, Shield, Building2, Users, Settings, BarChart3, FileText, Bell, Lock } from 'lucide-react';

interface UserCapabilitiesProps {
  permissions: Permissions;
  className?: string;
}

const capabilityConfig = {
  // Capacidades de plataforma
  platform_admin: {
    label: 'Administrador de Plataforma',
    description: 'Acceso completo a toda la plataforma',
    icon: Shield,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    required: ['organizations', 'users', 'system']
  },
  
  // Capacidades de organización
  organization_owner: {
    label: 'Propietario de Organización',
    description: 'Control total de la organización',
    icon: Building2,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    required: ['orders', 'drivers', 'customers', 'reports', 'settings', 'billing', 'analytics']
  },
  
  order_manager: {
    label: 'Gestor de Pedidos',
    description: 'Puede gestionar pedidos completos',
    icon: BarChart3,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    required: ['orders']
  },
  
  driver_manager: {
    label: 'Gestor de Conductores',
    description: 'Puede gestionar conductores',
    icon: Users,
    color: 'text-green-600 bg-green-50 border-green-200',
    required: ['drivers']
  },
  
  customer_manager: {
    label: 'Gestor de Clientes',
    description: 'Puede gestionar clientes',
    icon: Users,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    required: ['customers']
  },
  
  reports_viewer: {
    label: 'Visualizador de Reportes',
    description: 'Puede ver reportes y analíticas',
    icon: FileText,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    required: ['reports', 'analytics']
  },
  
  settings_manager: {
    label: 'Gestor de Configuración',
    description: 'Puede modificar configuraciones',
    icon: Settings,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    required: ['settings']
  },
  
  billing_manager: {
    label: 'Gestor de Facturación',
    description: 'Puede gestionar facturación',
    icon: BarChart3,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    required: ['billing']
  },
  
  security_admin: {
    label: 'Administrador de Seguridad',
    description: 'Puede gestionar seguridad y logs',
    icon: Lock,
    color: 'text-red-600 bg-red-50 border-red-200',
    required: ['security', 'logs']
  },
  
  notification_manager: {
    label: 'Gestor de Notificaciones',
    description: 'Puede gestionar notificaciones',
    icon: Bell,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    required: ['notifications']
  }
};

export function UserCapabilities({ permissions, className = '' }: UserCapabilitiesProps) {
  const checkCapability = (requiredModules: string[]) => {
    return requiredModules.every(module => {
      const modulePermissions = permissions[module as keyof Permissions];
      if (!modulePermissions || typeof modulePermissions !== 'object') return false;
      
      // Verificar que tenga al menos permisos de lectura
      return modulePermissions.read === true || 
             (modulePermissions as any).create === true || 
             (modulePermissions as any).update === true;
    });
  };

  const capabilities = Object.entries(capabilityConfig).map(([key, config]) => {
    const hasCapability = checkCapability(config.required);
    const IconComponent = config.icon;
    
    return {
      key,
      ...config,
      hasCapability,
      IconComponent
    };
  });

  const activeCapabilities = capabilities.filter(cap => cap.hasCapability);
  const inactiveCapabilities = capabilities.filter(cap => !cap.hasCapability);

  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900">Capacidades del Usuario</h4>
      
      {/* Capacidades Activas */}
      {activeCapabilities.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">Capacidades Activas</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeCapabilities.map((capability) => (
              <div 
                key={capability.key}
                className={`flex items-center p-3 rounded-lg border ${capability.color}`}
              >
                <capability.IconComponent className="w-4 h-4 mr-3" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{capability.label}</div>
                  <div className="text-xs opacity-75">{capability.description}</div>
                </div>
                <Check className="w-4 h-4 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Capacidades Inactivas (solo mostrar si hay pocas activas) */}
      {inactiveCapabilities.length > 0 && activeCapabilities.length < 3 && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">Otras Capacidades</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {inactiveCapabilities.slice(0, 4).map((capability) => (
              <div 
                key={capability.key}
                className="flex items-center p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-400"
              >
                <capability.IconComponent className="w-4 h-4 mr-3" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{capability.label}</div>
                  <div className="text-xs opacity-75">{capability.description}</div>
                </div>
                <X className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Capacidades Activas</span>
          <span className="text-gray-900 font-bold">{activeCapabilities.length}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {activeCapabilities.length > 0 
            ? `Puede realizar ${activeCapabilities.length} tipos de operaciones`
            : 'Sin capacidades específicas activas'
          }
        </div>
      </div>
    </div>
  );
}
