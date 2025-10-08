import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { uuid } = params;

    if (!uuid) {
      return NextResponse.json(
        { success: false, error: 'Order UUID is required' },
        { status: 400 }
      );
    }

    // Forward to external API
    const response = await fetch(`${config.api.external}/api/orders/${uuid}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Failed to fetch order' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { uuid } = params;

    if (!uuid) {
      return NextResponse.json(
        { success: false, error: 'Order UUID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Forward to external API
    const response = await fetch(`${config.api.external}/api/orders/${uuid}`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Failed to update order' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { uuid } = params;

    if (!uuid) {
      return NextResponse.json(
        { success: false, error: 'Order UUID is required' },
        { status: 400 }
      );
    }

    // Forward to external API
    const response = await fetch(`${config.api.external}/api/orders/${uuid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Failed to delete order' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Order deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[uuid] - Actualizar estado de un pedido
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

    // Obtener la URL base de la API externa desde configuración centralizada
    const externalApiUrl = `${config.api.external}/api/orders/${uuid}`;

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
