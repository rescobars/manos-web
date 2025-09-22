import { NextRequest, NextResponse } from 'next/server';

// POST /api/orders/public-create - Crear pedido desde página pública
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos requeridos
    const { 
      organization_uuid, 
      customer_name, 
      customer_phone, 
      delivery_address,
      delivery_lat,
      delivery_lng 
    } = body;

    if (!organization_uuid) {
      return NextResponse.json(
        { success: false, error: 'Organization UUID is required' },
        { status: 400 }
      );
    }

    if (!customer_name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }

    if (!customer_phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer phone is required' },
        { status: 400 }
      );
    }

    if (!delivery_address || !delivery_lat || !delivery_lng) {
      return NextResponse.json(
        { success: false, error: 'Delivery location is required' },
        { status: 400 }
      );
    }

    // Forward to backend API
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000/api'}/orders/public-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Failed to create order' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create public order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
