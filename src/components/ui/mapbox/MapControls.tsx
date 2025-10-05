'use client';

import React from 'react';
import { 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  MapPin, 
  Users,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { DriverPosition } from '@/hooks/useDriverPositions';

interface MapControlsProps {
  map: any;
  driverPositions: DriverPosition[];
  loading: boolean;
  onRefresh: () => void;
  onFitToDrivers: () => void;
  onToggleDrivers: () => void;
  showDrivers: boolean;
  onSettingsClick?: () => void;
}

export function MapControls({
  map,
  driverPositions,
  loading,
  onRefresh,
  onFitToDrivers,
  onToggleDrivers,
  showDrivers,
  onSettingsClick
}: MapControlsProps) {
  const handleZoomIn = () => {
    if (map) {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.zoomOut();
    }
  };

  const handleFullscreen = () => {
    if (map) {
      const container = map.getContainer();
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 space-y-2">
      {/* Main controls */}
      <div className="theme-bg-3 rounded-lg shadow-lg border p-2 space-y-2">
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Actualizar posiciones"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Zoom controls */}
        <div className="space-y-1">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center rounded-lg theme-bg-3 border theme-border theme-text-primary hover:theme-bg-2 transition-colors"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center rounded-lg theme-bg-3 border theme-border theme-text-primary hover:theme-bg-2 transition-colors"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Fit to drivers */}
        <button
          onClick={onFitToDrivers}
          disabled={driverPositions.length === 0}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Ver todos los conductores"
        >
          <MapPin className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="w-10 h-10 flex items-center justify-center rounded-lg theme-bg-3 border theme-border theme-text-primary hover:theme-bg-2 transition-colors"
          title="Pantalla completa"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Driver controls */}
      <div className="theme-bg-3 rounded-lg shadow-lg border p-2 space-y-2">
        <button
          onClick={onToggleDrivers}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
            showDrivers 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'theme-bg-2 theme-text-primary hover:theme-bg-1'
          }`}
          title={showDrivers ? 'Ocultar conductores' : 'Mostrar conductores'}
        >
          {showDrivers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <div className="text-center">
          <div className="text-xs font-medium theme-text-primary">
            {driverPositions.length}
          </div>
          <div className="text-xs theme-text-muted">
            conductores
          </div>
        </div>
      </div>

      {/* Settings button */}
      {onSettingsClick && (
        <div className="theme-bg-3 rounded-lg shadow-lg border p-2">
          <button
            onClick={onSettingsClick}
            className="w-10 h-10 flex items-center justify-center rounded-lg theme-bg-2 theme-text-primary hover:theme-bg-1 transition-colors"
            title="Configuración del mapa"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
