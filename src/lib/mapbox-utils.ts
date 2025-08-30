import {
  MapboxOptimizationRequest,
  MapboxLocation,
  MapboxVehicle,
  MapboxService,
  MapboxShipment,
} from '@/types';

/**
 * Valida que una solicitud de optimización sea válida
 */
export function validateOptimizationRequest(request: MapboxOptimizationRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validar versión
  if (request.version !== 1) {
    errors.push('La versión debe ser 1');
  }

  // Validar locations
  if (!request.locations || request.locations.length === 0) {
    errors.push('Se requieren al menos una ubicación');
  } else {
    request.locations.forEach((location, index) => {
      if (!location.name || location.name.trim() === '') {
        errors.push(`La ubicación ${index} debe tener un nombre válido`);
      }
      if (!location.coordinates || location.coordinates.length !== 2) {
        errors.push(`La ubicación ${index} debe tener coordenadas válidas [longitud, latitud]`);
      }
      if (location.coordinates && (location.coordinates[0] < -180 || location.coordinates[0] > 180)) {
        errors.push(`La longitud de la ubicación ${index} debe estar entre -180 y 180`);
      }
      if (location.coordinates && (location.coordinates[1] < -90 || location.coordinates[1] > 90)) {
        errors.push(`La latitud de la ubicación ${index} debe estar entre -90 y 90`);
      }
    });
  }

  // Validar vehicles
  if (!request.vehicles || request.vehicles.length === 0) {
    errors.push('Se requiere al menos un vehículo');
  } else {
    request.vehicles.forEach((vehicle, index) => {
      if (!vehicle.name || vehicle.name.trim() === '') {
        errors.push(`El vehículo ${index} debe tener un nombre válido`);
      }
      if (vehicle.routing_profile && !['mapbox/driving', 'mapbox/driving-traffic', 'mapbox/cycling', 'mapbox/walking'].includes(vehicle.routing_profile)) {
        errors.push(`El perfil de enrutamiento del vehículo ${index} no es válido`);
      }
      if (vehicle.loading_policy && !['any', 'fifo', 'lifo'].includes(vehicle.loading_policy)) {
        errors.push(`La política de carga del vehículo ${index} no es válida`);
      }
    });
  }

  // Validar que al menos services o shipments estén presentes
  if ((!request.services || request.services.length === 0) && (!request.shipments || request.shipments.length === 0)) {
    errors.push('Se requiere al menos un servicio o envío');
  }

  // Validar services si están presentes
  if (request.services) {
    request.services.forEach((service, index) => {
      if (!service.name || service.name.trim() === '') {
        errors.push(`El servicio ${index} debe tener un nombre válido`);
      }
      if (!service.location || service.location.trim() === '') {
        errors.push(`El servicio ${index} debe tener una ubicación válida`);
      }
      if (service.duration !== undefined && service.duration < 0) {
        errors.push(`La duración del servicio ${index} no puede ser negativa`);
      }
    });
  }

  // Validar shipments si están presentes
  if (request.shipments) {
    request.shipments.forEach((shipment, index) => {
      if (!shipment.name || shipment.name.trim() === '') {
        errors.push(`El envío ${index} debe tener un nombre válido`);
      }
      if (!shipment.from || shipment.from.trim() === '') {
        errors.push(`El envío ${index} debe tener una ubicación de origen válida`);
      }
      if (!shipment.to || shipment.to.trim() === '') {
        errors.push(`El envío ${index} debe tener una ubicación de destino válida`);
      }
      if (shipment.pickup_duration !== undefined && shipment.pickup_duration < 0) {
        errors.push(`La duración de recogida del envío ${index} no puede ser negativa`);
      }
      if (shipment.dropoff_duration !== undefined && shipment.dropoff_duration < 0) {
        errors.push(`La duración de entrega del envío ${index} no puede ser negativa`);
      }
    });
  }

  // Validar referencias de ubicación
  const locationNames = request.locations.map(loc => loc.name);
  const allReferencedLocations = new Set<string>();

  if (request.services) {
    request.services.forEach(service => allReferencedLocations.add(service.location));
  }

  if (request.shipments) {
    request.shipments.forEach(shipment => {
      allReferencedLocations.add(shipment.from);
      allReferencedLocations.add(shipment.to);
    });
  }

  if (request.vehicles) {
    request.vehicles.forEach(vehicle => {
      if (vehicle.start_location) allReferencedLocations.add(vehicle.start_location);
      if (vehicle.end_location) allReferencedLocations.add(vehicle.end_location);
    });
  }

  const missingLocations = Array.from(allReferencedLocations).filter(
    loc => !locationNames.includes(loc)
  );

  if (missingLocations.length > 0) {
    errors.push(`Ubicaciones referenciadas no encontradas: ${missingLocations.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Crea un ejemplo de solicitud de optimización básica
 */
export function createExampleOptimizationRequest(): MapboxOptimizationRequest {
  return {
    version: 1,
    locations: [
      {
        name: "warehouse",
        coordinates: [-122.4194, 37.7749] // San Francisco
      },
      {
        name: "stop-1",
        coordinates: [-122.4000, 37.7800]
      },
      {
        name: "stop-2",
        coordinates: [-122.4100, 37.7900]
      },
      {
        name: "stop-3",
        coordinates: [-122.4300, 37.7700]
      }
    ],
    vehicles: [
      {
        name: "truck-1",
        routing_profile: "mapbox/driving",
        start_location: "warehouse",
        end_location: "warehouse",
        capacities: {
          volume: 3000,
          weight: 1000,
          boxes: 100
        },
        capabilities: ["refrigeration"],
        earliest_start: "2024-01-01T09:00:00Z",
        latest_end: "2024-01-01T17:00:00Z"
      }
    ],
    services: [
      {
        name: "service-1",
        location: "stop-1",
        duration: 300,
        requirements: ["refrigeration"]
      },
      {
        name: "service-2",
        location: "stop-2",
        duration: 300
      },
      {
        name: "service-3",
        location: "stop-3",
        duration: 300
      }
    ],
    options: {
      objectives: ["min-schedule-completion-time"]
    }
  };
}

/**
 * Formatea coordenadas para mostrar en formato legible
 */
export function formatCoordinates(coordinates: [number, number]): string {
  const [lng, lat] = coordinates;
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Calcula la distancia aproximada entre dos puntos usando la fórmula de Haversine
 */
export function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convierte segundos a formato legible (HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convierte metros a formato legible
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}
