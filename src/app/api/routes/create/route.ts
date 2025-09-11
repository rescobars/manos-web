import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extraer los datos de la ruta optimizada
    const {
      routeData, // TrafficOptimizationData del hook
      selectedOrders, // Array de UUIDs de pedidos seleccionados
      organizationId, // UUID de la organización
      routeName, // Nombre opcional para la ruta
      description, // Descripción opcional
      selectedRouteIndex // Índice de la ruta seleccionada (0 = primary, 1+ = alternativas)
    } = body;

    // Validar datos requeridos
    if (!routeData || !selectedOrders || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos: routeData, selectedOrders, organizationId'
      }, { status: 400 });
    }

    // Obtener la ruta seleccionada (primary o alternativa)
    const selectedRoute = selectedRouteIndex === 0 || !selectedRouteIndex 
      ? routeData.primary_route 
      : routeData.alternative_routes[selectedRouteIndex - 1];

    // Preparar el payload para el backend con solo los campos requeridos
    const payload = {
      // 1. organization_id
      organization_id: organizationId,
      
      // 2. route_name
      route_name: routeName || `Ruta Optimizada ${new Date().toLocaleDateString()}`,
      
      // 3. description
      description: description || 'Ruta optimizada con tráfico en tiempo real',
      
      // 4. origin
      origin: routeData.route_info.origin,
      
      // 5. destination
      destination: routeData.route_info.destination,
      
      // 6. waypoints
      waypoints: routeData.route_info.waypoints,
      
      // 7. route - array de coordenadas de toda la ruta seleccionada
      route: selectedRoute.points,
      
      // 8. ordered_waypoints - pedidos con UUID y orden de entrega del backend
      ordered_waypoints: selectedRoute.visit_order.map((visitItem: any, index: number) => {
        // Buscar el pedido correspondiente en selectedOrders basado en el índice
        const orderId = selectedOrders[index];
        return {
          order_id: orderId,
          order: visitItem.waypoint_index + 1 // Usar el orden del backend
        };
      }),
      
      // 9. traffic_condition
      traffic_condition: routeData.traffic_conditions,
      
      // 10. traffic_delay
      traffic_delay: selectedRoute.summary.traffic_delay
    };

    // Console.log para ver qué se enviará al backend
    console.log('🚀 Enviando ruta al backend:');
    console.log('📋 Payload completo:', JSON.stringify(payload, null, 2));
    console.log('🏢 Organización:', payload.organization_id);
    console.log('📝 Nombre ruta:', payload.route_name);
    console.log('📍 Origen:', payload.origin);
    console.log('🎯 Destino:', payload.destination);
    console.log('🛣️  Waypoints:', payload.waypoints.length);
    console.log('🗺️  Coordenadas ruta:', payload.route.length);
    console.log('📦 Pedidos ordenados:', payload.ordered_waypoints);
    console.log('🚦 Condiciones tráfico:', payload.traffic_condition);
    console.log('⏱️  Retraso tráfico:', payload.traffic_delay);

    // Log detallado de la estructura de route para debug
    console.log('🔍 Estructura de route:');
    payload.route.forEach((point: any, index: number) => {
      console.log(`  Punto ${index}:`, {
        lat: point.lat,
        lon: point.lon,
        name: point.name,
        speed: point.speed,
        traffic_delay: point.traffic_delay,
        congestion_level: point.congestion_level,
        waypoint_type: point.waypoint_type,
        waypoint_index: point.waypoint_index
      });
    });

    // Limpiar y validar los datos antes de enviar
    const cleanedPayload = {
      ...payload,
      route: payload.route.map((point: any) => ({
        lat: point.lat || 0,
        lon: point.lon || 0,
        name: point.name || `Punto ${point.waypoint_index || 'N/A'}`,
        traffic_delay: point.traffic_delay || 0,
        speed: point.speed || 0,
        congestion_level: point.congestion_level || 'unknown',
        waypoint_type: point.waypoint_type || 'route',
        waypoint_index: point.waypoint_index || 0
      })),
      traffic_condition: {
        current_time: payload.traffic_condition?.current_time || new Date().toISOString(),
        weather: payload.traffic_condition?.weather || 'clear',
        road_conditions: payload.traffic_condition?.road_conditions || 'good',
        general_congestion: payload.traffic_condition?.general_congestion || 'low'
      }
    };

    console.log('🧹 Payload limpiado:', JSON.stringify(cleanedPayload, null, 2));

    // Llamada real al backend de Next.js API
    const backendUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
    const apiUrl = `${backendUrl}/routes`;
    
    console.log('🌐 Enviando a:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': organizationId.toString()
        },
        body: JSON.stringify(cleanedPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error del backend:', response.status, errorData);
        
        return NextResponse.json({
          success: false,
          error: `Error del backend: ${response.status}`,
          details: errorData
        }, { status: response.status });
      }

      const backendResponse = await response.json();
      console.log('✅ Respuesta del backend:', backendResponse);

      // Extraer el route_id de la respuesta del backend
      const routeId = backendResponse?.data?.uuid || backendResponse?.data?.id || backendResponse?.route_id || backendResponse?.id || backendResponse?.uuid;
      console.log('🔑 Route ID extraído:', routeId);

      return NextResponse.json({
        success: true,
        data: {
          route_id: routeId,
          message: 'Ruta creada exitosamente en el backend',
          payload_sent: cleanedPayload,
          backend_response: backendResponse
        }
      });

    } catch (backendError) {
      console.error('❌ Error de conexión con el backend:', backendError);
      
      return NextResponse.json({
        success: false,
        error: 'Error de conexión con el backend',
        details: backendError instanceof Error ? backendError.message : 'Error desconocido'
      }, { status: 503 });
    }

  } catch (error) {
    console.error('❌ Error en la API route de rutas:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
