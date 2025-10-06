import { NextRequest, NextResponse } from 'next/server';
import { validateAndCleanCoordinate } from '@/lib/coordinate-utils';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000';

interface RoutePoint {
  lat: number;
  lon: number;
  name: string;
  traffic_delay: number;
  speed: number;
  congestion_level: string;
  waypoint_index: number | null;
}

interface Waypoint {
  lat: number;
  lon: number;
  name: string;
}

interface Order {
  order_uuid: string;
  order_number: string;
  description: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_lat: number;
  delivery_lng: number;
  total_amount: number;
  details: string;
  created_at: string;
  updated_at: string;
  sequence_order: number;
}

interface TrafficCondition {
  road_conditions: string;
  general_congestion: string;
}

interface RouteData {
  id: number;
  uuid: string;
  organization_id: number;
  route_name: string;
  description: string;
  origin_lat: number;
  origin_lon: number;
  origin_name: string;
  destination_lat: number;
  destination_lon: number;
  destination_name: string;
  waypoints: Waypoint[];
  route_points: RoutePoint[];
  orders: Order[];
  traffic_condition: TrafficCondition;
  traffic_delay: number;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface RouteResponse {
  success: boolean;
  data?: RouteData;
  message?: string;
  error?: string;
}

/**
 * GET /api/routes/[uuid]
 * Obtiene una ruta específica por UUID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
): Promise<NextResponse<RouteResponse>> {
  try {
    const { uuid } = params;

    // Validar UUID
    if (!uuid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Route UUID is required'
        },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching route with UUID:', uuid);

    // Llamar a FastAPI para obtener la ruta
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/routes/${uuid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: 'Route not found'
          },
          { status: 404 }
        );
      }

      const errorText = await response.text();
      console.error('❌ Error from FastAPI:', response.status, errorText);
      
      return NextResponse.json(
        {
          success: false,
          error: `Failed to get route: ${response.status} - ${errorText}`
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Route retrieved successfully');

    // Validar y limpiar coordenadas si es necesario
    if (result.data) {
      // Validar coordenadas de origen
      if (result.data.origin_lat && result.data.origin_lon) {
        const originValidation = validateAndCleanCoordinate(
          result.data.origin_lat, 
          result.data.origin_lon
        );
        if (originValidation.isValid && originValidation.cleanedCoordinate) {
          result.data.origin_lat = originValidation.cleanedCoordinate.lat;
          result.data.origin_lon = originValidation.cleanedCoordinate.lng;
        }
      }

      // Validar coordenadas de destino
      if (result.data.destination_lat && result.data.destination_lon) {
        const destinationValidation = validateAndCleanCoordinate(
          result.data.destination_lat, 
          result.data.destination_lon
        );
        if (destinationValidation.isValid && destinationValidation.cleanedCoordinate) {
          result.data.destination_lat = destinationValidation.cleanedCoordinate.lat;
          result.data.destination_lon = destinationValidation.cleanedCoordinate.lng;
        }
      }

      // Validar waypoints
      if (result.data.waypoints && Array.isArray(result.data.waypoints)) {
        result.data.waypoints = result.data.waypoints.map((waypoint: Waypoint) => {
          const validation = validateAndCleanCoordinate(waypoint.lat, waypoint.lon);
          if (validation.isValid && validation.cleanedCoordinate) {
            return {
              ...waypoint,
              lat: validation.cleanedCoordinate.lat,
              lon: validation.cleanedCoordinate.lng
            };
          }
          return waypoint;
        });
      }

      // Validar route_points
      if (result.data.route_points && Array.isArray(result.data.route_points)) {
        result.data.route_points = result.data.route_points.map((point: RoutePoint) => {
          const validation = validateAndCleanCoordinate(point.lat, point.lon);
          if (validation.isValid && validation.cleanedCoordinate) {
            return {
              ...point,
              lat: validation.cleanedCoordinate.lat,
              lon: validation.cleanedCoordinate.lng
            };
          }
          return point;
        });
      }

      // Validar coordenadas de pedidos
      if (result.data.orders && Array.isArray(result.data.orders)) {
        result.data.orders = result.data.orders.map((order: Order) => {
          // Validar pickup coordinates
          if (order.pickup_lat && order.pickup_lng) {
            const pickupValidation = validateAndCleanCoordinate(order.pickup_lat, order.pickup_lng);
            if (pickupValidation.isValid && pickupValidation.cleanedCoordinate) {
              order.pickup_lat = pickupValidation.cleanedCoordinate.lat;
              order.pickup_lng = pickupValidation.cleanedCoordinate.lng;
            }
          }

          // Validar delivery coordinates
          if (order.delivery_lat && order.delivery_lng) {
            const deliveryValidation = validateAndCleanCoordinate(order.delivery_lat, order.delivery_lng);
            if (deliveryValidation.isValid && deliveryValidation.cleanedCoordinate) {
              order.delivery_lat = deliveryValidation.cleanedCoordinate.lat;
              order.delivery_lng = deliveryValidation.cleanedCoordinate.lng;
            }
          }

          return order;
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Route retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting route:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get route'
      },
      { status: 500 }
    );
  }
}
