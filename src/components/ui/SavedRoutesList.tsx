'use client';

import React, { useState } from 'react';
import { SavedRoute } from '@/types';
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
  AlertCircle,
  Package,
  Truck,
  DollarSign,
  UserPlus,
  Pause,
  PlayCircle
} from 'lucide-react';
import SavedRouteMap from './SavedRouteMap';

interface SavedRoutesListProps {
  savedRoutes: SavedRoute[];
  isLoading: boolean;
  error: string | null;
  onViewRoute: (route: SavedRoute) => void;
  onStartRoute: (route: SavedRoute) => void;
  onAssignRoute?: (route: SavedRoute) => void;
  viewMode?: 'grid' | 'table';
}

const SavedRoutesList: React.FC<SavedRoutesListProps> = ({
  savedRoutes,
  isLoading,
  error,
  onViewRoute,
  onStartRoute,
  onAssignRoute,
  viewMode
}) => {
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<SavedRoute | null>(null);
  
  // Usar el viewMode que viene del padre, con table por defecto
  const actualViewMode = viewMode || 'table';
  
  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-3 h-3 text-amber-500" />;
      case 'ASSIGNED':
        return <Package className="w-3 h-3 text-purple-500" />;
      case 'IN_ROUTE':
        return <Truck className="w-3 h-3 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <AlertCircle className="w-3 h-3 theme-text-muted" />;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ASSIGNED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'IN_ROUTE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'theme-bg-1 theme-text-primary theme-border';
    }
  };

  const getRouteStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return <Clock className="w-3 h-3 text-blue-500" />;
      case 'ASSIGNED':
        return <UserPlus className="w-3 h-3 text-purple-500" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-3 h-3 text-green-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'PAUSED':
        return <Pause className="w-3 h-3 text-orange-500" />;
      default:
        return <AlertCircle className="w-3 h-3 theme-text-muted" />;
    }
  };

  const getRouteStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ASSIGNED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PAUSED':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'theme-bg-1 theme-text-primary theme-border';
    }
  };

  const getRouteStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'Planificada';
      case 'ASSIGNED':
        return 'Asignada';
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'PAUSED':
        return 'Pausada';
      default:
        return 'Desconocida';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'theme-bg-1 theme-text-primary theme-border';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'theme-bg-1 theme-text-primary theme-border';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'Baja';
      case 'MEDIUM':
        return 'Media';
      case 'HIGH':
        return 'Alta';
      case 'URGENT':
        return 'Urgente';
      default:
        return 'Media';
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

  const handleViewRoute = (route: SavedRoute) => {
    setSelectedRouteForMap(route);
    onViewRoute(route);
  };

  const handleCloseMap = () => {
    setSelectedRouteForMap(null);
  };

  const handleAssignRoute = (route: SavedRoute) => {
    if (onAssignRoute) {
      onAssignRoute(route);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="theme-text-secondary">Cargando rutas guardadas...</p>
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
      <div className="theme-bg-2 border theme-border rounded-lg p-8 text-center">
        <Route className="w-16 h-16 theme-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold theme-text-primary mb-2">No hay rutas guardadas</h3>
        <p className="theme-text-secondary">
          Las rutas que guardes aparecerán aquí. Crea y optimiza una ruta para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {actualViewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedRoutes.map((route) => (
          <div
            key={route.id}
            className="theme-bg-3 border theme-border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
          >
            {/* Header con título y estado */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold theme-text-primary truncate mb-1">{route.route_name}</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRouteStatusColor(route.status)}`}>
                    {getRouteStatusIcon(route.status)}
                    {getRouteStatusText(route.status)}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(route.priority)}`}>
                    {getPriorityText(route.priority)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => handleViewRoute(route)}
                  className="p-1.5 theme-text-muted hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                {route.status === 'PLANNED' && onAssignRoute && (
                  <button
                    onClick={() => handleAssignRoute(route)}
                    className="p-1.5 theme-text-muted hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                    title="Asignar ruta"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Información básica compacta */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-xs theme-text-secondary">
                <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span className="truncate">{route.origin_name}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs theme-text-secondary">
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3 text-green-500" />
                  <span>{route.orders.length} pedidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span>{Math.round(route.traffic_delay / 60)}min</span>
                </div>
              </div>
            </div>

            {/* Acciones compactas */}
            <div className="flex items-center justify-between pt-2 border-t theme-divider">
              <span className="text-xs theme-text-muted">ID: {route.uuid.slice(0, 8)}</span>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleViewRoute(route)}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                >
                  Ver
                </button>
                
                {route.status === 'PLANNED' && onAssignRoute && (
                  <button
                    onClick={() => handleAssignRoute(route)}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
                  >
                    Asignar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="theme-bg-2">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                  Ruta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                  Distancia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                  Duración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                  Pedidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                  Creada
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium theme-text-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="theme-bg-3 divide-y divide-gray-200">
              {savedRoutes.map((route) => (
                <tr key={route.id} className="hover:theme-bg-2">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium theme-text-primary">{route.route_name}</div>
                      <div className="text-sm theme-text-muted truncate max-w-xs">{route.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRouteStatusColor(route.status)}`}>
                      {getRouteStatusIcon(route.status)}
                      {getRouteStatusText(route.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(route.priority)}`}>
                      {getPriorityText(route.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-primary">
                    N/A km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-primary">
                    {Math.round(route.traffic_delay / 60)} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-primary">
                    {route.orders?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-muted">
                    {formatDate(route.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedRouteForMap(route)}
                        className="p-2 theme-text-muted hover:theme-text-secondary hover:theme-bg-1 rounded-lg transition-colors"
                        title="Ver en mapa"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewRoute(route)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Ver
                      </button>
                      {route.status === 'PLANNED' && onAssignRoute && (
                        <button
                          onClick={() => handleAssignRoute(route)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Asignar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal del mapa */}
      {selectedRouteForMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="theme-bg-3 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b theme-border flex items-center justify-between">
              <h3 className="text-lg font-semibold theme-text-primary">Visualización de Ruta</h3>
              <button
                onClick={handleCloseMap}
                className="p-2 theme-text-muted hover:theme-text-secondary hover:theme-bg-1 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <SavedRouteMap 
                route={selectedRouteForMap} 
                onClose={handleCloseMap}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedRoutesList;

