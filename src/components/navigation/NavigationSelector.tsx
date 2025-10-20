'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  Users, 
  Truck, 
  Package, 
  BarChart3, 
  Settings, 
  Globe,
  Shield,
  Crown,
  Route
} from 'lucide-react';

export interface NavigationItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles: string[];
  showForOwner?: boolean;
  showForAdmin?: boolean;
  showForDriver?: boolean;
}

export function getNavigationItems(slug: string, userRole: string, isOwner: boolean, isAdmin: boolean): NavigationItem[] {
  const baseItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      icon: BarChart3,
      href: `/${slug}/dashboard`,
      roles: ['all'],
      showForOwner: true,
      showForAdmin: true,
      showForDriver: true
    }
  ];

  // Elementos específicos para Platform Admin
  if (userRole === 'PLATFORM_ADMIN') {
    baseItems.push(
      {
        label: 'Organizaciones',
        icon: Building2,
        href: `/${slug}/organizations`,
        roles: ['PLATFORM_ADMIN'],
        showForOwner: false,
        showForAdmin: false,
        showForDriver: false
      },
      {
        label: 'Plataforma',
        icon: Globe,
        href: `/${slug}/platform`,
        roles: ['PLATFORM_ADMIN'],
        showForOwner: false,
        showForAdmin: false,
        showForDriver: false
      }
    );
  }

  // Elementos para Owner y Admin (pero no para Platform Admin)
  if (isOwner || isAdmin) {
    baseItems.push(
      {
        label: 'Miembros',
        icon: Users,
        href: `/${slug}/members`,
        roles: ['OWNER', 'ADMIN'],
        showForOwner: true,
        showForAdmin: true,
        showForDriver: false
      },
      {
        label: 'Conductores',
        icon: Truck,
        href: `/${slug}/drivers`,
        roles: ['OWNER', 'ADMIN'],
        showForOwner: true,
        showForAdmin: true,
        showForDriver: false
      },
      {
        label: 'Pedidos',
        icon: Package,
        href: `/${slug}/orders`,
        roles: ['OWNER', 'ADMIN'],
        showForOwner: true,
        showForAdmin: true,
        showForDriver: false
      },
      {
        label: 'Rutas',
        icon: Route,
        href: `/${slug}/route-optimization`,
        roles: ['OWNER', 'ADMIN'],
        showForOwner: true,
        showForAdmin: true,
        showForDriver: false
      },
      {
        label: 'Configuración',
        icon: Settings,
        href: `/${slug}/settings`,
        roles: ['OWNER', 'ADMIN'],
        showForOwner: true,
        showForAdmin: true,
        showForDriver: false
      }
    );
  }

  // Elementos específicos para Owner
  if (isOwner) {
    baseItems.push(
      {
        label: 'Finanzas',
        icon: BarChart3,
        href: `/${slug}/finances`,
        roles: ['OWNER'],
        showForOwner: true,
        showForAdmin: false,
        showForDriver: false
      }
    );
  }

  // Elementos específicos para Driver
  if (userRole === 'DRIVER') {
    baseItems.push(
      {
        label: 'Mis Entregas',
        icon: Package,
        href: `/${slug}/my-deliveries`,
        roles: ['DRIVER'],
        showForOwner: false,
        showForAdmin: false,
        showForDriver: true
      }
    );
  }

  return baseItems;
}

export default function NavigationSelector({ slug }: { slug: string }) {
  const { currentOrganization } = useAuth();

  if (!currentOrganization) {
    return [];
  }

  const isPlatformAdmin = currentOrganization.roles.some(role => role.name === 'PLATFORM_ADMIN');
  const isOwner = currentOrganization.is_owner;
  const isAdmin = currentOrganization.is_admin;
  const isDriver = currentOrganization.roles.some(role => role.name === 'DRIVER');

  let userRole = 'USER';
  if (isPlatformAdmin) userRole = 'PLATFORM_ADMIN';
  else if (isOwner) userRole = 'OWNER';
  else if (isAdmin) userRole = 'ADMIN';
  else if (isDriver) userRole = 'DRIVER';

  return getNavigationItems(slug, userRole, isOwner, isAdmin);
}
