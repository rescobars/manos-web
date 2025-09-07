'use client';

import React from 'react';
import { SavedRoute } from '@/hooks/useSavedRoutes';
import { 
  MapPin, 
  Clock, 
  Route, 
  Calendar, 
  Users, 
  Eye, 
  Play,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface SavedRoutesListProps {
  savedRoutes: SavedRoute[];
  isLoading: boolean;
  error: string | null;
  onViewRoute: (route: SavedRoute) => void;
  onStartRoute: (route: SavedRoute) => void;
}

const SavedRoutesList: React.FC<SavedRoutesListProps> = ({
  savedRoutes,
  isLoading,
  error,
  onViewRoute,
  onStartRoute
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando rutas guardadas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar rutas</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (savedRoutes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Route className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay rutas guardadas</h3>
        <p className="text-gray-600">
          Las rutas que guardes aparecerán aquí. Crea y optimiza una ruta para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rutas Guardadas</h3>
          <p className="text-sm text-gray-600">
            {savedRoutes.length} ruta{savedRoutes.length !== 1 ? 's' : ''} encontrada{savedRoutes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {savedRoutes.map((route) => (
          <div
            key={route.id}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">{route.route_name}</h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(route.status)}`}>
                    {getStatusIcon(route.status)}
                    {getStatusText(route.status)}
                  </span>
                </div>
                
                {route.description && (
                  <p className="text-gray-600 text-sm mb-3">{route.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewRoute(route)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Ver detalles de la ruta"
                >
                  <Eye className="w-5 h-5" />
                </button>
                
                {route.status === 'active' && (
                  <button
                    onClick={() => onStartRoute(route)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Iniciar ruta"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                )}
                
                <button
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Más opciones"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Origen:</span>
                <span className="truncate">{route.origin.name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Route className="w-4 h-4 text-green-500" />
                <span className="font-medium">Paradas:</span>
                <span>{route.waypoints.length}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Retraso tráfico:</span>
                <span>{Math.round(route.traffic_delay / 60)} min</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Creada:</span>
                <span>{formatDate(route.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>ID: {route.id.slice(0, 8)}...</span>
                <span>•</span>
                <span>Actualizada: {formatDate(route.updated_at)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewRoute(route)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Ver Ruta
                </button>
                
                {route.status === 'active' && (
                  <button
                    onClick={() => onStartRoute(route)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Iniciar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedRoutesList;

