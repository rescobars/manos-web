import React from 'react';
import { Crown, Shield, Truck, Eye } from 'lucide-react';

interface RoleBadgeProps {
  role: 'PLATFORM_ADMIN' | 'OWNER' | 'DRIVER' | 'VIEWER';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const roleConfig = {
  PLATFORM_ADMIN: {
    label: 'Administrador de Plataforma',
    description: 'Acceso completo a toda la plataforma',
    icon: Shield,
    colors: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200'
    }
  },
  OWNER: {
    label: 'Propietario',
    description: 'Acceso completo en su organización',
    icon: Crown,
    colors: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200'
    }
  },
  DRIVER: {
    label: 'Conductor',
    description: 'Acceso limitado a pedidos asignados',
    icon: Truck,
    colors: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200'
    }
  },
  VIEWER: {
    label: 'Visualizador',
    description: 'Solo puede ver información',
    icon: Eye,
    colors: {
      bg: 'theme-bg-1',
      text: 'theme-text-primary',
      border: 'theme-border'
    }
  }
};

export function RoleBadge({ role, size = 'md', showIcon = true }: RoleBadgeProps) {
  const config = roleConfig[role];
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.colors.bg} ${config.colors.text} ${config.colors.border}
        ${sizeClasses[size]}
      `}
      title={config.description}
    >
      {showIcon && <IconComponent className={`${iconSizes[size]} mr-1.5`} />}
      {config.label}
    </span>
  );
}

// Componente para mostrar múltiples roles
interface RoleBadgesProps {
  roles: Array<'PLATFORM_ADMIN' | 'OWNER' | 'DRIVER' | 'VIEWER'>;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function RoleBadges({ roles, size = 'md', showIcon = true }: RoleBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role, index) => (
        <RoleBadge 
          key={`${role}-${index}`} 
          role={role} 
          size={size} 
          showIcon={showIcon} 
        />
      ))}
    </div>
  );
}
