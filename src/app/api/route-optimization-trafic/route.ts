import { NextRequest, NextResponse } from 'next/server';
import { validateAndCleanCoordinate } from '@/lib/coordinate-utils';
import { 
  Point, 
  VisitOrderItem, 
  TrafficOptimizationRequest, 
  RouteSummary, 
  RoutePoint, 
  Route, 
  TrafficOptimizationResponse 
} from '@/types/traffic-optimization';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000';

/**
 * POST /api/route-optimization-trafic
 * Envía una solicitud de optimización de rutas con tráfico a tu FastAPI
 */
export async function POST(request: NextRequest): Promise<NextResponse<TrafficOptimizationResponse>> {
  try {
    const body: TrafficOptimizationRequest = await request.json();

    // Validar el cuerpo de la solicitud
    if (!body.origin || !body.destination || !body.waypoints || !Array.isArray(body.waypoints)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requieren origin, destination y waypoints para optimizar la ruta',
        },
        { status: 400 }
      );
    }

    // Validar que haya al menos 1 waypoint para optimización
    if (body.waypoints.length < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere al menos 1 waypoint para optimizar la ruta',
        },
        { status: 400 }
      );
    }

    // Validar coordenadas de origin
    const originValidation = validateAndCleanCoordinate(body.origin.lat, body.origin.lon);
    if (!originValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coordenadas de origin inválidas',
          details: {
            error: originValidation.error,
            coordinates: {
              lat: body.origin.lat,
              lon: body.origin.lon
            }
          }
        },
        { status: 400 }
      );
    }

    // Validar coordenadas de destination
    const destinationValidation = validateAndCleanCoordinate(body.destination.lat, body.destination.lon);
    if (!destinationValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coordenadas de destination inválidas',
          details: {
            error: destinationValidation.error,
            coordinates: {
              lat: body.destination.lat,
              lon: body.destination.lon
            }
          }
        },
        { status: 400 }
      );
    }

    // Validar coordenadas de todos los waypoints
    const validatedWaypoints: Point[] = [];
    const invalidWaypoints: { waypoint: Point; error: string }[] = [];

    for (const waypoint of body.waypoints) {
      const validation = validateAndCleanCoordinate(waypoint.lat, waypoint.lon);
      
      if (!validation.isValid) {
        invalidWaypoints.push({
          waypoint,
          error: validation.error || 'Coordenadas inválidas'
        });
      } else if (validation.cleanedCoordinate) {
        validatedWaypoints.push({
          lat: validation.cleanedCoordinate.lat,
          lon: validation.cleanedCoordinate.lng,
          name: waypoint.name
        });
      } else {
        validatedWaypoints.push(waypoint);
      }
    }

    if (invalidWaypoints.length > 0) {
      console.error('Waypoints con coordenadas inválidas:', invalidWaypoints);
      
      const errorDetails = invalidWaypoints.map(({ waypoint, error }) => ({
        coordinates: {
          lat: waypoint.lat,
          lon: waypoint.lon
        },
        name: waypoint.name,
        error
      }));
      
      return NextResponse.json(
        {
          success: false,
          error: `${invalidWaypoints.length} waypoint(s) tienen coordenadas inválidas`,
          details: errorDetails
        },
        { status: 400 }
      );
    }

    console.log(`✅ ${validatedWaypoints.length} waypoints con coordenadas válidas`);
    console.log("**Queu mode", body.queue_mode)

    // Preparar el cuerpo de la solicitud para FastAPI
    const requestBody = {
      origin: {
        lat: originValidation.cleanedCoordinate?.lat || body.origin.lat,
        lon: originValidation.cleanedCoordinate?.lng || body.origin.lon,
        name: body.origin.name
      },
      destination: {
        lat: destinationValidation.cleanedCoordinate?.lat || body.destination.lat,
        lon: destinationValidation.cleanedCoordinate?.lng || body.destination.lon,
        name: body.destination.name
      },
      queue_mode: body.queue_mode !== undefined ? body.queue_mode : false,
      waypoints: validatedWaypoints,
      alternatives: body.alternatives !== undefined ? body.alternatives : true
    };

    // Verificar que la URL base esté configurada correctamente
    if (!FASTAPI_BASE_URL) {
      console.error('FASTAPI_BASE_URL no está configurado');
      return NextResponse.json(
        {
          success: false,
          error: 'Configuración de FastAPI no disponible',
          details: {
            message: 'FASTAPI_BASE_URL no está configurado en las variables de entorno'
          }
        },
        { status: 500 }
      );
    }

    const apiUrl = `${FASTAPI_BASE_URL}/api/v1/routes/traffic/optimize-route`;
    console.log('Intentando conectar a:', apiUrl);
    console.log('Datos a enviar:', JSON.stringify(requestBody, null, 2));

    // Enviar solicitud a tu FastAPI
    const fastApiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!fastApiResponse.ok) {
      const errorData = await fastApiResponse.json().catch(() => ({}));
      console.error('Error de FastAPI:', fastApiResponse.status, errorData);
      
      return NextResponse.json(
        {
          success: false,
          error: `Error de FastAPI: ${fastApiResponse.status} - ${errorData.detail || errorData.message || 'Error desconocido'}`,
        },
        { status: fastApiResponse.status }
      );
    }

    const optimizationResult = await fastApiResponse.json();

    return NextResponse.json({
      success: true,
      data: optimizationResult,
      message: 'Ruta optimizada exitosamente con tráfico en tiempo real',
    });

  } catch (error) {
    console.error('Error en la API de optimización con tráfico:', error);
    
    // Manejar errores de conexión específicamente
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        return NextResponse.json(
          {
            success: false,
            error: 'No se puede conectar al servidor FastAPI',
            details: {
              message: 'Verifica que tu FastAPI esté ejecutándose en el puerto 8000',
              url: `${FASTAPI_BASE_URL}/api/v1/routes/traffic/optimize-route`,
              error: error.message
            }
          },
          { status: 503 }
        );
      }
      
      if (error.message.includes('ENOTFOUND')) {
        return NextResponse.json(
          {
            success: false,
            error: 'URL del FastAPI no encontrada',
            details: {
              message: 'Verifica que FASTAPI_BASE_URL esté configurado correctamente',
              url: FASTAPI_BASE_URL,
              error: error.message
            }
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: {
          message: error instanceof Error ? error.message : 'Error desconocido'
        }
      },
      { status: 500 }
    );
  }
}


