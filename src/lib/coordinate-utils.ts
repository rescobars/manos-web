/**
 * Utilidades para validar y limpiar coordenadas geográficas
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface CoordinateValidationResult {
  isValid: boolean;
  error?: string;
  cleanedCoordinate?: Coordinate;
}

/**
 * Valida que una coordenada sea válida
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  // Verificar que sean números
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  
  // Verificar que no sean NaN o Infinity
  if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
    return false;
  }
  
  // Verificar rangos válidos
  if (lat < -90 || lat > 90) {
    return false;
  }
  
  if (lng < -180 || lng > 180) {
    return false;
  }
  
  return true;
}

/**
 * Valida y limpia una coordenada
 */
export function validateAndCleanCoordinate(lat: any, lng: any): CoordinateValidationResult {
  // Verificar que existan
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return {
      isValid: false,
      error: 'Coordenadas no definidas'
    };
  }
  
  // Convertir a números si son strings
  let numLat: number;
  let numLng: number;
  
  if (typeof lat === 'string') {
    numLat = parseFloat(lat);
  } else if (typeof lat === 'number') {
    numLat = lat;
  } else {
    return {
      isValid: false,
      error: 'Latitud debe ser un número o string numérico'
    };
  }
  
  if (typeof lng === 'string') {
    numLng = parseFloat(lng);
  } else if (typeof lng === 'number') {
    numLng = lng;
  } else {
    return {
      isValid: false,
      error: 'Longitud debe ser un número o string numérico'
    };
  }
  
  // Verificar que la conversión fue exitosa
  if (isNaN(numLat) || isNaN(numLng)) {
    return {
      isValid: false,
      error: 'Coordenadas no son números válidos'
    };
  }
  
  // Verificar rangos
  if (numLat < -90 || numLat > 90) {
    return {
      isValid: false,
      error: `Latitud ${numLat} está fuera del rango válido (-90 a 90)`
    };
  }
  
  if (numLng < -180 || numLng > 180) {
    return {
      isValid: false,
      error: `Longitud ${numLng} está fuera del rango válido (-180 a 180)`
    };
  }
  
  // Redondear a 6 decimales para evitar problemas de precisión
  const cleanedLat = Math.round(numLat * 1000000) / 1000000;
  const cleanedLng = Math.round(numLng * 1000000) / 1000000;
  
  return {
    isValid: true,
    cleanedCoordinate: {
      lat: cleanedLat,
      lng: cleanedLng
    }
  };
}

/**
 * Filtra pedidos con coordenadas válidas
 */
export function filterOrdersWithValidCoordinates<T extends { delivery_location: { lat: any; lng: any } }>(
  orders: T[]
): { validOrders: T[]; invalidOrders: Array<{ order: T; error: string }> } {
  const validOrders: T[] = [];
  const invalidOrders: Array<{ order: T; error: string }> = [];
  
  for (const order of orders) {
    const validation = validateAndCleanCoordinate(
      order.delivery_location.lat,
      order.delivery_location.lng
    );
    
    if (validation.isValid && validation.cleanedCoordinate) {
      // Actualizar las coordenadas con las versiones limpias
      order.delivery_location.lat = validation.cleanedCoordinate.lat;
      order.delivery_location.lng = validation.cleanedCoordinate.lng;
      validOrders.push(order);
    } else {
      invalidOrders.push({
        order,
        error: validation.error || 'Coordenada inválida'
      });
    }
  }
  
  return { validOrders, invalidOrders };
}

/**
 * Formatea coordenadas para mostrar
 */
export function formatCoordinate(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Calcula la distancia aproximada entre dos coordenadas (fórmula de Haversine)
 */
export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
