import { NextRequest, NextResponse } from 'next/server';

// GET /api/driver-positions/organizations/[orgId]/drivers/last-positions
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { orgId } = params;

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Organization UUID is required' },
        { status: 400 }
      );
    }

    // Forward to backend API
    const response = await fetch(
      `${process.env.API_BASE_URL || 'http://localhost:3000/api'}/driver-positions/organizations/${orgId}/drivers/last-positions`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || data.message || 'Failed to fetch driver positions' 
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Driver positions fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
