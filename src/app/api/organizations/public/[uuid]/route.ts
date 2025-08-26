import { NextRequest, NextResponse } from 'next/server';

// GET /api/organizations/public/[uuid] - Obtener información pública de organización
export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params;

    // Forward to backend API
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000/api'}/organizations/public/${uuid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Failed to get organization' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get public organization error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
