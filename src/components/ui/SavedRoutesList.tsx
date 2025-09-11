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
  DollarSign
} from 'lucide-react';
import SavedRouteMap from './SavedRouteMap';

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
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<SavedRoute | null>(null);
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
        return <AlertCircle className="w-3 h-3 text-gray-500" />;
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
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'ASSIGNED':
        return 'Asignado';
      case 'IN_ROUTE':
        return 'En Camino';
      case 'COMPLETED':
        return 'Entregado';
      case 'CANCELLED':
        return 'Cancelado';
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

  const handleViewRoute = (route: SavedRoute) => {
    setSelectedRouteForMap(route);
    onViewRoute(route);
  };

  const handleCloseMap = () => {
    setSelectedRouteForMap(null);
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
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
                    <Route className="w-3 h-3" />
                    Ruta Guardada
                  </span>
                </div>
                
                {route.description && (
                  <p className="text-gray-600 text-sm mb-3">{route.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewRoute(route)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Ver detalles de la ruta"
                >
                  <Eye className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => onStartRoute(route)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Iniciar ruta"
                >
                  <Play className="w-5 h-5" />
                </button>
                
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
                <span className="truncate">{route.origin_name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="w-4 h-4 text-green-500" />
                <span className="font-medium">Pedidos:</span>
                <span>{route.orders.length}</span>
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

            {/* Lista de pedidos de la ruta */}
            {route.orders && route.orders.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Pedidos en esta ruta:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {route.orders.slice(0, 4).map((order, index) => (
                    <div key={order.order_uuid} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">#{order.sequence_order}</span>
                          <span className="text-sm font-medium text-gray-900">{order.order_number}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getOrderStatusColor(order.status)}`}>
                          {getOrderStatusIcon(order.status)}
                          {getOrderStatusText(order.status)}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span className="truncate">{order.delivery_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <DollarSign className="w-3 h-3 text-green-500" />
                          <span>Q{parseFloat(order.total_amount.toString()).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {route.orders.length > 4 && (
                    <div className="bg-gray-100 rounded-lg p-3 border border-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-500">
                        +{route.orders.length - 4} pedidos más
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>ID: {route.uuid.slice(0, 8)}...</span>
                <span>•</span>
                <span>Actualizada: {formatDate(route.updated_at)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewRoute(route)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Ver Ruta
                </button>
                
                <button
                  onClick={() => onStartRoute(route)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Iniciar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal del mapa */}
      {selectedRouteForMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Visualización de Ruta</h3>
              <button
                onClick={handleCloseMap}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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

