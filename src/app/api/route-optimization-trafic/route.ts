import { NextRequest, NextResponse } from 'next/server';
import { filterOrdersWithValidCoordinates, validateAndCleanCoordinate } from '@/lib/coordinate-utils';

interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

interface Order {
  id: string;
  order_number: string;
  delivery_location: {
    lat: number;
    lng: number;
    address: string;
  };
  description?: string;
  total_amount: number;
}

interface TomTomOptimizationRequest {
  pickup_location: PickupLocation;
  orders: Order[];
}

interface TomTomOptimizationResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000';

/**
 * POST /api/route-optimization-trafic
 * Envía una solicitud de optimización de rutas a tu FastAPI con TomTom
 */
export async function POST(request: NextRequest): Promise<NextResponse<TomTomOptimizationResponse>> {
  try {
    const body: TomTomOptimizationRequest = await request.json();

    // Validar el cuerpo de la solicitud
    if (!body.pickup_location || !body.orders || body.orders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de optimización incompletos. Se requieren pickup_location y orders',
        },
        { status: 400 }
      );
    }

    // Validar que haya al menos 2 pedidos para optimización
    if (body.orders.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requieren al menos 2 pedidos para optimizar la ruta',
        },
        { status: 400 }
      );
    }

    // Validar coordenadas de pickup_location
    const pickupValidation = validateAndCleanCoordinate(
      body.pickup_location.lat,
      body.pickup_location.lng
    );
    
    if (!pickupValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coordenadas de pickup_location inválidas',
          details: {
            error: pickupValidation.error,
            coordinates: {
              lat: body.pickup_location.lat,
              lng: body.pickup_location.lng
            }
          }
        },
        { status: 400 }
      );
    }
    
    // Actualizar con coordenadas limpias
    if (pickupValidation.cleanedCoordinate) {
      body.pickup_location.lat = pickupValidation.cleanedCoordinate.lat;
      body.pickup_location.lng = pickupValidation.cleanedCoordinate.lng;
    }

    // Validar y limpiar coordenadas de todos los pedidos
    console.log('Validando coordenadas de pedidos:', body.orders.length);
    
    const { validOrders, invalidOrders } = filterOrdersWithValidCoordinates(body.orders);
    
    if (invalidOrders.length > 0) {
      console.error('Pedidos con coordenadas inválidas:', invalidOrders);
      
      const errorDetails = invalidOrders.map(({ order, error }) => ({
        order_id: order.id,
        order_number: order.order_number,
        error,
        coordinates: {
          lat: order.delivery_location.lat,
          lng: order.delivery_location.lng
        }
      }));
      
      return NextResponse.json(
        {
          success: false,
          error: `${invalidOrders.length} pedido(s) tienen coordenadas inválidas`,
          details: errorDetails
        },
        { status: 400 }
      );
    }
    
    if (validOrders.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requieren al menos 2 pedidos con coordenadas válidas para optimizar la ruta',
          details: {
            total_orders: body.orders.length,
            valid_orders: validOrders.length,
            invalid_orders: invalidOrders.length
          }
        },
        { status: 400 }
      );
    }
    
    console.log(`✅ ${validOrders.length} pedidos con coordenadas válidas`);
    
    // Usar los pedidos validados
    const validatedBody = {
      ...body,
      orders: validOrders
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

    const apiUrl = `${FASTAPI_BASE_URL}/api/v1/routes/optimize-tomtom`;
    console.log('Intentando conectar a:', apiUrl);
    console.log('Datos a enviar:', JSON.stringify(validatedBody, null, 2));

    // Enviar solicitud a tu FastAPI
    const fastApiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedBody),
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
      message: 'Ruta optimizada exitosamente con TomTom',
    });

  } catch (error) {
    console.error('Error en la API de optimización con TomTom:', error);
    
    // Manejar errores de conexión específicamente
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        return NextResponse.json(
          {
            success: false,
            error: 'No se puede conectar al servidor FastAPI',
            details: {
              message: 'Verifica que tu FastAPI esté ejecutándose en el puerto 8000',
              url: `${FASTAPI_BASE_URL}/api/v1/routes/optimize-tomtom`,
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


