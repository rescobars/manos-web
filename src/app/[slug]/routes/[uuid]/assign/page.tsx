'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Package, Route, Navigation, CheckCircle, AlertCircle, User, Truck } from 'lucide-react';
import { useRoute, RouteData } from '@/hooks/useRoute';
import { useDriverPositions } from '@/hooks/useDriverPositions';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { Page } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import dynamic from 'next/dynamic';

// Importar Leaflet dinámicamente
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

// Fix para iconos de Leaflet en Next.js
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Componente para manejar la lógica del mapa
function MapContent({ route, selectedDriver, onDriverSelect }: { 
  route: RouteData; 
  selectedDriver: string | null;
  onDriverSelect: (driverId: string) => void;
}) {
  const map = require('react-leaflet').useMap();
  const [isMapReady, setIsMapReady] = useState(false);
  const [addedLayers, setAddedLayers] = useState<any[]>([]);
  const { driverPositions } = useDriverPositions();

  // Marcar mapa como listo
  useEffect(() => {
    if (map) {
      setIsMapReady(true);
    }
  }, [map]);

  // Limpiar capas existentes
  const clearMap = () => {
    addedLayers.forEach(layer => {
      if (map && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    setAddedLayers([]);
  };

  // Obtener color por tipo de parada
  const getStopColor = (type: string) => {
    switch (type) {
      case 'origin':
        return '#10B981'; // Verde
      case 'destination':
        return '#EF4444'; // Rojo
      case 'waypoint':
        return '#3B82F6'; // Azul
      default:
        return '#6B7280'; // Gris
    }
  };

  // Obtener ícono por tipo de parada
  const getStopIcon = (type: string) => {
    switch (type) {
      case 'origin':
        return '🚀';
      case 'destination':
        return '🏁';
      case 'waypoint':
        return '📍';
      default:
        return '📍';
    }
  };

  // Mostrar ruta y drivers
  useEffect(() => {
    if (!isMapReady || !route || !map) {
      return;
    }

    clearMap();

    const newLayers: any[] = [];

    // Crear polylines para la ruta usando route_points
    if (route.route_points && route.route_points.length > 0) {
      const routeCoordinates = route.route_points.map((point: any) => 
        [point.lat, point.lon] as [number, number]
      );
      
      const routePolyline = require('leaflet').polyline(routeCoordinates, {
        color: '#3B82F6',
        weight: 6,
        opacity: 0.9
      }).addTo(map);

      newLayers.push(routePolyline);
    } else if (route.waypoints.length > 1) {
      // Fallback: conectar waypoints si no hay route_points
      const coordinates = [
        [route.origin_lat, route.origin_lon],
        ...route.waypoints
          .filter((wp: any) => wp.location && wp.location.lat && wp.location.lng)
          .map((wp: any) => [wp.location.lat, wp.location.lng] as [number, number]),
        [route.destination_lat, route.destination_lon]
      ];
      
      const polyline = require('leaflet').polyline(coordinates, {
        color: '#3B82F6',
        weight: 6,
        opacity: 0.9
      }).addTo(map);

      newLayers.push(polyline);
    }

    // Marcador de origen
    const originMarker = require('leaflet').marker([route.origin_lat, route.origin_lon], {
      icon: require('leaflet').divIcon({
        className: 'custom-marker',
        html: `
          <div class="bg-white border-2 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold shadow-lg" style="border-color: ${getStopColor('origin')};">
            <span class="text-xl">${getStopIcon('origin')}</span>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      })
    }).addTo(map);

    originMarker.bindPopup(`
      <div class="text-center min-w-[200px]">
        <div class="font-semibold text-sm mb-2">Origen</div>
        <div class="text-xs text-gray-600 mb-2">${route.origin_name}</div>
        <div class="text-xs text-gray-500">${Number(route.origin_lat || 0).toFixed(6)}, ${Number(route.origin_lon || 0).toFixed(6)}</div>
      </div>
    `);
    newLayers.push(originMarker);

    // Marcador de destino
    const destinationMarker = require('leaflet').marker([route.destination_lat, route.destination_lon], {
      icon: require('leaflet').divIcon({
        className: 'custom-marker',
        html: `
          <div class="bg-white border-2 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold shadow-lg" style="border-color: ${getStopColor('destination')};">
            <span class="text-xl">${getStopIcon('destination')}</span>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      })
    }).addTo(map);

    destinationMarker.bindPopup(`
      <div class="text-center min-w-[200px]">
        <div class="font-semibold text-sm mb-2">Destino</div>
        <div class="text-xs text-gray-600 mb-2">${route.destination_name}</div>
        <div class="text-xs text-gray-500">${Number(route.destination_lat || 0).toFixed(6)}, ${Number(route.destination_lon || 0).toFixed(6)}</div>
      </div>
    `);
    newLayers.push(destinationMarker);

    // Marcadores de waypoints
    route.waypoints.forEach((waypoint: any, index: number) => {
      if (waypoint.location && waypoint.location.lat && waypoint.location.lng) {
        const waypointMarker = require('leaflet').marker([waypoint.location.lat, waypoint.location.lng], {
          icon: require('leaflet').divIcon({
            className: 'custom-marker',
            html: `
              <div class="bg-white border-2 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shadow-lg" style="border-color: ${getStopColor('waypoint')};">
                <span class="text-lg">${index + 1}</span>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })
        }).addTo(map);

        waypointMarker.bindPopup(`
          <div class="text-center min-w-[200px]">
            <div class="font-semibold text-sm mb-2">Waypoint ${index + 1}</div>
            <div class="text-xs text-gray-600 mb-2">${waypoint.location.address || 'Sin dirección'}</div>
            <div class="text-xs text-gray-500">${Number(waypoint.location.lat || 0).toFixed(6)}, ${Number(waypoint.location.lng || 0).toFixed(6)}</div>
          </div>
        `);
        newLayers.push(waypointMarker);
      }
    });

    // Marcadores de drivers
    driverPositions.forEach((driver) => {
      if (driver.location.latitude && driver.location.longitude) {
        const isSelected = selectedDriver === driver.driverId;
        const driverMarker = require('leaflet').marker([driver.location.latitude, driver.location.longitude], {
          icon: require('leaflet').divIcon({
            className: 'driver-marker',
            html: `
              <div class="bg-blue-500 border-2 border-white rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold shadow-lg cursor-pointer hover:bg-blue-600 transition-colors ${isSelected ? 'ring-4 ring-blue-300' : ''}" style="border-color: ${isSelected ? '#3B82F6' : '#ffffff'};">
                🚗
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(map);

        // Hacer clic para seleccionar driver
        driverMarker.on('click', () => {
          onDriverSelect(driver.driverId);
        });

        // Crear popup con información del driver
        const popupContent = `
          <div class="text-center min-w-[200px]">
            <div class="font-semibold text-sm mb-2">Conductor</div>
            <div class="text-xs text-gray-600 mb-2">${driver.driverName || 'Sin nombre'}</div>
            <div class="text-xs text-gray-500 mb-1">ID: ${driver.driverId}</div>
            <div class="text-xs text-gray-500 mb-1">Estado: ${driver.status}</div>
            <div class="text-xs text-gray-500 mb-1">Última actualización: ${new Date(driver.timestamp).toLocaleTimeString()}</div>
            <div class="text-xs text-gray-500">${driver.location.latitude.toFixed(6)}, ${driver.location.longitude.toFixed(6)}</div>
            <div class="text-xs text-blue-600 mt-2 font-medium">Haz clic para seleccionar</div>
          </div>
        `;

        driverMarker.bindPopup(popupContent);
        newLayers.push(driverMarker);
      }
    });

    setAddedLayers(newLayers);

    // Ajustar vista para mostrar toda la ruta
    if (route.waypoints.length > 0 || route.route_points.length > 0) {
      const group = require('leaflet').featureGroup(newLayers);
      const bounds = group.getBounds();
      map.fitBounds(bounds.pad(0.1));
    }
  }, [isMapReady, route, map, driverPositions, selectedDriver, onDriverSelect]);

  return null; // Este componente no renderiza nada, solo maneja la lógica
}

export default function RouteAssignmentPage() {
  const { colors } = useDynamicTheme();
  const params = useParams();
  const router = useRouter();
  const { route, getRoute, isLoading, error } = useRoute();
  const { driverPositions } = useDriverPositions();

  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [driverNotes, setDriverNotes] = useState('');

  useEffect(() => {
    if (params.uuid && typeof params.uuid === 'string') {
      getRoute(params.uuid);
    }
  }, [params.uuid, getRoute]);

  const handleDriverSelect = (driverId: string) => {
    setSelectedDriver(driverId);
  };

  const handleAssign = async () => {
    if (!selectedDriver) {
      alert('Por favor selecciona un conductor');
      return;
    }

    if (!params.uuid || typeof params.uuid !== 'string') {
      alert('Error: UUID de ruta no válido');
      return;
    }

    const request = {
      driver_notes: driverNotes || undefined,
    };

  };



  if (isLoading) {
    return (
      <Page
        title="Cargando ruta..."
        subtitle="Obteniendo información de la ruta"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.buttonPrimary1 }}></div>
            <p className="theme-text-secondary">Cargando ruta...</p>
          </div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page
        title="Error al cargar la ruta"
        subtitle="No se pudo obtener la información de la ruta"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.warning }} />
            <h3 className="text-lg font-semibold theme-text-primary mb-2">Error al cargar la ruta</h3>
            <p className="theme-text-secondary mb-4">{error}</p>
            <Button
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  if (!route) {
    return (
      <Page
        title="Ruta no encontrada"
        subtitle="La ruta solicitada no existe"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.warning }} />
            <h3 className="text-lg font-semibold theme-text-primary mb-2">Ruta no encontrada</h3>
            <p className="theme-text-secondary mb-4">La ruta solicitada no existe o no tienes permisos para verla.</p>
            <Button
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  const selectedDriverData = driverPositions.find(d => d.driverId === selectedDriver);

  return (
    <Page
      title={`Asignar Ruta: ${route.route_name}`}
      subtitle={route.description}
    >
      {/* Botón de volver */}
      <div className="mb-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Rutas
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mapa */}
        <div>
          <h4 className="text-lg font-semibold theme-text-primary mb-4">Ruta y Conductores</h4>
          <div className="h-96 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
            <MapContainer
              center={[route.origin_lat, route.origin_lon]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapContent 
                route={route} 
                selectedDriver={selectedDriver}
                onDriverSelect={handleDriverSelect}
              />
            </MapContainer>
          </div>
          <p className="text-xs theme-text-muted mt-2">
            💡 Haz clic en un conductor en el mapa para seleccionarlo
          </p>
        </div>

        {/* Panel de asignación */}
        <div>
          <h4 className="text-lg font-semibold theme-text-primary mb-4">Detalles de Asignación</h4>
          

          {/* Conductor seleccionado */}
          <div className="bg-white p-4 rounded-lg border mb-4" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
            <h5 className="font-medium theme-text-primary mb-3">Conductor Seleccionado</h5>
            {selectedDriverData ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" style={{ color: colors.info }} />
                  <span className="font-medium theme-text-primary">{selectedDriverData.driverName}</span>
                </div>
                <div className="text-sm theme-text-secondary">
                  <div>ID: {selectedDriverData.driverId}</div>
                  <div>Estado: {selectedDriverData.status}</div>
                  <div>Última actualización: {new Date(selectedDriverData.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm theme-text-muted">Selecciona un conductor en el mapa</p>
            )}
          </div>

          {/* Formulario de asignación */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">
                Notas para el conductor (opcional)
              </label>
              <textarea
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg theme-bg-2 theme-border theme-text-primary"
                style={{ backgroundColor: colors.background2, borderColor: colors.border }}
                placeholder="Instrucciones especiales, notas importantes..."
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleAssign}
              disabled={!selectedDriver}
              className="flex-1"
            >
              Asignar Ruta
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>

        </div>
      </div>
    </Page>
  );
}
