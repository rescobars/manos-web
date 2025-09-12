'use client';

import React from 'react';
import { SavedRoute } from '@/types';
import { XCircle } from 'lucide-react';
import SavedRouteMap from '@/components/ui/SavedRouteMap';

interface RouteViewModalProps {
  route: SavedRoute;
  onClose: () => void;
}

export function RouteViewModal({ route, onClose }: RouteViewModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Visualización de Ruta</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <SavedRouteMap 
            route={route} 
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
