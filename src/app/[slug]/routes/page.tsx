'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedRoutes } from '@/hooks/useSavedRoutes';
import { useToast } from '@/hooks/useToast';
import { SavedRoute } from '@/types';
import { Page } from '@/components/ui/Page';
import SavedRoutesList from '@/components/ui/SavedRoutesList';
import { Route, Grid, List, Search, Filter, Plus } from 'lucide-react';
import { ToastContainer } from '@/components/ui/ToastContainer';

type ViewMode = 'grid' | 'table';

export default function RoutesPage() {
  const { currentOrganization } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Hook para notificaciones toast
  const { toasts, success, error: showErrorToast, removeToast } = useToast();

  // Hook para rutas guardadas
  const {
    savedRoutes,
    isLoading: isLoadingSavedRoutes,
    error: savedRoutesError,
    fetchSavedRoutes,
    reset: resetSavedRoutes
  } = useSavedRoutes();

  // Cargar rutas guardadas
  useEffect(() => {
    if (currentOrganization) {
      fetchSavedRoutes(currentOrganization.uuid);
    }
  }, [currentOrganization, fetchSavedRoutes]);

  // Funciones para manejar rutas guardadas
  const handleViewSavedRoute = (route: SavedRoute) => {
    console.log('Ver ruta guardada:', route);
    success(
      'Ruta cargada',
      `Se ha cargado la ruta "${route.route_name}" para visualización.`,
      3000
    );
  };

  const handleStartSavedRoute = (route: SavedRoute) => {
    console.log('Iniciar ruta guardada:', route);
    success(
      'Ruta iniciada',
      `Se ha iniciado la ruta "${route.route_name}".`,
      3000
    );
  };

  // Filtrar rutas basado en búsqueda y estado
  const filteredRoutes = savedRoutes.filter(route => {
    const matchesSearch = route.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    // Aquí puedes agregar más filtros según el estado de la ruta
    return matchesSearch;
  });

  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Route className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Selecciona una organización</h1>
          <p className="text-gray-600">Necesitas seleccionar una organización para ver las rutas</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Page
        title="Gestión de Rutas"
        subtitle={`Administra y visualiza las rutas de ${currentOrganization.name}`}
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Header con controles */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Búsqueda y filtros */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar rutas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todas las rutas</option>
                    <option value="active">Activas</option>
                    <option value="completed">Completadas</option>
                    <option value="pending">Pendientes</option>
                  </select>
                </div>
              </div>

              {/* Controles de vista y acciones */}
              <div className="flex items-center gap-3">
                {/* Toggle de vista */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title="Vista de cuadrícula"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title="Vista de tabla"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Botón crear nueva ruta */}
                <button
                  onClick={() => {
                    // TODO: Implementar navegación a optimización de rutas
                    success(
                      'Crear nueva ruta',
                      'Redirigiendo a la página de optimización de rutas...',
                      2000
                    );
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Ruta
                </button>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Route className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total de Rutas</p>
                  <p className="text-2xl font-bold text-blue-800">{savedRoutes.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Rutas Activas</p>
                  <p className="text-2xl font-bold text-green-800">
                    {savedRoutes.filter(route => route.status === 'active' || !route.status).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Completadas</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {savedRoutes.filter(route => route.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de rutas */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <SavedRoutesList
              savedRoutes={filteredRoutes}
              isLoading={isLoadingSavedRoutes}
              error={savedRoutesError}
              onViewRoute={handleViewSavedRoute}
              onStartRoute={handleStartSavedRoute}
              viewMode={viewMode}
            />
          </div>
        </div>
      </Page>
      
      {/* Toast Container para notificaciones */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
