'use client';

import React, { useState, useEffect } from 'react';
import { Map, Satellite, Globe, MapPin, Truck, Mountain, Bike, Moon, Sun, Compass } from 'lucide-react';

export type MapTileType = 'streets' | 'satellite' | 'dark' | 'cartodb' | 'transport' | 'cycle' | 'night' | 'light' | 'voyager' | 'terrain';

interface MapTileSelectorProps {
  onTileChange: (tileType: MapTileType) => void;
  className?: string;
}

const tileConfig = {
  streets: {
    label: 'Calles',
    icon: Map,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    label: 'Satélite',
    icon: Satellite,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
  },
  dark: {
    label: 'Oscuro',
    icon: Moon,
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  cartodb: {
    label: 'CartoDB',
    icon: MapPin,
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  transport: {
    label: 'Transporte',
    icon: Truck,
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  cycle: {
    label: 'Ciclovías',
    icon: Bike,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  night: {
    label: 'Nocturno',
    icon: Moon,
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  light: {
    label: 'Claro',
    icon: Sun,
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  voyager: {
    label: 'Voyager',
    icon: Compass,
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  terrain: {
    label: 'Terreno',
    icon: Mountain,
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
  }
};

export function MapTileSelector({ onTileChange, className = '' }: MapTileSelectorProps) {
  const [selectedTile, setSelectedTile] = useState<MapTileType>('streets');
  const [isOpen, setIsOpen] = useState(false);

  // Cargar preferencia guardada del localStorage
  useEffect(() => {
    const savedTile = localStorage.getItem('mapTileType') as MapTileType;
    if (savedTile && tileConfig[savedTile]) {
      setSelectedTile(savedTile);
      onTileChange(savedTile);
    }
  }, [onTileChange]);

  const handleTileSelect = (tileType: MapTileType) => {
    setSelectedTile(tileType);
    setIsOpen(false);
    onTileChange(tileType);
    
    // Guardar en localStorage
    localStorage.setItem('mapTileType', tileType);
  };

  const currentConfig = tileConfig[selectedTile];
  const Icon = currentConfig.icon;

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg hover:bg-white transition-colors"
        title="Cambiar tipo de mapa"
      >
        <Icon className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{currentConfig.label}</span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl z-20">
            {Object.entries(tileConfig).map(([tileType, config]) => {
              const Icon = config.icon;
              const isSelected = selectedTile === tileType;
              
              return (
                <button
                  key={tileType}
                  onClick={() => handleTileSelect(tileType as MapTileType)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{config.label}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Función helper para obtener la configuración de tiles
export function getTileConfig(tileType: MapTileType) {
  return tileConfig[tileType];
}
