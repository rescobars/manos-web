import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_uuid, email, name, title } = body;

    if (!organization_uuid || !email || !name || !title) {
      return NextResponse.json(
        { success: false, error: 'organization_uuid, email, name, and title are required' },
        { status: 400 }
      );
    }

    // Forward to backend API
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000/api'}/organization-members/public-create-with-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organization_uuid,
        email,
        name,
        title
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Registration failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
