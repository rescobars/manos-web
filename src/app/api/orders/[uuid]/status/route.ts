import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/orders/[uuid]/status - Actualizar estado de un pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params;
    const body = await request.json();
    const { status } = body;

    if (!uuid) {
      return NextResponse.json(
        { success: false, error: 'Order UUID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validar que el status sea válido
    const validStatuses = ['REQUESTED', 'PENDING', 'ASSIGNED', 'IN_ROUTE', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Obtener el token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization token is required' },
        { status: 401 }
      );
    }

    // Obtener la URL base de la API externa desde variables de entorno
    const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3000';
    const externalApiUrl = `${EXTERNAL_API_BASE_URL}/api/orders/${uuid}`;

    console.log('Updating order status via external API:', externalApiUrl);
    console.log('Status update payload:', { status });

    // Enviar solicitud a la API externa
    const externalResponse = await fetch(externalApiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const externalData = await externalResponse.json();

    if (!externalResponse.ok) {
      console.error('External API Error:', {
        status: externalResponse.status,
        statusText: externalResponse.statusText,
        data: externalData
      });

      return NextResponse.json(
        { 
          success: false, 
          error: externalData.error || externalData.message || 'Error al actualizar el estado del pedido en la API externa',
          details: externalData
        },
        { status: externalResponse.status }
      );
    }

    console.log('External API Success:', externalData);

    // Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Estado del pedido actualizado exitosamente',
      data: externalData
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
