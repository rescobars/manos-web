import { NextRequest, NextResponse } from 'next/server';

// POST /api/orders/public-external - Crear pedido usando API externa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos requeridos
    const { 
      organization_uuid,
      delivery_address, 
      pickup_address,
      total_amount,
      description,
      details
    } = body;

    if (!organization_uuid) {
      return NextResponse.json(
        { success: false, error: 'Organization UUID is required' },
        { status: 400 }
      );
    }

    if (!delivery_address?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Delivery address is required' },
        { status: 400 }
      );
    }

    if (!pickup_address?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Pickup address is required' },
        { status: 400 }
      );
    }

    if (!details?.customer_name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }

    if (!details?.phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer phone is required' },
        { status: 400 }
      );
    }

    console.log('Creating external order with data:', body);

    // Preparar datos para la API externa
    const externalOrderData = {
      delivery_address: delivery_address.trim(),
      pickup_address: pickup_address.trim(),
      total_amount: parseFloat(total_amount) || 0,
      description: description?.trim() || 'Pedido público',
      details: {
        customer_name: details.customer_name.trim(),
        phone: details.phone.trim(),
        special_instructions: details.special_instructions?.trim() || ''
      }
    };

    // Obtener la URL base de la API externa desde variables de entorno
    const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3000';
    const externalApiUrl = `${EXTERNAL_API_BASE_URL}/api/orders/public/${organization_uuid}`;

    console.log('Sending request to external API:', externalApiUrl);
    console.log('External API payload:', JSON.stringify(externalOrderData, null, 2));

    // Enviar solicitud a la API externa
    const externalResponse = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(externalOrderData),
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
          error: externalData.error || externalData.message || 'Error al crear el pedido en la API externa',
          details: externalData
        },
        { status: externalResponse.status }
      );
    }

    console.log('External API Success:', externalData);

    // Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      data: externalData,
      message: 'Pedido creado exitosamente'
    });

  } catch (error) {
    console.error('Create external order error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
