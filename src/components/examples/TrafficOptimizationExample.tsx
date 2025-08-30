'use client';

import React, { useState } from 'react';
import { TrafficOptimizedRouteMap } from '@/components/ui/TrafficOptimizedRouteMap';

// Ejemplo de datos de entrada para el nuevo endpoint
const exampleWaypoints = [
  { lat: 40.4168, lon: -3.7038, address: 'Madrid Centro' },
  { lat: 40.4378, lon: -3.6795, address: 'Madrid Norte' },
  { lat: 40.4000, lon: -3.7000, address: 'Madrid Oeste' }
];

// Ejemplo de respuesta del nuevo endpoint
const exampleResponse = {
  primary_route: {
    summary: {
      total_time: 1106,
      total_distance: 4719,
      traffic_delay: 0,
      base_time: 1106,
      traffic_time: 0
    },
    points: [
      { lat: 40.41664, lon: -3.70427, traffic_delay: 0, speed: null, congestion_level: 'free_flow' },
      { lat: 40.41652, lon: -3.70426, traffic_delay: 0, speed: null, congestion_level: 'free_flow' },
      { lat: 40.43780, lon: -3.67950, traffic_delay: 0, speed: null, congestion_level: 'free_flow' },
      { lat: 40.40000, lon: -3.70000, traffic_delay: 0, speed: null, congestion_level: 'free_flow' }
    ],
    route_id: 'primary'
  },
  alternative_routes: [
    {
      summary: {
        total_time: 1582,
        total_distance: 15840,
        traffic_delay: 12,
        base_time: 1570,
        traffic_time: 12
      },
      points: [
        { lat: 40.41664, lon: -3.70427, traffic_delay: 0, speed: null, congestion_level: 'free_flow' },
        { lat: 40.43780, lon: -3.67950, traffic_delay: 12, speed: null, congestion_level: 'moderate' },
        { lat: 40.40000, lon: -3.70000, traffic_delay: 0, speed: null, congestion_level: 'free_flow' }
      ],
      route_id: 'alternative_1'
    },
    {
      summary: {
        total_time: 1418,
        total_distance: 7097,
        traffic_delay: 0,
        base_time: 1418,
        traffic_time: 0
      },
      points: [
        { lat: 40.41664, lon: -3.70427, traffic_delay: 0, speed: null, congestion_level: 'free_flow' },
        { lat: 40.40000, lon: -3.70000, traffic_delay: 0, speed: null, congestion_level: 'free_flow' },
        { lat: 40.43780, lon: -3.67950, traffic_delay: 0, speed: null, congestion_level: 'free_flow' }
      ],
      route_id: 'alternative_2'
    }
  ],
  request_info: {
    timestamp: new Date().toISOString(),
    waypoints_count: 3,
    alternatives_requested: true
  },
  traffic_conditions: {
    overall_status: 'good',
    last_updated: new Date().toISOString()
  }
};

export function TrafficOptimizationExample() {
  const [showAlternatives, setShowAlternatives] = useState(true);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Ejemplo de Optimización de Ruta con Tráfico
        </h1>
        <p className="text-gray-600">
          Este ejemplo muestra cómo usar el componente TrafficOptimizedRouteMap con la nueva estructura de datos
        </p>
      </div>

      {/* Controles */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showAlternatives}
              onChange={(e) => setShowAlternatives(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Mostrar rutas alternativas
            </span>
          </label>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          <p><strong>Waypoints:</strong> {exampleWaypoints.length} puntos de ruta</p>
          <p><strong>Rutas disponibles:</strong> {exampleResponse.alternative_routes ? exampleResponse.alternative_routes.length + 1 : 1}</p>
          <p><strong>Tráfico:</strong> {exampleResponse.traffic_conditions.overall_status}</p>
        </div>
      </div>

      {/* Componente del mapa */}
      <TrafficOptimizedRouteMap
        waypoints={exampleWaypoints}
        trafficOptimizedRoute={exampleResponse}
        showAlternatives={showAlternatives}
      />

      {/* Información adicional */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          📋 Estructura de Datos del Nuevo Endpoint
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Entrada (Request)</h4>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "waypoints": [
    {"lat": 40.4168, "lon": -3.7038},
    {"lat": 40.4378, "lon": -3.6795}
  ],
  "alternatives": true
}`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Salida (Response)</h4>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "primary_route": {
    "summary": {...},
    "points": [...],
    "route_id": "primary"
  },
  "alternative_routes": [...],
  "request_info": {...},
  "traffic_conditions": {...}
}`}
            </pre>
          </div>
        </div>

        <div className="mt-4 text-sm text-blue-700">
          <p><strong>Nota:</strong> El componente ahora funciona con waypoints simples en lugar de pedidos complejos, 
          y puede mostrar múltiples rutas alternativas cuando están disponibles.</p>
        </div>
      </div>
    </div>
  );
}
