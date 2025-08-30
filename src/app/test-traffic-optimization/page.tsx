'use client';

import React, { useState } from 'react';
import { TrafficOptimizedRouteMap } from '@/components/ui/TrafficOptimizedRouteMap';
import { useTrafficOptimization } from '@/hooks/useTrafficOptimization';

export default function TestTrafficOptimizationPage() {
  const [origin, setOrigin] = useState({
    lat: 14.631631,
    lon: -90.606249,
    name: 'Punto Inicio/Fin'
  });

  const [destination, setDestination] = useState({
    lat: 14.631631,
    lon: -90.606249,
    name: 'Punto Inicio/Fin'
  });

  const [waypoints, setWaypoints] = useState([
    { lat: 14.6349, lon: -90.5069, name: 'Parada 1' },
    { lat: 14.63509, lon: -90.50034, name: 'Parada 2' }
  ]);

  const { optimizeRoute, isLoading, error, data, reset } = useTrafficOptimization();

  const handleOptimize = async () => {
    const result = await optimizeRoute(origin, destination, waypoints, true);
    console.log('Optimization result:', result);
  };

  const handleAddWaypoint = () => {
    const newWaypoint = {
      lat: 14.4000 + Math.random() * 0.3,
      lon: -90.5000 + Math.random() * 0.2,
      name: `Parada ${waypoints.length + 1}`
    };
    setWaypoints([...waypoints, newWaypoint]);
  };

  const handleReset = () => {
    reset();
    setOrigin({
      lat: 14.631631,
      lon: -90.606249,
      name: 'Punto Inicio/Fin'
    });
    setDestination({
      lat: 14.631631,
      lon: -90.606249,
      name: 'Punto Inicio/Fin'
    });
    setWaypoints([
      { lat: 14.6349, lon: -90.5069, name: 'Parada 1' },
      { lat: 14.63509, lon: -90.50034, name: 'Parada 2' }
    ]);
  };

  const handleLoadSampleData = () => {
    setOrigin({
      lat: 14.631631,
      lon: -90.606249,
      name: 'Punto Inicio/Fin'
    });
    setDestination({
      lat: 14.631631,
      lon: -90.606249,
      name: 'Punto Inicio/Fin'
    });
    setWaypoints([
      { lat: 14.6349, lon: -90.5069, name: 'Parada 1' },
      { lat: 14.63509, lon: -90.50034, name: 'Parada 2' },
      { lat: 14.618622, lon: -90.501064, name: 'Parada 3' },
      { lat: 14.637967, lon: -90.551102, name: 'Parada 4' },
      { lat: 14.626275, lon: -90.520625, name: 'Parada 5' },
      { lat: 14.665193, lon: -90.492376, name: 'Parada 6' },
      { lat: 14.60849, lon: -90.529988, name: 'Parada 7' }
    ]);
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prueba de Optimización de Ruta con Tráfico
          </h1>
          <p className="text-gray-600">
            Página de prueba para verificar que el componente TrafficOptimizedRouteMap funciona correctamente
          </p>
        </div>

        {/* Controles */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleOptimize}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Optimizando...' : 'Optimizar Ruta'}
            </button>
            
            <button
              onClick={handleAddWaypoint}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Agregar Waypoint
            </button>
            
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Reset
            </button>

            <button
              onClick={handleLoadSampleData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Datos de Ejemplo
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Origin:</strong> {origin.name} ({origin.lat.toFixed(6)}, {origin.lon.toFixed(6)})</p>
            <p><strong>Destination:</strong> {destination.name} ({destination.lat.toFixed(6)}, {destination.lon.toFixed(6)})</p>
            <p><strong>Waypoints:</strong> {waypoints.length}</p>
            <p><strong>Estado:</strong> {isLoading ? 'Optimizando...' : data ? 'Optimizado' : 'Pendiente'}</p>
            {error && <p className="text-red-600"><strong>Error:</strong> {error}</p>}
          </div>
        </div>

        {/* Lista de waypoints */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Waypoints Actuales</h3>
          <div className="space-y-2">
            {waypoints.map((waypoint, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded border">
                <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{waypoint.name}</p>
                  <p className="text-sm text-gray-600">
                    {waypoint.lat.toFixed(6)}, {waypoint.lon.toFixed(6)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Componente del mapa */}
        {data && (
          <TrafficOptimizedRouteMap
            origin={origin}
            destination={destination}
            waypoints={waypoints}
            trafficOptimizedRoute={data}
            showAlternatives={true}
          />
        )}

        {/* Estado de carga */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Optimizando ruta con tráfico...</p>
          </div>
        )}

        {/* Mensaje cuando no hay datos */}
        {!data && !isLoading && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗺️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin Ruta Optimizada</h3>
            <p className="text-gray-600 mb-4">
              Haz clic en "Optimizar Ruta" para generar una ruta optimizada con tráfico
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Estado actual:</strong></p>
              <p>• Origin: {origin.name}</p>
              <p>• Destination: {destination.name}</p>
              <p>• Waypoints: {waypoints.length}</p>
              <p>• Error: {error || 'Ninguno'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
