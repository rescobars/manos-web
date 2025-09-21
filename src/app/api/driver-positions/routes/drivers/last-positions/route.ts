import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Obtener el organization-id del header
    const organizationId = request.headers.get('organization-id');
    
    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'organization-id header is required'
      }, { status: 400 });
    }

    // Obtener el body de la request
    const body = await request.json();
    const { routeIds } = body;

    if (!routeIds || !Array.isArray(routeIds) || routeIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'routeIds array is required and must not be empty'
      }, { status: 400 });
    }

    // URL del backend real
    const backendUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
    const apiUrl = `${backendUrl}/driver-positions/routes/drivers/last-positions`;

    // Hacer la llamada al backend externo
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'organization-id': organizationId,
      },
      body: JSON.stringify({ routeIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: errorData.error || `Backend error: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in driver-positions/routes/drivers/last-positions:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
