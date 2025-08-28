import { NextRequest, NextResponse } from 'next/server';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface Order {
  id: string;
  orderNumber: string;
  deliveryLocation: Location;
  description?: string;
  totalAmount?: number;
}

interface RouteOptimizationRequest {
  pickup_location: Location;
  orders: Order[];
}

// API base URL - ajustar según tu configuración
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body: RouteOptimizationRequest = await request.json();
    
    // Validar datos de entrada
    if (!body.pickup_location || !body.orders || body.orders.length === 0) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos' },
        { status: 400 }
      );
    }

    // Enviar a FastAPI
    const fastApiResponse = await fetch(`${FASTAPI_BASE_URL}/api/v1/routes/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!fastApiResponse.ok) {
      const errorData = await fastApiResponse.text();
      console.error('FastAPI error:', errorData);
      return NextResponse.json(
        { error: 'Error en la optimización de rutas' },
        { status: fastApiResponse.status }
      );
    }

    const optimizedRoute = await fastApiResponse.json();
    
    return NextResponse.json(optimizedRoute);

  } catch (error) {
    console.error('Error in route optimization API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
