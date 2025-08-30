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
      description // Descripción opcional
    } = body;

    // Validar datos requeridos
    if (!routeData || !selectedOrders || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos: routeData, selectedOrders, organizationId'
      }, { status: 400 });
    }

    // Preparar el payload para el backend
    const payload = {
      organization_id: organizationId,
      route_name: routeName || `Ruta Optimizada ${new Date().toLocaleDateString()}`,
      description: description || 'Ruta optimizada con tráfico en tiempo real',
      
      // Datos de la ruta optimizada
      origin: routeData.route_info.origin,
      destination: routeData.route_info.destination,
      waypoints: routeData.route_info.waypoints,
      
      // Ruta principal seleccionada
      primary_route: {
        route_id: routeData.primary_route.route_id,
        summary: routeData.primary_route.summary,
        points: routeData.primary_route.points,
        visit_order: routeData.primary_route.visit_order
      },
      
      // Rutas alternativas (si existen)
      alternative_routes: routeData.alternative_routes,
      
      // Información de tráfico
      traffic_conditions: routeData.traffic_conditions,
      
      // Pedidos asociados con su orden de visita
      orders: selectedOrders.map((orderId: string, index: number) => ({
        order_id: orderId,
        visit_order: index + 1, // Orden secuencial
        waypoint_index: routeData.primary_route.visit_order.find(
          (item: any) => item.waypoint_index === index
        )?.waypoint_index || index
      })),
      
      // Metadatos
      created_at: new Date().toISOString(),
      status: 'active',
      total_orders: selectedOrders.length,
      total_distance: routeData.primary_route.summary.total_distance,
      total_time: routeData.primary_route.summary.total_time,
      traffic_delay: routeData.primary_route.summary.traffic_delay
    };

    // Console.log para ver qué se enviará al backend
    console.log('🚀 Enviando ruta al backend:');
    console.log('📋 Payload completo:', JSON.stringify(payload, null, 2));
    console.log('📍 Origen:', payload.origin);
    console.log('🎯 Destino:', payload.destination);
    console.log('🛣️  Waypoints:', payload.waypoints.length);
    console.log('📦 Pedidos:', payload.orders);
    console.log('⏱️  Tiempo total:', payload.total_time);
    console.log('📏 Distancia total:', payload.total_distance);
    console.log('🚦 Retraso por tráfico:', payload.traffic_delay);

    // TODO: Aquí irá la llamada real al backend
    // const response = await fetch('TU_BACKEND_URL/api/routes', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`
    //   },
    //   body: JSON.stringify(payload)
    // });

    // Por ahora, simulamos una respuesta exitosa
    const mockResponse = {
      success: true,
      data: {
        route_id: `route_${Date.now()}`,
        message: 'Ruta creada exitosamente en el backend',
        payload_sent: payload
      }
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('❌ Error en la API route de rutas:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
