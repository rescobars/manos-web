'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { 
  Point, 
  RoutePoint,
  VisitOrderItem, 
  RouteInfo, 
  RouteSummary, 
  Route as RouteType,
  TrafficOptimizationData 
} from '@/types/traffic-optimization';

// Configurar Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface TrafficOptimizedRouteMapProps {
  trafficOptimizedRoute: TrafficOptimizationData | null;
  showAlternatives?: boolean;
}

const TrafficOptimizedRouteMap: React.FC<TrafficOptimizedRouteMapProps> = ({
  trafficOptimizedRoute,
  showAlternatives = true,
}) => {
  const { colors } = useDynamicTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [isMapReady, setIsMapReady] = useState(false);
  const [addedSources, setAddedSources] = useState<string[]>([]);
  const [addedLayers, setAddedLayers] = useState<string[]>([]);
  
  // Estados para la simulación del vehículo
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // Velocidad base (1x)
  const vehicleMarker = useRef<mapboxgl.Marker | null>(null);
  const animationId = useRef<number | null>(null);
  const simulationStartTime = useRef<number>(0);
  const isSimulatingRef = useRef<boolean>(false);
  const simulationSpeedRef = useRef<number>(1);

  // Usar color primario del tema para todas las rutas; diferenciación por opacidad/espesor
  const primaryColor = colors.buttonPrimary1;

  // Utilidades simples para generar variaciones del color primario (paleta armónica)
  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (x: number) => x.toString(16).padStart(2, '0');
    return `#${toHex(Math.max(0, Math.min(255, Math.round(r))))}${toHex(Math.max(0, Math.min(255, Math.round(g))))}${toHex(Math.max(0, Math.min(255, Math.round(b))))}`;
  };

  const lighten = (hex: string, amount: number) => {
    const { r, g, b } = hexToRgb(hex);
    const nr = r + (255 - r) * amount;
    const ng = g + (255 - g) * amount;
    const nb = b + (255 - b) * amount;
    return rgbToHex(nr, ng, nb);
  };

  const darken = (hex: string, amount: number) => {
    const { r, g, b } = hexToRgb(hex);
    const nr = r * (1 - amount);
    const ng = g * (1 - amount);
    const nb = b * (1 - amount);
    return rgbToHex(nr, ng, nb);
  };

  // Generar una paleta de 8 colores derivados del primario (variaciones de luminosidad)
  const getRouteColorByIndex = (index: number): string => {
    if (index === 0) return primaryColor; // Principal
    const palette = [
      lighten(primaryColor, 0.15),
      darken(primaryColor, 0.15),
      lighten(primaryColor, 0.3),
      darken(primaryColor, 0.3),
      lighten(primaryColor, 0.45),
      darken(primaryColor, 0.45),
      lighten(primaryColor, 0.6),
      darken(primaryColor, 0.6),
    ];
    return palette[(index - 1) % palette.length];
  };

  // Obtener todas las rutas disponibles
  const getAvailableRoutes = (): RouteType[] => {
    if (!trafficOptimizedRoute) return [];
    
    const routes: RouteType[] = [trafficOptimizedRoute.primary_route];
    if (trafficOptimizedRoute.alternative_routes) {
      routes.push(...trafficOptimizedRoute.alternative_routes);
    }
    return routes;
  };

  // Función para cambiar de ruta
  const changeRoute = (routeIndex: number) => {
    if (!map.current || !isMapReady) return;
    
    const routes = getAvailableRoutes();
    if (routeIndex < 0 || routeIndex >= routes.length) return;
    
    const newRoute = routes[routeIndex];
    console.log('🔄 Cambiando a ruta:', { 
      routeIndex, 
      routeId: newRoute.route_id,
      visitOrderLength: newRoute.visit_order?.length,
      visitOrder: newRoute.visit_order
    });
    
    // Detener simulación si está activa
    stopSimulation();
    
    // Limpiar mapa actual
    clearMap();
    
    // Actualizar estado
    setSelectedRouteIndex(routeIndex);
    setSelectedRoute(newRoute);
    
    // Dibujar nueva ruta
    displayRoute(newRoute, routeIndex);
    
    // Ajustar mapa a la nueva ruta
    fitMapToRoute(newRoute.points);
  };

  // Función para iniciar la simulación
  const startSimulation = () => {
    if (!map.current || !selectedRoute || isSimulatingRef.current) {
      console.log('❌ startSimulation: Condiciones no cumplidas', {
        mapExists: !!map.current,
        hasSelectedRoute: !!selectedRoute,
        isSimulating: isSimulatingRef.current
      });
      return;
    }
    
    console.log('🚗 Iniciando simulación de recorrido', {
      totalTime: selectedRoute.summary.total_time,
      totalDistance: selectedRoute.summary.total_distance,
      pointsCount: selectedRoute.points.length,
      firstPoint: selectedRoute.points[0],
      lastPoint: selectedRoute.points[selectedRoute.points.length - 1]
    });
    
    // Actualizar estado y referencia
    isSimulatingRef.current = true;
    simulationSpeedRef.current = 1; // Velocidad inicial 1x
    setIsSimulating(true);
    setSimulationSpeed(1);
    setSimulationProgress(0);
    simulationStartTime.current = Date.now();
    
    // Crear marcador del vehículo
    createVehicleMarker();
    
    // Iniciar animación inmediatamente
    animateVehicle();
  };

  // Función para detener la simulación
  const stopSimulation = () => {
    console.log('🛑 Deteniendo simulación');
    isSimulatingRef.current = false;
    setIsSimulating(false);
    setSimulationProgress(0);
    
    if (animationId.current) {
      cancelAnimationFrame(animationId.current);
      animationId.current = null;
    }
    
    // Remover marcador del vehículo
    if (vehicleMarker.current) {
      vehicleMarker.current.remove();
      vehicleMarker.current = null;
    }
  };

  // Función para crear el marcador del vehículo
  const createVehicleMarker = () => {
    if (!map.current || !selectedRoute) {
      console.log('❌ createVehicleMarker: Condiciones no cumplidas', {
        mapExists: !!map.current,
        hasSelectedRoute: !!selectedRoute
      });
      return;
    }
    
    console.log('🚗 Creando marcador del vehículo en:', {
      lat: selectedRoute.points[0].lat,
      lon: selectedRoute.points[0].lon,
      totalPoints: selectedRoute.points.length
    });
    
    // Crear elemento del vehículo
    const vehicleElement = document.createElement('div');
    vehicleElement.className = 'vehicle-marker';
    vehicleElement.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background: #ef4444;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(0deg);
        transition: transform 0.3s ease;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `;
    
    // Crear marcador
    vehicleMarker.current = new mapboxgl.Marker(vehicleElement)
      .setLngLat([selectedRoute.points[0].lon, selectedRoute.points[0].lat])
      .addTo(map.current);
    
    console.log('✅ Marcador del vehículo creado exitosamente');
  };

  // Función para animar el vehículo
  const animateVehicle = () => {
    if (!map.current || !selectedRoute || !vehicleMarker.current || !isSimulatingRef.current) {
      console.log('❌ animateVehicle: Condiciones no cumplidas', {
        mapExists: !!map.current,
        hasSelectedRoute: !!selectedRoute,
        hasVehicleMarker: !!vehicleMarker.current,
        isSimulating: isSimulatingRef.current
      });
      return;
    }
    
    const points = selectedRoute.points;
    const totalDistance = selectedRoute.summary.total_distance;
    const totalTime = selectedRoute.summary.total_time * 1000; // Convertir a milisegundos
    
    // Usar velocidad dinámica
    const adjustedTotalTime = totalTime / simulationSpeedRef.current;
    
    const elapsed = Date.now() - simulationStartTime.current;
    const progress = Math.min(elapsed / adjustedTotalTime, 1);
    
    console.log('🚗 Animando vehículo:', {
      progress: progress.toFixed(3),
      elapsed: Math.round(elapsed / 1000) + 's',
      totalTime: Math.round(totalTime / 1000) + 's',
      adjustedTime: Math.round(adjustedTotalTime / 1000) + 's',
      speed: simulationSpeedRef.current + 'x',
      currentDistance: Math.round(progress * totalDistance) + 'm',
      totalDistance: Math.round(totalDistance) + 'm'
    });
    
    setSimulationProgress(progress);
    
    if (progress >= 1) {
      // Simulación completada
      console.log('✅ Simulación completada');
      stopSimulation();
      return;
    }
    
    // Verificar si la simulación sigue activa
    if (!isSimulatingRef.current) {
      console.log('🛑 Simulación detenida');
      return;
    }
    
    // Calcular posición actual en la ruta
    const currentDistance = progress * totalDistance;
    const currentPoint = getPointAtDistance(points, currentDistance);
    
    if (currentPoint) {
      console.log('📍 Posición actual:', {
        lat: currentPoint.lat.toFixed(6),
        lon: currentPoint.lon.toFixed(6)
      });
      
      // Actualizar posición del vehículo
      vehicleMarker.current.setLngLat([currentPoint.lon, currentPoint.lat]);
      
      // Calcular dirección para rotar el vehículo
      const nextPoint = getNextPoint(points, currentDistance);
      if (nextPoint) {
        const angle = calculateBearing(currentPoint, nextPoint);
        const vehicleElement = vehicleMarker.current.getElement();
        const iconElement = vehicleElement.querySelector('div');
        if (iconElement) {
          iconElement.style.transform = `rotate(${angle}deg)`;
        }
      }
    } else {
      console.warn('⚠️ No se pudo calcular la posición actual');
    }
    
    // Continuar animación
    animationId.current = requestAnimationFrame(animateVehicle);
  };

  // Función para obtener el punto en una distancia específica
  const getPointAtDistance = (points: RoutePoint[], distance: number): RoutePoint | null => {
    if (points.length < 2) return points[0] || null;
    
    let accumulatedDistance = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      
      const segmentDistance = calculateDistance(currentPoint, nextPoint);
      
      if (accumulatedDistance + segmentDistance >= distance) {
        // Interpolar entre los dos puntos
        const segmentProgress = (distance - accumulatedDistance) / segmentDistance;
        return {
          lat: currentPoint.lat + (nextPoint.lat - currentPoint.lat) * segmentProgress,
          lon: currentPoint.lon + (nextPoint.lon - currentPoint.lon) * segmentProgress,
          name: `interpolated-${i}-${segmentProgress.toFixed(2)}`,
          traffic_delay: currentPoint.traffic_delay,
          speed: currentPoint.speed,
          congestion_level: currentPoint.congestion_level,
          waypoint_type: currentPoint.waypoint_type,
          waypoint_index: currentPoint.waypoint_index
        };
      }
      
      accumulatedDistance += segmentDistance;
    }
    
    return points[points.length - 1];
  };

  // Función para obtener el siguiente punto
  const getNextPoint = (points: RoutePoint[], distance: number): RoutePoint | null => {
    if (points.length < 2) return null;
    
    let accumulatedDistance = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      
      const segmentDistance = calculateDistance(currentPoint, nextPoint);
      
      if (accumulatedDistance + segmentDistance >= distance) {
        return nextPoint;
      }
      
      accumulatedDistance += segmentDistance;
    }
    
    return null;
  };

  // Función para calcular distancia entre dos puntos
  const calculateDistance = (point1: Point | RoutePoint, point2: Point | RoutePoint): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lon - point1.lon) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Función para calcular el bearing (dirección) entre dos puntos
  const calculateBearing = (point1: Point | RoutePoint, point2: Point | RoutePoint): number => {
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δλ = (point2.lon - point1.lon) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };

  // Función para cambiar la velocidad de la simulación
  const changeSimulationSpeed = (newSpeed: number) => {
    if (!isSimulatingRef.current) return;
    
    console.log('⚡ Cambiando velocidad de simulación:', {
      from: simulationSpeedRef.current + 'x',
      to: newSpeed + 'x'
    });
    
    simulationSpeedRef.current = newSpeed;
    setSimulationSpeed(newSpeed);
  };

  // Función para aumentar la velocidad
  const increaseSpeed = () => {
    const currentSpeed = simulationSpeedRef.current;
    const speeds = [0.25, 0.5, 1, 2, 4, 8, 16, 32];
    const currentIndex = speeds.indexOf(currentSpeed);
    const nextIndex = Math.min(currentIndex + 1, speeds.length - 1);
    changeSimulationSpeed(speeds[nextIndex]);
  };

  // Función para disminuir la velocidad
  const decreaseSpeed = () => {
    const currentSpeed = simulationSpeedRef.current;
    const speeds = [0.25, 0.5, 1, 2, 4, 8, 16, 32];
    const currentIndex = speeds.indexOf(currentSpeed);
    const prevIndex = Math.max(currentIndex - 1, 0);
    changeSimulationSpeed(speeds[prevIndex]);
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-90.606249, 14.631631], // Guatemala City
      zoom: 10,
      maxZoom: 18,
      minZoom: 3,
      fitBoundsOptions: {
        padding: { top: 20, bottom: 20, left: 20, right: 20 }
      }
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    // Habilitar zoom con mouse wheel
    map.current.scrollZoom.enable();
    
    // Habilitar zoom con doble clic
    map.current.doubleClickZoom.enable();

    // Esperar a que el estilo del mapa esté completamente cargado
    map.current.on('style.load', () => {
      console.log('🎉 Evento style.load disparado - Mapa cargado completamente');
      setIsMapReady(true);
    });
    
    // También escuchar el evento load general
    map.current.on('load', () => {
      console.log('🚀 Evento load disparado - Mapa inicializado');
    });
    
    // Escuchar eventos de zoom para debugging
    map.current.on('zoom', () => {
      console.log('🔍 Zoom actual:', map.current?.getZoom());
    });
    
    map.current.on('zoomstart', () => {
      console.log('🚀 Iniciando zoom');
    });
    
    map.current.on('zoomend', () => {
      console.log('✅ Zoom completado');
    });
    
    map.current.on('wheel', () => {
      console.log('🖱️ Evento wheel detectado - Zoom con mouse');
    });
    
    // Asegurar que las interacciones estén habilitadas
    map.current.dragPan.enable();
    map.current.dragRotate.enable();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // Limpiar estados
      setAddedSources([]);
      setAddedLayers([]);
      setIsMapReady(false);
      
      // Limpiar simulación
      stopSimulation();
    };
  }, []);

  useEffect(() => {
    console.log('🔄 useEffect ejecutado:', { 
      mapExists: !!map.current, 
      hasData: !!trafficOptimizedRoute, 
      isMapReady 
    });
    
    if (!map.current || !trafficOptimizedRoute || !isMapReady) {
      console.log('❌ useEffect: Condiciones no cumplidas');
      return;
    }

    console.log('✅ useEffect: Todas las condiciones cumplidas, procediendo...');

    // Detener simulación si está activa
    stopSimulation();

    // Limpiar mapas existentes
    clearMap();

    // Seleccionar la ruta principal por defecto
    setSelectedRouteIndex(0);
    setSelectedRoute(trafficOptimizedRoute.primary_route);

    // Dibujar la ruta principal
    displayRoute(trafficOptimizedRoute.primary_route, 0);

    // Ajustar el mapa para mostrar toda la ruta
    fitMapToRoute(trafficOptimizedRoute.primary_route.points);
  }, [trafficOptimizedRoute, isMapReady]);

  // Efecto para limpiar simulación cuando cambie la ruta seleccionada
  useEffect(() => {
    if (isSimulatingRef.current) {
      stopSimulation();
    }
  }, [selectedRouteIndex]);



  const clearMap = () => {
    console.log('🧹 clearMap llamado:', { mapExists: !!map.current, isMapReady });
    if (!map.current || !isMapReady) return;

    console.log('🗑️ Removiendo fuentes y capas personalizadas:', { addedSources, addedLayers });
    
    // Remover capas personalizadas primero
    addedLayers.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
        console.log('🗑️ Capa personalizada removida:', layerId);
      }
    });
    
    // Luego remover fuentes personalizadas
    addedSources.forEach(sourceId => {
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
        console.log('🗑️ Fuente personalizada removida:', sourceId);
      }
    });
    
    // Limpiar los estados
    setAddedSources([]);
    setAddedLayers([]);
  };

  const displayRoute = (route: RouteType, routeIndex: number) => {
    console.log('🚀 displayRoute llamado:', { route, routeIndex, isMapReady, mapExists: !!map.current });
    
    if (!map.current || !isMapReady) {
      console.log('❌ displayRoute: Mapa no está listo');
      return;
    }

    const routeId = `route-${routeIndex}`;
    const isPrimary = routeIndex === 0;
    const color = getRouteColorByIndex(routeIndex);
    
    console.log('🎨 Color de ruta:', { routeId, isPrimary, color });
    console.log('📍 Puntos de ruta:', route.points.length, route.points.slice(0, 3));

    // Agregar fuente para los puntos de la ruta
    const coordinates = route.points.map(point => [point.lon, point.lat]);
    console.log('🗺️ Coordenadas de la ruta:', coordinates.slice(0, 5));
    
    try {
      map.current.addSource(routeId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      });
      console.log('✅ Fuente agregada:', routeId);
      setAddedSources(prev => [...prev, routeId]);
    } catch (error) {
      console.error('❌ Error al agregar fuente:', error);
      return;
    }

    // Agregar capa para la línea de la ruta
    try {
      map.current.addLayer({
        id: `${routeId}-line`,
        type: 'line',
        source: routeId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': isPrimary ? 6 : 4,
          'line-opacity': isPrimary ? 0.9 : 0.35,
        },
      });
      console.log('✅ Capa agregada:', `${routeId}-line`);
      setAddedLayers(prev => [...prev, `${routeId}-line`]);
    } catch (error) {
      console.error('❌ Error al agregar capa:', error);
      return;
    }

    // Agregar marcadores para los waypoints según el visit_order
    addWaypointMarkers(route, routeIndex, color);
    
    // Agregar marcador del origen (sucursal)
    addOriginMarker();
  };

  const addWaypointMarkers = (route: RouteType, routeIndex: number, routeColor: string) => {
    if (!map.current || !trafficOptimizedRoute || !isMapReady) return;

    // Usar el visit_order específico de esta ruta
    const { visit_order } = route;
    
    // Usar optimized_waypoints de la ruta si está disponible, sino del route_info
    const optimized_waypoints = route.optimized_waypoints || trafficOptimizedRoute.route_info.optimized_waypoints;
    
    console.log('📍 addWaypointMarkers - Waypoints utilizados:', {
      routeId: route.route_id,
      hasRouteWaypoints: !!route.optimized_waypoints,
      hasFallbackWaypoints: !!trafficOptimizedRoute.route_info.optimized_waypoints,
      waypointsCount: optimized_waypoints?.length
    });
    
    if (!optimized_waypoints) {
      console.warn('⚠️ No hay optimized_waypoints disponibles para la ruta:', route.route_id);
      return;
    }

    // Crear marcadores para cada waypoint en el orden de visita
    visit_order.forEach((visitItem, index) => {
      const waypoint = optimized_waypoints.find(wp => wp.name === visitItem.name);
      if (!waypoint) return;

      const markerId = `marker-${routeIndex}-${index}`;
      const visitNumber = index + 1; // Número de visita (1, 2, 3...)

      // Crear el elemento del marcador
      const markerElement = document.createElement('div');
      markerElement.className = 'waypoint-marker';
      markerElement.innerHTML = `
        <div style="
          background: ${getRouteColorByIndex(routeIndex)};
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: none !important;
          filter: none !important;
          position: relative;
        ">
          ${visitNumber}
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            border: 2px solid ${getRouteColorByIndex(routeIndex)};
          "></div>
        </div>
      `;

      // Crear el popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #333;">${waypoint.name}</h4>
          <p style="margin: 0; color: #666;">Orden de visita: <strong>#${visitNumber}</strong></p>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">
            Coordenadas: ${waypoint.lat.toFixed(4)}, ${waypoint.lon.toFixed(4)}
          </p>
        </div>
      `);

      // Crear y agregar el marcador
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([waypoint.lon, waypoint.lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Guardar referencia del marcador para poder removerlo después
      (marker as any).id = markerId;
    });
  };

  const fitMapToRoute = (points: Point[]) => {
    if (!map.current || points.length === 0 || !isMapReady) return;

    const bounds = new mapboxgl.LngLatBounds();
    points.forEach(point => {
      bounds.extend([point.lon, point.lat]);
    });

    map.current!.fitBounds(bounds, {
      padding: { top: 20, bottom: 20, left: 20, right: 20 },
      maxZoom: 16,
      duration: 1000,
      essential: true
    });
  };

  // Función para agregar marcador del origen (sucursal)
  const addOriginMarker = () => {
    if (!map.current || !isMapReady || !trafficOptimizedRoute) return;

    const { origin } = trafficOptimizedRoute.route_info;
    
    // Crear marcador del origen con ícono de casita
    const originMarkerId = 'origin-marker';
    const originMarkerElement = document.createElement('div');
    originMarkerElement.className = 'origin-marker';
    originMarkerElement.innerHTML = `
      <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer" style="background: ${primaryColor}">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
        </svg>
      </div>
    `;

    // Crear popup con información de la sucursal
    const popup = new mapboxgl.Popup({ 
      offset: { 
        'top': [0, 0], 
        'top-left': [0, 0], 
        'top-right': [0, 0], 
        'bottom': [0, -10], 
        'bottom-left': [0, -10], 
        'bottom-right': [0, -10], 
        'left': [10, 0], 
        'right': [-10, 0] 
      },
      closeButton: true,
      closeOnClick: false
    }).setHTML(`
      <div style="padding: 12px; min-width: 200px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="width: 16px; height: 16px; background: ${primaryColor}; border-radius: 50%; margin-right: 8px;"></div>
          <h4 style="margin: 0; color: ${colors.textPrimary}; font-weight: 600;">🏢 Sucursal</h4>
        </div>
        <p style="margin: 0 0 8px 0; color: ${colors.textSecondary}; font-weight: 500;">${origin.name}</p>
        <div style="font-size: 12px; color: ${colors.textSecondary};">
          <p style="margin: 2px 0;">📍 Coordenadas: ${origin.lat.toFixed(4)}, ${origin.lon.toFixed(4)}</p>
          <p style="margin: 2px 0;">🚚 Punto de partida y llegada</p>
        </div>
      </div>
    `);

    const originMarker = new mapboxgl.Marker(originMarkerElement)
      .setLngLat([origin.lon, origin.lat])
      .setPopup(popup)
      .addTo(map.current);
    
    (originMarker as any).id = originMarkerId;
    setAddedSources(prev => [...prev, originMarkerId]);

    console.log('📍 Marcador de origen (sucursal) agregado:', {
      origin: { lat: origin.lat, lon: origin.lon, name: origin.name }
    });
  };

  const getVisitOrderDisplay = () => {
    if (!trafficOptimizedRoute || !selectedRoute) return null;

    // Usar el visit_order específico de la ruta seleccionada
    const { visit_order } = selectedRoute;
    
    // Usar optimized_waypoints de la ruta si está disponible, sino del route_info
    const optimized_waypoints = selectedRoute.optimized_waypoints || trafficOptimizedRoute.route_info.optimized_waypoints;
    
    if (!optimized_waypoints) {
      console.warn('⚠️ No hay optimized_waypoints disponibles para mostrar el orden de visita');
      return null;
    }

    return (
      <div className="space-y-2 sm:space-y-3">
        {visit_order.map((visitItem, index) => {
          const waypoint = optimized_waypoints.find(wp => wp.name === visitItem.name);
          if (!waypoint) return null;

          const visitNumber = index + 1;
          const color = getRouteColorByIndex(index);

          return (
            <div key={index} className="flex items-center p-3 sm:p-4 rounded-xl transition-all duration-200 hover:shadow-sm" style={{ backgroundColor: colors.background3, border: `1px solid ${colors.border}` }}>
              {/* Número de orden */}
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg shadow-lg mr-2 sm:mr-3 md:mr-4"
                   style={{ backgroundColor: color }}>
                {visitNumber}
              </div>
              
              {/* Información de la parada */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold theme-text-primary text-sm sm:text-base md:text-lg mb-1">{waypoint.name}</div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm theme-text-secondary">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: colors.divider }}></span>
                    {waypoint.lat.toFixed(4)}
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: colors.divider }}></span>
                    {waypoint.lon.toFixed(4)}
                  </span>
                </div>
              </div>
              
              {/* Indicador de estado */}
              <div className="flex-shrink-0">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full animate-pulse" style={{ backgroundColor: colors.success }}></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!trafficOptimizedRoute) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No hay datos de ruta para mostrar</p>
      </div>
    );
  }



  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Mapa */}
      <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: colors.background3 }}>
        <div className="p-3 sm:p-4 md:p-6" style={{ backgroundColor: colors.background2, borderBottom: `1px solid ${colors.divider}` }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-3 lg:space-y-0">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold theme-text-primary mb-1">Mapa de Ruta Optimizada</h2>
              <p className="text-sm sm:text-base theme-text-secondary">
                Ruta {selectedRouteIndex === 0 ? 'Principal' : `Alternativa ${selectedRouteIndex}`}
              </p>
            </div>
            
            {/* Stats de la ruta seleccionada */}
            {selectedRoute && (
              <div className="flex items-center justify-center sm:justify-start lg:justify-end space-x-2 sm:space-x-3 lg:space-x-4 xl:space-x-6">
                <div className="text-center rounded-lg px-3 py-2" style={{ backgroundColor: colors.background3, border: `1px solid ${colors.border}` }}>
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold theme-text-primary">
                    {Math.round(selectedRoute.summary.total_time / 60)}
                  </div>
                  <div className="text-xs sm:text-sm theme-text-secondary font-medium">Min</div>
                </div>
                <div className="w-px h-8 sm:h-10 lg:h-12" style={{ backgroundColor: colors.divider }}></div>
                <div className="text-center rounded-lg px-3 py-2" style={{ backgroundColor: colors.background3, border: `1px solid ${colors.border}` }}>
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold theme-text-primary">
                    {(selectedRoute.summary.total_distance / 1000).toFixed(1)}
                  </div>
                  <div className="text-xs sm:text-sm theme-text-secondary font-medium">Km</div>
                </div>
                {selectedRoute.summary.traffic_delay > 0 && (
                  <>
                    <div className="w-px h-8 sm:h-10 lg:h-12" style={{ backgroundColor: colors.divider }}></div>
                    <div className="text-center rounded-lg px-3 py-2" style={{ backgroundColor: colors.background3, border: `1px solid ${colors.border}` }}>
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold" style={{ color: colors.error }}>
                        +{Math.round(selectedRoute.summary.traffic_delay / 60)}
                      </div>
                      <div className="text-xs sm:text-sm font-medium" style={{ color: colors.error }}>Min tráfico</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Selector de Rutas con Diseño Card */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold theme-text-primary mb-3 sm:mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full mr-2 sm:mr-3" style={{ backgroundColor: colors.info }}></span>
              Seleccionar Ruta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {getAvailableRoutes().map((route, index) => {
                const isSelected = index === selectedRouteIndex;
                const isPrimary = index === 0;
                const routeColor = getRouteColorByIndex(index);
                
                return (
                  <button
                    key={index}
                    onClick={() => changeRoute(index)}
                    className={`group relative transition-all duration-200 ${
                      isSelected ? 'transform scale-105' : 'hover:scale-102'
                    }`}
                  >
                    {/* Card tipo botón */}
                    <div 
                      className={`w-full p-2 rounded-xl border-2 transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 ring-offset-2 shadow-lg' 
                          : 'shadow-md hover:shadow-lg'
                      }`}
                      style={{
                        borderColor: isSelected ? colors.buttonPrimary1 : colors.border,
                        backgroundColor: isSelected ? routeColor : colors.background3,
                        color: isSelected ? 'white' : colors.textPrimary,
                      }}>
                      {/* Header del card */}
                      <div className="flex items-center justify-between mb-1">
                        <div 
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                            isSelected ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                          }`}
                          style={{
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : undefined,
                            color: isSelected ? 'white' : routeColor,
                          }}
                        >
                          {isPrimary ? 'P' : index}
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
                        )}
                      </div>
                      
                      {/* Título del card */}
                      <div className="text-center mb-1">
                        <div className={`font-semibold text-xs sm:text-sm mb-0.5 ${
                          isSelected ? 'text-white' : ''
                        }`} style={{ color: isSelected ? undefined : colors.textPrimary }}>
                          {isPrimary ? 'Principal' : `Ruta ${index}`}
                        </div>
                        <div className={`text-xs ${
                          isSelected ? 'text-white text-opacity-90' : ''
                        }`} style={{ color: isSelected ? undefined : colors.textSecondary }}>
                          {isPrimary ? 'Recomendada' : 'Alternativa'}
                        </div>
                      </div>
                      
                      {/* Información de la ruta */}
                      <div className={`space-y-0.5 text-center ${
                        isSelected ? 'text-white' : ''
                      }`} style={{ color: isSelected ? undefined : colors.textPrimary }}>
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs">⏱️</span>
                          <span className="text-xs sm:text-sm font-medium">
                            {Math.round(route.summary.total_time / 60)}m
                          </span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs">📏</span>
                          <span className="text-xs sm:text-sm font-medium">
                            {(route.summary.total_distance / 1000).toFixed(1)}k
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>


        </div>
        <div className="relative w-full h-80 sm:h-96 md:h-[450px] lg:h-[500px] xl:h-[550px] overflow-hidden rounded-lg map-container">
          <div 
            ref={mapContainer} 
            className="w-full h-80 sm:h-96 md:h-[450px] lg:h-[500px] xl:h-[550px]" 
            style={{ 
              position: 'relative', 
              overflow: 'hidden',
              cursor: 'grab',
              touchAction: 'none'
            }}
          />
          {!isMapReady && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm text-gray-600">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>
      </div>

          {/* Controles de Simulación */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold theme-text-primary mb-3 sm:mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full mr-2 sm:mr-3" style={{ backgroundColor: colors.error }}></span>
              Simulación de Recorrido
            </h3>
            
            {/* Botón de Simulación */}
            <div className="flex items-center justify-center mb-3">
              <button
                onClick={isSimulating ? stopSimulation : startSimulation}
                disabled={!selectedRoute}
                className={`px-6 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 flex items-center space-x-2 ${
                  isSimulating
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                } ${
                  !selectedRoute ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
              >
                {isSimulating ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Detener Simulación</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <span>Iniciar Simulación</span>
                  </>
                )}
              </button>
            </div>

            {/* Controles de velocidad */}
            {isSimulating && (
              <div className="flex items-center justify-center space-x-4 mb-3">
                <button
                  onClick={decreaseSpeed}
                  className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-sm border border-gray-200 hover:border-gray-300"
                  title="Velocidad más lenta"
                >
                  Más lento
                </button>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-2 text-center shadow-sm">
                  <div className="text-lg font-bold text-blue-700">{simulationSpeed}x</div>
                  <div className="text-xs text-blue-600">Velocidad</div>
                </div>
                
                <button
                  onClick={increaseSpeed}
                  className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-sm border border-gray-200 hover:border-gray-300"
                  title="Velocidad más rápida"
                >
                  Más rápido
                </button>
              </div>
            )}

            {/* Barra de Progreso */}
            {isSimulating && (
              <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: colors.background3, border: `1px solid ${colors.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium theme-text-primary">Progreso del recorrido</span>
                  <span className="text-sm font-bold theme-text-primary">
                    {Math.round(simulationProgress * 100)}%
                  </span>
                </div>
                <div className="w-full rounded-full h-3" style={{ backgroundColor: colors.background2 }}>
                  <div 
                    className="h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${simulationProgress * 100}%`, background: colors.success }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs theme-text-secondary mt-1">
                  <span>Inicio</span>
                  <span>Final</span>
                </div>
              </div>
            )}
          </div>
      {/* Orden de visita con diseño moderno */}
      <div className="rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: colors.background3 }}>
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4" style={{ backgroundColor: colors.background2, borderBottom: `1px solid ${colors.divider}` }}>
          <h3 className="text-base sm:text-lg font-semibold theme-text-primary flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full mr-2 sm:mr-3" style={{ backgroundColor: colors.info }}></span>
              Orden de Visita de la Ruta {selectedRouteIndex === 0 ? 'Principal' : `Alternativa ${selectedRouteIndex}`}
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full self-start sm:self-auto sm:ml-auto" style={{ backgroundColor: colors.background1, color: colors.textPrimary, border: `1px solid ${colors.border}` }}>
              {selectedRoute?.visit_order.length || 0} paradas
            </span>
          </h3>
          <p className="text-xs sm:text-sm theme-text-secondary mt-2">
            🎯 Mostrando el orden específico de la ruta seleccionada
          </p>
        </div>
        
        <div className="p-3 sm:p-4 md:p-6">
          {getVisitOrderDisplay()}
        </div>
      </div>


    </div>
  );
};

export default TrafficOptimizedRouteMap;
