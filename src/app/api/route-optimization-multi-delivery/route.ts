import { NextRequest, NextResponse } from 'next/server';
import { validateAndCleanCoordinate } from '@/lib/coordinate-utils';
import { config } from '@/lib/config';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface DeliveryOrder {
  id: string;
  order_number: string;
  origin: Location;
  destination: Location;
  description: string;
  total_amount: number;
  priority: number;
  estimated_pickup_time: number;
  estimated_delivery_time: number;
}

interface MultiDeliveryOptimizationRequest {
  driver_start_location: Location;
  driver_end_location: Location;
  delivery_orders: DeliveryOrder[];
  include_traffic: boolean;
  departure_time: string;
  travel_mode: string;
  route_type: string;
  max_orders_per_trip: number;
  force_return_to_end: boolean;
  max_return_distance: number;
}

interface MultiDeliveryOptimizationResponse {
  success: boolean;
  optimized_route?: {
    total_distance: number;
    total_time: number;
    total_traffic_delay: number;
    stops: Array<{
      stop_number: number;
      stop_type: 'start' | 'pickup' | 'delivery' | 'end';
      order: DeliveryOrder | null;
      location: Location;
      distance_from_previous: number;
      cumulative_distance: number;
      estimated_time: number;
      cumulative_time: number;
      traffic_delay: number;
    }>;
    orders_delivered: number;
    optimization_metrics: {
      algorithm: string;
      locations_optimized: number;
      traffic_enabled: boolean;
      orders_processed: number;
    };
    route_efficiency: number;
  };
  processing_time?: number;
  traffic_conditions?: {
    overall_congestion: string;
    total_traffic_delay: number;
    traffic_enabled: boolean;
  };
  error?: string;
}

/**
 * POST /api/route-optimization-multi-delivery
 * Optimiza rutas para entregas multi-punto con inicio y fin personalizados
 */
export async function POST(request: NextRequest): Promise<NextResponse<MultiDeliveryOptimizationResponse>> {
  try {
    const body: MultiDeliveryOptimizationRequest = await request.json();

    console.log('🚀 API received request body:', JSON.stringify(body, null, 2));
    console.log('🔍 driver_start_location:', body.driver_start_location);
    console.log('🔍 driver_end_location:', body.driver_end_location);
    console.log('🔍 delivery_orders count:', body.delivery_orders?.length);

    // Validar datos requeridos
    if (!body.driver_start_location || !body.driver_end_location || !body.delivery_orders) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requieren driver_start_location, driver_end_location y delivery_orders'
        },
        { status: 400 }
      );
    }

    // Validar que haya al menos 1 pedido
    if (!Array.isArray(body.delivery_orders) || body.delivery_orders.length < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere al menos 1 pedido de entrega'
        },
        { status: 400 }
      );
    }

    // Validar coordenadas de inicio
    const startValidation = validateAndCleanCoordinate(
      body.driver_start_location.lat, 
      body.driver_start_location.lng
    );
    if (!startValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Coordenadas de inicio inválidas: ${startValidation.error}`
        },
        { status: 400 }
      );
    }

    // Validar coordenadas de fin
    const endValidation = validateAndCleanCoordinate(
      body.driver_end_location.lat, 
      body.driver_end_location.lng
    );
    if (!endValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Coordenadas de fin inválidas: ${endValidation.error}`
        },
        { status: 400 }
      );
    }

    // Validar pedidos
    for (let i = 0; i < body.delivery_orders.length; i++) {
      const order = body.delivery_orders[i];
      
      if (!order.id || !order.order_number || !order.origin || !order.destination) {
        return NextResponse.json(
          {
            success: false,
            error: `Pedido ${i + 1} inválido: faltan campos requeridos`
          },
          { status: 400 }
        );
      }

      // Validar coordenadas de origen del pedido
      const originValidation = validateAndCleanCoordinate(order.origin.lat, order.origin.lng);
      if (!originValidation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error: `Coordenadas de origen del pedido ${order.order_number} inválidas: ${originValidation.error}`
          },
          { status: 400 }
        );
      }

      // Validar coordenadas de destino del pedido
      const destinationValidation = validateAndCleanCoordinate(order.destination.lat, order.destination.lng);
      if (!destinationValidation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error: `Coordenadas de destino del pedido ${order.order_number} inválidas: ${destinationValidation.error}`
          },
          { status: 400 }
        );
      }
    }

    const fastApiData = {
      driver_start_location: {
        lat: startValidation.cleanedCoordinate?.lat || 0,
        lng: startValidation.cleanedCoordinate?.lng || 0,
        address: body.driver_start_location.address
      },
      delivery_orders: body.delivery_orders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        origin: {
          lat: validateAndCleanCoordinate(order.origin.lat, order.origin.lng).cleanedCoordinate?.lat || 0,
          lng: validateAndCleanCoordinate(order.origin.lat, order.origin.lng).cleanedCoordinate?.lng || 0,
          address: order.origin.address
        },
        destination: {
          lat: validateAndCleanCoordinate(order.destination.lat, order.destination.lng).cleanedCoordinate?.lat || 0,
          lng: validateAndCleanCoordinate(order.destination.lat, order.destination.lng).cleanedCoordinate?.lng || 0,
          address: order.destination.address
        },
        description: order.description || '',
        total_amount: order.total_amount || 0,
        priority: order.priority || 1,
        estimated_pickup_time: order.estimated_pickup_time || 5,
        estimated_delivery_time: order.estimated_delivery_time || 3
      })),
      include_traffic: body.include_traffic !== undefined ? body.include_traffic : true,
      departure_time: body.departure_time || 'now',
      travel_mode: body.travel_mode || 'car',
      route_type: body.route_type || 'fastest',
      max_orders_per_trip: body.max_orders_per_trip || 10,
      force_return_to_end: false,
      max_return_distance: 600.
    };

   console.log('🚀 Enviando solicitud de optimización multi-delivery a FastAPI');
   console.log('📍 Ubicación de inicio:', fastApiData);
    // Llamar a FastAPI
    const response = await fetch(`${config.api.fastapi}/api/v1/routes/optimize-multi-delivery`, {
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
          error: `Error del servidor de optimización: ${response.status} - ${errorText}`
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Optimización multi-delivery exitosa');

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error en optimización multi-delivery:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
