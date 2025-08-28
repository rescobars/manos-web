'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { isMapboxConfigured } from '@/lib/mapbox';
import { OptimizedRouteMapProps } from '../types';
import { generateStopColor } from '../utils';
import { useOptimizedRouteMap } from '../hooks/useOptimizedRouteMap';

export function OptimizedRouteMap({
  pickupLocation,
  optimizedRoute,
  showOptimizedRoute
}: OptimizedRouteMapProps) {
  const {
    isMapReady,
    isLoading,
    error,
    mapContainerRef,
    clearError
  } = useOptimizedRouteMap(pickupLocation, optimizedRoute, showOptimizedRoute);

  if (!isMapboxConfigured()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Mapbox no configurado</h3>
        <p className="text-yellow-700">Configura tu token de Mapbox para usar la visualización de rutas.</p>
      </div>
    );
  }

  // Solo retornar null si no hay datos de ruta optimizada
  if (!optimizedRoute) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-500">
          <p className="text-sm">No hay datos de ruta optimizada disponibles</p>
          <p className="text-xs mt-1">showOptimizedRoute: {String(showOptimizedRoute)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🚀</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Ruta Optimizada con IA
            </h3>
            <p className="text-sm text-gray-600">
              Algoritmo: {optimizedRoute.optimized_route.optimization_metrics.algorithm}
            </p>
          </div>
        </div>
      </div>

      {/* MAPA - Ruta Optimizada */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          🗺️ Mapa de la Ruta Optimizada
        </h4>
        <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="relative">
            {/* Indicador de estado del mapa */}
            {!isMapReady && (
              <div className="absolute inset-0 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Inicializando mapa...</p>
                </div>
              </div>
            )}
            
            <div 
              ref={mapContainerRef} 
              className={`w-full h-96 rounded-lg overflow-hidden ${
                !isMapReady ? 'opacity-50' : 'opacity-100'
              } transition-opacity duration-300`}
              style={{ minHeight: '400px' }}
            />
            
            {/* Loading overlay para rutas */}
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando ruta optimizada...</p>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center z-20">
                <div className="text-center p-4">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-700 mb-2">{error}</p>
                  <button 
                    onClick={clearError}
                    className="px-3 py-1 text-xs border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 text-center text-sm text-gray-600">
            Mapa dedicado mostrando la ruta optimizada con {optimizedRoute.optimized_route.stops.length} paradas
          </div>
        </div>
      </div>
      
      {/* DETALLES - Métricas principales en tarjetas elegantes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700">
              {optimizedRoute.optimized_route.stops.length}
            </div>
            <div className="text-sm font-medium text-green-800">Paradas</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-700">
              {optimizedRoute.optimized_route.total_distance.toFixed(1)}
            </div>
            <div className="text-sm font-medium text-blue-800">km Total</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="text-3xl font-bold text-purple-700">
            {optimizedRoute.optimized_route.total_time.toFixed(0)}
          </div>
          <div className="text-sm font-medium text-purple-800">min Total</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-700">
              {optimizedRoute.optimized_route.optimization_metrics.solver_time}
            </div>
            <div className="text-sm font-medium text-orange-800">ms Solver</div>
          </div>
        </div>
      </div>
      
      {/* Lista detallada de paradas con mejor diseño */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Secuencia de Paradas Optimizada
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {optimizedRoute.optimized_route.stops.map((stop: any) => (
            <div key={stop.order.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div 
                  className="w-10 h-10 text-white text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: generateStopColor(stop.stop_number, optimizedRoute.optimized_route.stops.length) }}
                >
                  {stop.stop_number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">
                      #{stop.order.order_number}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      +{stop.distance_from_previous.toFixed(2)} km
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mb-1 line-clamp-2">
                    {stop.order.description}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    {stop.order.delivery_location.address}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 flex-shrink-0">
                  <div className="font-medium text-gray-700">
                    {stop.cumulative_distance.toFixed(2)} km
                  </div>
                  <div className="text-gray-500">acumulado</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Información adicional */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span className="text-sm font-medium text-gray-700">Información de la Optimización</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">Algoritmo:</span> {optimizedRoute.optimized_route.optimization_metrics.algorithm}
          </div>
          <div>
            <span className="font-medium">Locaciones optimizadas:</span> {optimizedRoute.optimized_route.optimization_metrics.locations_optimized}
          </div>
          <div>
            <span className="font-medium">Tiempo de procesamiento:</span> {optimizedRoute.processing_time.toFixed(3)}s
          </div>
        </div>
      </div>
    </div>
  );
}
