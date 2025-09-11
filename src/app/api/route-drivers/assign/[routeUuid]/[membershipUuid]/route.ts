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

    const backendBase = process.env.API_BASE_URL || 'http://localhost:3000/api';
    const url = `${backendBase}/route-drivers/assign/${routeUuid}/${membershipUuid}`;

    // Forward Authorization header and organization-id
    const authHeader = request.headers.get('authorization') || undefined;
    const orgIdHeader = request.headers.get('organization-id') || undefined;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(orgIdHeader ? { 'organization-id': orgIdHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Failed to assign route to driver' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Route assignment proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
