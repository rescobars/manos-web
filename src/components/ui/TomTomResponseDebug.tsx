'use client';

import React from 'react';
import { Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface TomTomResponseDebugProps {
  response: any;
  orders: any[];
}

export function TomTomResponseDebug({ response, orders }: TomTomResponseDebugProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const analyzeResponse = () => {
    if (!response) return null;

    const routes = response.routes || response.optimized_route?.routes || [];
    const analysis = {
      hasRoutes: routes.length > 0,
      totalRoutes: routes.length,
      totalStops: routes.reduce((acc: number, route: any) => acc + (route.stops?.length || 0), 0),
      stopTypes: routes.reduce((acc: any, route: any) => {
        route.stops?.forEach((stop: any) => {
          acc[stop.type] = (acc[stop.type] || 0) + 1;
        });
        return acc;
      }, {}),
      orderMatches: 0,
      unmatchedOrders: [] as string[]
    };

    // Analizar coincidencias de pedidos
    if (routes.length > 0) {
      const firstRoute = routes[0];
      firstRoute.stops?.forEach((stop: any) => {
        if (stop.type === 'dropoff') {
          const orderId = stop.location.replace('stop-', '');
          const order = orders.find(o => o.id === orderId);
          if (order) {
            analysis.orderMatches++;
          } else {
            analysis.unmatchedOrders.push(orderId);
          }
        }
      });
    }

    return analysis;
  };

  const analysis = analyzeResponse();

  if (!response) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-700">
          <AlertCircle className="w-5 h-5" />
          <span>No hay respuesta de TomTom para mostrar</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Debug: Respuesta de TomTom</h4>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar JSON
            </>
          )}
        </button>
      </div>

      {/* Análisis de la respuesta */}
      {analysis && (
        <div className="mb-4 p-3 bg-white border border-gray-200 rounded">
          <h5 className="font-medium text-gray-900 mb-2">Análisis de la Respuesta</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Rutas</p>
              <p className="font-bold text-blue-600">{analysis.totalRoutes}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Paradas</p>
              <p className="font-bold text-blue-600">{analysis.totalStops}</p>
            </div>
            <div>
              <p className="text-gray-600">Pedidos Coincidentes</p>
              <p className="font-bold text-green-600">{analysis.orderMatches}</p>
            </div>
            <div>
              <p className="text-gray-600">Tipos de Parada</p>
              <div className="text-xs">
                {Object.entries(analysis.stopTypes).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize">{type}:</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {analysis.unmatchedOrders.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-700 font-medium">Pedidos no coincidentes:</p>
              <p className="text-xs text-red-600">{analysis.unmatchedOrders.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {/* Estructura de la respuesta */}
      <div className="mb-4">
        <h5 className="font-medium text-gray-900 mb-2">Estructura de la Respuesta</h5>
        <div className="bg-white border border-gray-200 rounded p-3 text-xs font-mono">
          <div className="text-gray-600">response = {`{`}</div>
          <div className="ml-4">
            <div className="text-gray-600">routes: [</div>
            <div className="ml-4">
              {response.routes?.map((route: any, routeIndex: number) => (
                <div key={routeIndex} className="text-gray-800">
                  {`{`}
                  <div className="ml-4">
                    <div>vehicle: "{route.vehicle}",</div>
                    <div>stops: [</div>
                    <div className="ml-4">
                      {route.stops?.map((stop: any, stopIndex: number) => (
                        <div key={stopIndex} className="text-gray-700">
                          {`{`}
                          <div className="ml-4">
                            <div>type: "{stop.type}",</div>
                            <div>location: "{stop.location}",</div>
                            <div>eta: "{stop.eta}",</div>
                            <div>odometer: {stop.odometer}</div>
                          </div>
                          {`}`}
                        </div>
                      ))}
                    </div>
                    <div>]</div>
                  </div>
                  {`}`}
                </div>
              ))}
            </div>
            <div className="text-gray-600">]</div>
          </div>
          <div className="text-gray-600">{`}`}</div>
        </div>
      </div>

      {/* Respuesta completa (colapsable) */}
      <details className="bg-white border border-gray-200 rounded">
        <summary className="px-3 py-2 cursor-pointer hover:bg-gray-50 font-medium text-gray-900">
          Ver Respuesta Completa
        </summary>
        <div className="p-3 border-t border-gray-200">
          <pre className="text-xs overflow-auto max-h-96 bg-gray-50 p-2 rounded">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}
