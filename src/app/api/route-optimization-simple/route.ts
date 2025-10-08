import { NextRequest, NextResponse } from 'next/server';
import { validateAndCleanCoordinate } from '@/lib/coordinate-utils';
import { config } from '@/lib/config';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface SimpleRouteRequest {
  pickup: Location;
  delivery: Location;
}

interface RoutePoint {
  lat: number;
  lng: number;
  sequence: number;
  distance_from_previous: number;
  point_type: 'start' | 'waypoint' | 'end';
}

interface SimpleRouteResponse {
  success: boolean;
  distance?: number;
  estimated_time?: number;
  pickup?: Location;
  delivery?: Location;
  route_points?: RoutePoint[];
  total_points?: number;
  processing_time?: number;
  error?: string;
}

/**
 * POST /api/route-optimization-simple
 * Calcula ruta simple entre dos puntos con secuencia de puntos GPS
 */
export async function POST(request: NextRequest): Promise<NextResponse<SimpleRouteResponse>> {
  try {
    const body: SimpleRouteRequest = await request.json();

    console.log('🚀 API received simple route request:', JSON.stringify(body, null, 2));

    // Validar datos requeridos
    if (!body.pickup || !body.delivery) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requieren pickup y delivery'
        },
        { status: 400 }
      );
    }

    // Validar coordenadas de pickup
    const pickupValidation = validateAndCleanCoordinate(
      body.pickup.lat, 
      body.pickup.lng
    );
    if (!pickupValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Coordenadas de pickup inválidas: ${pickupValidation.error}`
        },
        { status: 400 }
      );
    }

    // Validar coordenadas de delivery
    const deliveryValidation = validateAndCleanCoordinate(
      body.delivery.lat, 
      body.delivery.lng
    );
    if (!deliveryValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Coordenadas de delivery inválidas: ${deliveryValidation.error}`
        },
        { status: 400 }
      );
    }

    const fastApiData = {
      pickup: {
        lat: pickupValidation.cleanedCoordinate?.lat || 0,
        lng: pickupValidation.cleanedCoordinate?.lng || 0,
        name: body.pickup.name || 'Punto de Origen'
      },
      delivery: {
        lat: deliveryValidation.cleanedCoordinate?.lat || 0,
        lng: deliveryValidation.cleanedCoordinate?.lng || 0,
        name: body.delivery.name || 'Punto de Destino'
      }
    };

    console.log('🚀 Enviando solicitud de ruta simple a FastAPI');
    console.log('📍 Pickup:', fastApiData.pickup);
    console.log('📍 Delivery:', fastApiData.delivery);

    // Llamar a FastAPI
    const response = await fetch(`${config.api.fastapi}/api/v1/routes/simple-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fastApiData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de FastAPI:', response.status, errorText);
      
      return NextResponse.json(
        {
          success: false,
          error: `Error del servidor de rutas: ${response.status} - ${errorText}`
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Ruta simple calculada exitosamente');
    console.log('📍 Total puntos:', result.total_points);
    console.log('📍 Distancia:', result.distance, 'km');
    console.log('📍 Tiempo estimado:', result.estimated_time, 'min');

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error en cálculo de ruta simple:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
