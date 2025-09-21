import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Obtener el organization-id del header
    const organizationId = request.headers.get('organization-id');
    
    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'organization-id header is required'
      }, { status: 400 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const createdAfter = searchParams.get('created_after');
    const createdBefore = searchParams.get('created_before');
    const updatedAfter = searchParams.get('updated_after');
    const updatedBefore = searchParams.get('updated_before');
    const minTrafficDelay = searchParams.get('min_traffic_delay');
    const maxTrafficDelay = searchParams.get('max_traffic_delay');
    const originLat = searchParams.get('origin_lat');
    const originLon = searchParams.get('origin_lon');
    const destinationLat = searchParams.get('destination_lat');
    const destinationLon = searchParams.get('destination_lon');
    const radius = searchParams.get('radius');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const sortBy = searchParams.get('sort_by');
    const sortOrder = searchParams.get('sort_order');

    // URL del backend real
    const backendUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
    let apiUrl = `${backendUrl}/routes`;
    
    // Agregar parámetros de query si existen
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (priority) queryParams.append('priority', priority);
    if (search) queryParams.append('search', search);
    if (createdAfter) queryParams.append('created_after', createdAfter);
    if (createdBefore) queryParams.append('created_before', createdBefore);
    if (updatedAfter) queryParams.append('updated_after', updatedAfter);
    if (updatedBefore) queryParams.append('updated_before', updatedBefore);
    if (minTrafficDelay) queryParams.append('min_traffic_delay', minTrafficDelay);
    if (maxTrafficDelay) queryParams.append('max_traffic_delay', maxTrafficDelay);
    if (originLat) queryParams.append('origin_lat', originLat);
    if (originLon) queryParams.append('origin_lon', originLon);
    if (destinationLat) queryParams.append('destination_lat', destinationLat);
    if (destinationLon) queryParams.append('destination_lon', destinationLon);
    if (radius) queryParams.append('radius', radius);
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (sortBy) queryParams.append('sort_by', sortBy);
    if (sortOrder) queryParams.append('sort_order', sortOrder);
    
    if (queryParams.toString()) {
      apiUrl += `?${queryParams.toString()}`;
    }
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': organizationId
        }
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

      return NextResponse.json({
        success: true,
        data: backendResponse.data || [],
        pagination: backendResponse.pagination || null,
        message: backendResponse.message || 'Rutas obtenidas exitosamente'
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
