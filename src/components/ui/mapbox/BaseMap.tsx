'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getMapboxToken, isMapboxConfigured } from '@/lib/mapbox';

interface BaseMapProps {
  center: [number, number];
  zoom?: number;
  style?: string;
  className?: string;
  onMapReady?: (map: any) => void;
  children?: React.ReactNode;
}

export function BaseMap({
  center,
  zoom = 12,
  style = 'mapbox://styles/mapbox/streets-v12',
  className = 'w-full h-full',
  onMapReady,
  children
}: BaseMapProps) {
  const [map, setMap] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Inicializar el mapa
  useEffect(() => {
    if (!mapContainerRef.current || !isMapboxConfigured()) return;

    const loadMapbox = async () => {
      try {
        if (window.mapboxgl) {
          initializeMap();
          return;
        }

        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.onload = () => {
          window.mapboxgl.accessToken = getMapboxToken();
          initializeMap();
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Mapbox:', error);
        setError('Error cargando Mapbox');
      }
    };

    loadMapbox();
  }, []);

  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current) return;

    console.log('🗺️ INITIALIZE - Inicializando mapa, contenedor:', mapContainerRef.current);

    try {
      const mapInstance = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style,
        center,
        zoom,
        maxZoom: 18,
        minZoom: 8
      });

      // Add zoom controls
      mapInstance.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
      
      // Add fullscreen control
      mapInstance.addControl(new window.mapboxgl.FullscreenControl(), 'top-right');

      mapInstance.on('load', () => {
        console.log('🗺️ LOAD - Mapa cargado completamente, instancia:', mapInstance);
        setMap(mapInstance);
        setIsMapReady(true);
        
        // Forzar resize del mapa para que ocupe todo el contenedor
        setTimeout(() => {
          mapInstance.resize();
        }, 100);
        
        if (onMapReady) {
          console.log('🗺️ READY - Llamando onMapReady callback');
          onMapReady(mapInstance);
        }
      });

      mapInstance.on('error', () => {
        setError('Error en el mapa');
      });

    } catch (error) {
      setError('Error inicializando el mapa');
    }
  }, [center, zoom, style, onMapReady]);

  // Limpiar mapa al desmontar
  useEffect(() => {
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [map]);

  if (!isMapboxConfigured()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="w-12 h-12 text-yellow-600 mx-auto mb-4">🗺️</div>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Mapbox no configurado</h3>
        <p className="text-yellow-700">Configura tu token de Mapbox para usar la visualización de rutas.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="w-12 h-12 text-red-600 mx-auto mb-4">❌</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error en el mapa</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainerRef} 
        className={`w-full h-full ${
          !isMapReady ? 'opacity-50' : 'opacity-100'
        } transition-opacity duration-300`}
        style={{ minHeight: '100%' }}
      />
      
      {/* Loading overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 theme-bg-3 bg-opacity-75 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm theme-text-secondary">Cargando mapa...</p>
          </div>
        </div>
      )}

      {/* Render children when map is ready */}
      {isMapReady && map && children}
    </div>
  );
}

// Hook para usar el mapa
export function useMap() {
  const [map, setMap] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const handleMapReady = useCallback((mapInstance: any) => {
    // Verificar que el mapa esté completamente inicializado
    if (mapInstance && mapInstance.isStyleLoaded && mapInstance.getContainer()) {
      setMap(mapInstance);
      setIsMapReady(true);
    } else {
      // Si el mapa no está completamente listo, esperar al evento 'idle'
      const handleIdle = () => {
        if (mapInstance.isStyleLoaded && mapInstance.getContainer()) {
          setMap(mapInstance);
          setIsMapReady(true);
          mapInstance.off('idle', handleIdle);
        }
      };
      
      mapInstance.on('idle', handleIdle);
      
      // También verificar en el evento 'load' por si acaso
      const handleLoad = () => {
        if (mapInstance.isStyleLoaded && mapInstance.getContainer()) {
          setMap(mapInstance);
          setIsMapReady(true);
          mapInstance.off('load', handleLoad);
          mapInstance.off('idle', handleIdle);
        }
      };
      
      mapInstance.on('load', handleLoad);
      
      // Verificación adicional con timeout
      setTimeout(() => {
        if (mapInstance.isStyleLoaded && mapInstance.getContainer()) {
          setMap(mapInstance);
          setIsMapReady(true);
          mapInstance.off('idle', handleIdle);
          mapInstance.off('load', handleLoad);
        }
      }, 500);
    }
  }, []);

  return { map, isMapReady, handleMapReady };
}
