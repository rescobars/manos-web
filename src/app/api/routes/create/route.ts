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
      ordered_waypoints: (selectedRoute.visit_order || []).map((visitItem: any, index: number) => {
        // Preferir el order_id si viene desde visit_order
        const orderIdFromVisit = (visitItem && (visitItem.order_id || visitItem.orderId)) as string | undefined;
        // Fallback al arreglo de selectedOrders usando waypoint_index si existe, sino el índice
        const byWaypointIndex = typeof visitItem?.waypoint_index === 'number' ? selectedOrders[visitItem.waypoint_index] : undefined;
        const byIndex = selectedOrders[index];
        const resolvedOrderId = orderIdFromVisit || byWaypointIndex || byIndex || '';

        return {
          order_id: resolvedOrderId,
          order: (typeof visitItem?.waypoint_index === 'number' ? visitItem.waypoint_index : index) + 1 // Usar el orden del backend
        };
      }),
      
      // 9. traffic_condition
      traffic_condition: routeData.traffic_conditions,
      
      // 10. traffic_delay
      traffic_delay: selectedRoute.summary.traffic_delay,

      // 11. opcionales sugeridos
      status: 'PLANNED',
      priority: 'MEDIUM'
    } as any;

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

    // De-duplicar ordered_waypoints por order_id manteniendo el primer occurrence
    const seenIds = new Set<string>();
    const dedupedOrdered = (payload.ordered_waypoints as any[]).filter((ow: any) => {
      if (!ow?.order_id || typeof ow.order_id !== 'string') return false;
      if (seenIds.has(ow.order_id)) return false;
      seenIds.add(ow.order_id);
      return true;
    });

    // Normalizar traffic_condition a claves requeridas y strings
    const normalizedTrafficCondition = {
      current_time: payload.traffic_condition?.current_time || new Date().toISOString(),
      weather: payload.traffic_condition?.weather || 'clear',
      road_conditions: payload.traffic_condition?.road_conditions || 'Seco',
      general_congestion: payload.traffic_condition?.general_congestion || 'Moderado'
    };

    // Limpiar y validar los datos antes de enviar con el formato EXACTO requerido
    const cleanedPayload = {
      organization_id: payload.organization_id,
      route_name: payload.route_name,
      description: payload.description,
      origin: {
        lat: Number(payload.origin?.lat) || 0,
        lon: Number(payload.origin?.lon) || 0,
        name: String(payload.origin?.name || 'Origen')
      },
      destination: {
        lat: Number(payload.destination?.lat) || 0,
        lon: Number(payload.destination?.lon) || 0,
        name: String(payload.destination?.name || 'Destino')
      },
      waypoints: (payload.waypoints || []).map((wp: any, i: number) => ({
        lat: Number(wp?.lat) || 0,
        lon: Number(wp?.lon) || 0,
        name: String(wp?.name || `Punto ${i + 1}`)
      })),
      route: (payload.route || []).map((point: any, i: number) => ({
        lat: Number(point?.lat) || 0,
        lon: Number(point?.lon) || 0,
        name: String(point?.name || `Segmento ${i + 1}`),
        traffic_delay: Number(point?.traffic_delay) || 0,
        speed: point?.speed == null ? 35 : Number(point.speed),
        congestion_level: String(point?.congestion_level || 'light'),
        waypoint_type: String(point?.waypoint_type || 'route'),
        waypoint_index: null
      })),
      ordered_waypoints: dedupedOrdered.map((ow: any, idx: number) => ({
        order_id: String(ow.order_id),
        order: Number(ow.order) || idx + 1
      })),
      traffic_condition: normalizedTrafficCondition,
      traffic_delay: Number(payload.traffic_delay) || 0,
      status: String(payload.status || 'PLANNED'),
      priority: String(payload.priority || 'MEDIUM')
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
