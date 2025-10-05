'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, MapPin, Package, Clock, Check } from 'lucide-react';
import { SavedRoute } from '@/types';

interface RouteSelectorProps {
  routes: SavedRoute[];
  selectedRouteIds: string[];
  onSelectionChange: (routeIds: string[]) => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function RouteSelector({
  routes,
  selectedRouteIds,
  onSelectionChange,
  loading = false,
  error = null,
  className = ''
}: RouteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter routes based on search term
  const filteredRoutes = routes.filter(route =>
    route.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRouteToggle = (routeId: string) => {
    const newSelection = selectedRouteIds.includes(routeId)
      ? selectedRouteIds.filter(id => id !== routeId)
      : [...selectedRouteIds, routeId];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedRouteIds.length === filteredRoutes.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredRoutes.map(route => route.uuid));
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const selectedRoutes = routes.filter(route => selectedRouteIds.includes(route.uuid));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`
          w-full px-3 py-2 backdrop-blur-sm border theme-border
          rounded-lg shadow-sm hover:shadow-md transition-all duration-200
          theme-bg-3 theme-text-primary
          ${isOpen ? 'ring-2 ring-blue-500' : ''}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-300' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 theme-info" />
            <span className="text-xs font-medium truncate theme-text-primary">
              {selectedRouteIds.length === 0 
                ? 'Seleccionar rutas' 
                : `${selectedRouteIds.length} ruta${selectedRouteIds.length !== 1 ? 's' : ''}`
              }
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {selectedRouteIds.length > 0 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="p-1 hover:theme-bg-1 rounded-full transition-colors cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClearAll();
                  }
                }}
              >
                <X className="w-3 h-3 theme-text-muted" />
              </div>
            )}
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-200 theme-text-muted ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Selected routes preview */}
        {selectedRoutes.length > 0 && (
          <div className="mt-1 pt-1 border-t theme-divider">
            <div className="flex flex-wrap gap-1">
              {selectedRoutes.slice(0, 1).map(route => (
                <span
                  key={route.uuid}
                  className="inline-flex items-center px-1.5 py-0.5 text-xs rounded truncate max-w-[120px] theme-bg-2 theme-text-primary"
                >
                  {route.route_name}
                </span>
              ))}
              {selectedRoutes.length > 1 && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-xs rounded theme-bg-2 theme-text-secondary">
                  +{selectedRoutes.length - 1}
                </span>
              )}
            </div>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 backdrop-blur-sm border theme-border rounded-lg shadow-lg z-[1000] max-h-64 overflow-hidden theme-bg-3">
          {/* Search Input */}
          <div className="p-2 border-b theme-border">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border theme-border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none theme-bg-3 theme-text-primary"
            />
          </div>

          {/* Actions */}
          <div className="p-2 border-b theme-divider">
            <div className="flex items-center justify-between">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Check className="w-3 h-3" />
                <span>
                  {selectedRouteIds.length === filteredRoutes.length ? 'Deseleccionar' : 'Seleccionar todo'}
                </span>
              </button>
              {selectedRouteIds.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Routes List */}
          <div className="max-h-40 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-1"></div>
                <p className="text-xs theme-text-secondary">Cargando...</p>
              </div>
            ) : error ? (
              <div className="p-3 text-center">
                <div className="w-6 h-6 text-red-500 mx-auto mb-1">⚠️</div>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className="p-3 text-center">
                <div className="w-6 h-6 theme-text-muted mx-auto mb-1">🗺️</div>
                <p className="text-xs theme-text-secondary">
                  {searchTerm ? 'No encontradas' : 'Sin rutas'}
                </p>
              </div>
            ) : (
              filteredRoutes.map(route => {
                const isSelected = selectedRouteIds.includes(route.uuid);
                const orderCount = route.orders?.length || 0;
                
                return (
                  <div
                    key={route.uuid}
                    onClick={() => handleRouteToggle(route.uuid)}
                    className={`
                      flex items-center space-x-2 p-2 hover:theme-bg-2 cursor-pointer transition-colors
                      ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''}
                    `}
                  >
                    <div className="flex-shrink-0">
                      <div className={`
                        w-3 h-3 rounded border-2 flex items-center justify-center
                        ${isSelected 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'theme-border hover:border-blue-400'
                        }
                      `}>
                        {isSelected && <Check className="w-2 h-2 text-white" />}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium theme-text-primary truncate">
                        {route.route_name}
                      </h4>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1 text-xs theme-text-muted">
                          <Package className="w-2.5 h-2.5" />
                          <span>{orderCount} pedidos</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs theme-text-muted">
                          <Clock className="w-2.5 h-2.5" />
                          <span>
                            {new Date(route.updated_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
