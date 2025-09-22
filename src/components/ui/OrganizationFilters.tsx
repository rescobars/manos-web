'use client';

import React from 'react';
import { OrganizationFilters } from '@/types';
import { Button } from './Button';
import { Input } from './Input';
import { Filter, X, Search } from 'lucide-react';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

interface OrganizationFiltersProps {
  filters: OrganizationFilters;
  onFiltersChange: (filters: OrganizationFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export function OrganizationFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false
}: OrganizationFiltersProps) {
  const { colors } = useDynamicTheme();
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  const handleFilterChange = (key: keyof OrganizationFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  return (
    <div 
      className="theme-bg-3 border theme-border rounded-lg p-4 mb-6"
      style={{
        backgroundColor: colors.background3,
        borderColor: colors.border,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter 
            className="w-4 h-4" 
            style={{ color: colors.textSecondary }}
          />
          <h3 className="text-sm font-medium theme-text-primary">Filtros</h3>
          {loading && (
            <div className="flex items-center" style={{ color: colors.buttonPrimary1 }}>
              <div 
                className="animate-spin rounded-full h-4 w-4 border-b-2"
                style={{ borderColor: colors.buttonPrimary1 }}
              ></div>
              <span className="ml-2 text-xs">Buscando...</span>
            </div>
          )}
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="theme-text-muted hover:theme-text-primary"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Campo de búsqueda */}
      <div className="mb-4">
        <Input
          label="Buscar organizaciones"
          placeholder="Buscar por nombre, descripción, dominio..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
          helperText="Busca en nombre, descripción, dominio y otros campos"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtro por estado */}
        <div>
          <label className="block text-sm font-medium theme-text-primary mb-2">
            Estado
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="w-full px-3 py-2 border theme-border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              backgroundColor: colors.background3,
              borderColor: colors.border,
              color: colors.textPrimary,
            }}
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
            <option value="SUSPENDED">Suspendido</option>
          </select>
        </div>

        {/* Filtro por tipo de plan */}
        <div>
          <label className="block text-sm font-medium theme-text-primary mb-2">
            Tipo de Plan
          </label>
          <select
            value={filters.plan_type || ''}
            onChange={(e) => handleFilterChange('plan_type', e.target.value || undefined)}
            className="w-full px-3 py-2 border theme-border rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              backgroundColor: colors.background3,
              borderColor: colors.border,
              color: colors.textPrimary,
            }}
          >
            <option value="">Todos los planes</option>
            <option value="FREE">FREE</option>
            <option value="BASIC">BASIC</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
        </div>
      </div>

      {/* Mostrar filtros activos */}
      {hasActiveFilters && (
        <div 
          className="mt-4 pt-4 border-t theme-divider"
          style={{ borderColor: colors.divider }}
        >
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: colors.background2,
                  color: colors.textPrimary,
                }}
              >
                <Search className="w-3 h-3 mr-1" />
                Búsqueda: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', undefined)}
                  className="ml-1 hover:opacity-80"
                  style={{ color: colors.textSecondary }}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.status && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: colors.background2,
                  color: colors.textPrimary,
                }}
              >
                Estado: {filters.status}
                <button
                  onClick={() => handleFilterChange('status', undefined)}
                  className="ml-1 hover:opacity-80"
                  style={{ color: colors.textSecondary }}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.plan_type && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: colors.background2,
                  color: colors.textPrimary,
                }}
              >
                Plan: {filters.plan_type}
                <button
                  onClick={() => handleFilterChange('plan_type', undefined)}
                  className="ml-1 hover:opacity-80"
                  style={{ color: colors.textSecondary }}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
