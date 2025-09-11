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

    // URL del backend real
    const backendUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
    const apiUrl = `${backendUrl}/routes`;
    
    console.log('🌐 Obteniendo rutas del backend:', apiUrl);
    console.log('🏢 Organization ID:', organizationId);
    
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
      console.log('✅ Respuesta del backend:', backendResponse);

      return NextResponse.json({
        success: true,
        data: backendResponse.data || [],
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
