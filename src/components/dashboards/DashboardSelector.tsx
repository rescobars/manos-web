'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DefaultDashboard from './DefaultDashboard';
import DriverDashboard from './DriverDashboard';
import OwnerDashboard from './OwnerDashboard';

export default function DashboardSelector() {
  const { currentOrganization } = useAuth();

  if (!currentOrganization) {
    return (
      <div className="text-center py-12">
        <p className="theme-text-secondary">No se encontró la organización</p>
      </div>
    );
  }

  // Determinar qué dashboard mostrar basado en el rol
  const isPlatformAdmin = currentOrganization.roles.some(role => role.name === 'PLATFORM_ADMIN');
  const isOwner = currentOrganization.is_owner;
  const isAdmin = currentOrganization.is_admin;
  const isDriver = currentOrganization.roles.some(role => role.name === 'DRIVER');

  // Por ahora solo tenemos el dashboard por defecto
  // En el futuro aquí se pueden agregar más dashboards específicos por rol
  if (isDriver) {
    return <DriverDashboard />;
  }

  if (isOwner || isAdmin || isPlatformAdmin) {
    return <OwnerDashboard />;
  }

  // Dashboard por defecto para otros roles
  return <DefaultDashboard />;
}
