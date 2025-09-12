import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const organizationId = params.uuid;
    
    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const createdAfter = searchParams.get('created_after');
    const createdBefore = searchParams.get('created_before');
    const minAmount = searchParams.get('min_amount');
    const maxAmount = searchParams.get('max_amount');
    const pickupLat = searchParams.get('pickup_lat');
    const pickupLon = searchParams.get('pickup_lon');
    const radius = searchParams.get('radius');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const sortBy = searchParams.get('sort_by');
    const sortOrder = searchParams.get('sort_order');

    // URL del backend real
    const backendUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
    let apiUrl = `${backendUrl}/orders/organization/${organizationId}`;
    
    // Agregar parámetros de query si existen
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    if (createdAfter) queryParams.append('created_after', createdAfter);
    if (createdBefore) queryParams.append('created_before', createdBefore);
    if (minAmount) queryParams.append('min_amount', minAmount);
    if (maxAmount) queryParams.append('max_amount', maxAmount);
    if (pickupLat) queryParams.append('pickup_lat', pickupLat);
    if (pickupLon) queryParams.append('pickup_lon', pickupLon);
    if (radius) queryParams.append('radius', radius);
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (sortBy) queryParams.append('sort_by', sortBy);
    if (sortOrder) queryParams.append('sort_order', sortOrder);
    
    if (queryParams.toString()) {
      apiUrl += `?${queryParams.toString()}`;
    }
    
    console.log('🌐 Obteniendo pedidos del backend:', apiUrl);
    console.log('🏢 Organization ID:', organizationId);
    console.log('🔍 Headers que se envían:', {
      'Content-Type': 'application/json',
      'organization-id': organizationId
    });
    
    try {
      // Obtener el token de autorización del header de la request
      const authHeader = request.headers.get('authorization');
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': organizationId,
          'Authorization': authHeader || ''
        }
      });

      console.log('📡 Respuesta del backend - Status:', response.status);
      console.log('📡 Respuesta del backend - Headers:', Object.fromEntries(response.headers.entries()));
      
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

      return NextResponse.json({
        success: true,
        data: backendResponse.data || [],
        pagination: backendResponse.pagination || null,
        message: backendResponse.message || 'Pedidos obtenidos exitosamente'
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
    console.error('❌ Error en la API route de pedidos:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}