import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { routeUuid: string; membershipUuid: string } }
) {
  try {
    const { routeUuid, membershipUuid } = params;
    const body = await request.json();

    if (!routeUuid || !membershipUuid) {
      return NextResponse.json(
        { success: false, error: 'routeUuid and membershipUuid are required' },
        { status: 400 }
      );
    }

    // Obtener el token de autorización del header de la request
    const authHeader = request.headers.get('authorization');
    const orgIdHeader = request.headers.get('organization-id');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      );
    }

    if (!orgIdHeader) {
      return NextResponse.json(
        { success: false, error: 'organization-id header is required' },
        { status: 400 }
      );
    }

    // URL del backend real - usar la misma URL que otros endpoints
    const backendUrl = process.env.API_BASE_URL;
    const apiUrl = `${backendUrl}/route-drivers/assign/${routeUuid}/${membershipUuid}`;

    // Hacer la llamada al backend externo
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'organization-id': orgIdHeader,
      },
      body: JSON.stringify(body),
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
    
    return NextResponse.json(backendResponse);
  } catch (error) {
    console.error('Route assignment proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
