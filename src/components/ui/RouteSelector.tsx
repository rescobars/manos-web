'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, MapPin, Users, Clock, Check } from 'lucide-react';
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
          w-full min-w-[280px] px-4 py-3 bg-white/95 backdrop-blur-sm border border-gray-200 
          rounded-xl shadow-lg hover:shadow-xl transition-all duration-200
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-gray-300'}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-300 bg-red-50/95' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">
                {selectedRouteIds.length === 0 
                  ? 'Seleccionar rutas en progreso' 
                  : `${selectedRouteIds.length} ruta${selectedRouteIds.length !== 1 ? 's' : ''} seleccionada${selectedRouteIds.length !== 1 ? 's' : ''}`
                }
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {selectedRouteIds.length > 0 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
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
                <X className="w-3 h-3 text-gray-500" />
              </div>
            )}
            <ChevronDown 
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </div>

        {/* Selected routes preview */}
        {selectedRoutes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {selectedRoutes.slice(0, 2).map(route => (
                <span
                  key={route.uuid}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {route.route_name}
                </span>
              ))}
              {selectedRoutes.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{selectedRoutes.length - 2} más
                </span>
              )}
            </div>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl z-[1000] max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="Buscar rutas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Actions */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>
                  {selectedRouteIds.length === filteredRoutes.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </span>
              </button>
              {selectedRouteIds.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Routes List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Cargando rutas...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <div className="w-8 h-8 text-red-500 mx-auto mb-2">⚠️</div>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className="p-4 text-center">
                <div className="w-8 h-8 text-gray-400 mx-auto mb-2">🗺️</div>
                <p className="text-sm text-gray-600">
                  {searchTerm ? 'No se encontraron rutas' : 'No hay rutas en progreso'}
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
                      flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors
                      ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                    `}
                  >
                    <div className="flex-shrink-0">
                      <div className={`
                        w-4 h-4 rounded border-2 flex items-center justify-center
                        ${isSelected 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300 hover:border-blue-400'
                        }
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {route.route_name}
                        </h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          En Progreso
                        </span>
                      </div>
                      
                      {route.description && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {route.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{orderCount} pedidos</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(route.updated_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
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
