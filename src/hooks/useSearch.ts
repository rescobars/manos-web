import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';

interface UseSearchOptions<T> {
  searchFunction: (searchTerm: string) => Promise<T[]>;
  initialValue?: T[];
  debounceDelay?: number;
  onError?: (error: Error) => void;
}

export function useSearch<T>({
  searchFunction,
  initialValue = [],
  debounceDelay = 500,
  onError
}: UseSearchOptions<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<T[]>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce el término de búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  // Función de búsqueda
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults(initialValue);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await searchFunction(term);
      setResults(searchResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en la búsqueda';
      setError(errorMessage);
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [searchFunction, initialValue, onError]);

  // Efecto para realizar la búsqueda cuando cambie el término debounced
  useEffect(() => {
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, performSearch]);

  // Función para limpiar la búsqueda
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setResults(initialValue);
    setError(null);
  }, [initialValue]);

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    error,
    clearSearch,
    hasSearchTerm: searchTerm.trim().length > 0
  };
}
