import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { uuid: string } }) {
  try {
    const { uuid } = params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (!uuid) {
      return NextResponse.json(
        { success: false, error: 'organization uuid is required' },
        { status: 400 }
      );
    }

    const backendBase = process.env.API_BASE_URL || 'http://localhost:3000/api';
    const url = `${backendBase}/organization-members/organization/${uuid}/users${role ? `?role=${encodeURIComponent(role)}` : ''}`;

    // Forward Authorization header if present
    const authHeader = request.headers.get('authorization') || undefined;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Failed to fetch organization users' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Organization users proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


