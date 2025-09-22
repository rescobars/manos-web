'use client';

import React from 'react';
import { SavedRoute } from '@/types';
import { Route, Clock, Users, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { StatCard } from '@/components/ui/StatCard';

interface RouteStatsCardsProps {
  allRoutes: SavedRoute[];
  filterStatus: string;
  onFilterChange: (status: string) => void;
}

export function RouteStatsCards({ allRoutes, filterStatus, onFilterChange }: RouteStatsCardsProps) {
  const { colors } = useDynamicTheme();

  // Calcular contadores
  const totalRoutes = allRoutes.length;
  const plannedRoutes = allRoutes.filter(route => route.status === 'PLANNED').length;
  const assignedRoutes = allRoutes.filter(route => route.status === 'ASSIGNED').length;
  const inProgressRoutes = allRoutes.filter(route => route.status === 'IN_PROGRESS').length;
  const completedRoutes = allRoutes.filter(route => route.status === 'COMPLETED').length;
  const pausedRoutes = allRoutes.filter(route => route.status === 'PAUSED').length;
  const cancelledRoutes = allRoutes.filter(route => route.status === 'CANCELLED').length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          onClick={() => onFilterChange('all')}
          className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
            filterStatus === 'all' ? 'ring-2' : ''
          }`}
          style={{
            '--tw-ring-color': filterStatus === 'all' ? colors.buttonPrimary1 : 'transparent'
          } as React.CSSProperties}
        >
          <StatCard
            title="Total Rutas"
            value={totalRoutes}
            icon={Route}
            iconColor={colors.textPrimary}
            iconBgColor={colors.background2}
          />
        </div>
        
        <div 
          onClick={() => onFilterChange('PLANNED')}
          className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
            filterStatus === 'PLANNED' ? 'ring-2' : ''
          }`}
          style={{
            '--tw-ring-color': filterStatus === 'PLANNED' ? colors.warning : 'transparent'
          } as React.CSSProperties}
        >
          <StatCard
            title="Planificadas"
            value={plannedRoutes}
            icon={Clock}
            iconColor={colors.warning}
            iconBgColor={colors.warning + '20'}
          />
        </div>
        
        <div 
          onClick={() => onFilterChange('ASSIGNED')}
          className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
            filterStatus === 'ASSIGNED' ? 'ring-2' : ''
          }`}
          style={{
            '--tw-ring-color': filterStatus === 'ASSIGNED' ? colors.warning : 'transparent'
          } as React.CSSProperties}
        >
          <StatCard
            title="Asignadas"
            value={assignedRoutes}
            icon={Users}
            iconColor={colors.warning}
            iconBgColor={colors.warning + '20'}
          />
        </div>
        
        <div 
          onClick={() => onFilterChange('IN_PROGRESS')}
          className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
            filterStatus === 'IN_PROGRESS' ? 'ring-2' : ''
          }`}
          style={{
            '--tw-ring-color': filterStatus === 'IN_PROGRESS' ? colors.info : 'transparent'
          } as React.CSSProperties}
        >
          <StatCard
            title="En Progreso"
            value={inProgressRoutes}
            icon={Route}
            iconColor={colors.info}
            iconBgColor={colors.info + '20'}
          />
        </div>
        
        <div 
          onClick={() => onFilterChange('COMPLETED')}
          className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
            filterStatus === 'COMPLETED' ? 'ring-2' : ''
          }`}
          style={{
            '--tw-ring-color': filterStatus === 'COMPLETED' ? colors.success : 'transparent'
          } as React.CSSProperties}
        >
          <StatCard
            title="Completadas"
            value={completedRoutes}
            icon={CheckCircle}
            iconColor={colors.success}
            iconBgColor={colors.success + '20'}
          />
        </div>
        
        <div 
          onClick={() => onFilterChange('PAUSED')}
          className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
            filterStatus === 'PAUSED' ? 'ring-2' : ''
          }`}
          style={{
            '--tw-ring-color': filterStatus === 'PAUSED' ? colors.buttonPrimary2 : 'transparent'
          } as React.CSSProperties}
        >
          <StatCard
            title="Pausadas"
            value={pausedRoutes}
            icon={AlertCircle}
            iconColor={colors.buttonPrimary2}
            iconBgColor={colors.buttonPrimary2 + '20'}
          />
        </div>
        
        <div 
          onClick={() => onFilterChange('CANCELLED')}
          className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
            filterStatus === 'CANCELLED' ? 'ring-2' : ''
          }`}
          style={{
            '--tw-ring-color': filterStatus === 'CANCELLED' ? colors.error : 'transparent'
          } as React.CSSProperties}
        >
          <StatCard
            title="Canceladas"
            value={cancelledRoutes}
            icon={XCircle}
            iconColor={colors.error}
            iconBgColor={colors.error + '20'}
          />
        </div>
      </div>
    </div>
  );
}
