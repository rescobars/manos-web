import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { Organization, OrganizationFilters } from '@/types';

interface UseOrganizationSearchOptions {
  searchFunction: (filters: OrganizationFilters) => Promise<any>;
  initialOrganizations?: Organization[];
  debounceDelay?: number;
  onError?: (error: Error) => void;
}

export function useOrganizationSearch({
  searchFunction,
  initialOrganizations = [],
  debounceDelay = 500,
  onError
}: UseOrganizationSearchOptions) {
  const [filters, setFilters] = useState<OrganizationFilters>({});
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce los filtros
  const debouncedFilters = useDebounce(filters, debounceDelay);



  // Efecto para cargar organizaciones cuando cambien los filtros
  useEffect(() => {
    const performSearch = async () => {
      // Filtrar solo los filtros que tienen valores
      const activeFilters = Object.fromEntries(
        Object.entries(debouncedFilters).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      );

      setLoading(true);
      setError(null);

      try {
        // Si no hay filtros activos, hacer una llamada sin filtros para obtener todas las organizaciones
        const filtersToSend = Object.keys(activeFilters).length === 0 ? {} : activeFilters;
        const response = await searchFunction(filtersToSend);
        
        if (response.success && response.data) {
          setOrganizations(response.data);
        } else {
          setOrganizations(initialOrganizations);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar organizaciones';
        setError(errorMessage);
        if (onError && err instanceof Error) {
          onError(err);
        }
        setOrganizations(initialOrganizations);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedFilters]);

  // Función para actualizar filtros
  const updateFilters = useCallback((newFilters: OrganizationFilters) => {
    setFilters(newFilters);
  }, []);

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Función para actualizar un filtro específico
  const updateFilter = useCallback((key: keyof OrganizationFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  // Verificar si hay filtros activos
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return {
    filters,
    organizations,
    loading,
    error,
    updateFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    // Función para recargar organizaciones manualmente
    reload: async () => {
      // Filtrar solo los filtros que tienen valores
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      );

      setLoading(true);
      setError(null);

      try {
        // Si no hay filtros activos, hacer una llamada sin filtros para obtener todas las organizaciones
        const filtersToSend = Object.keys(activeFilters).length === 0 ? {} : activeFilters;
        const response = await searchFunction(filtersToSend);
        
        if (response.success && response.data) {
          setOrganizations(response.data);
        } else {
          setOrganizations(initialOrganizations);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar organizaciones';
        setError(errorMessage);
        if (onError && err instanceof Error) {
          onError(err);
        }
        setOrganizations(initialOrganizations);
      } finally {
        setLoading(false);
      }
    }
  };
}
