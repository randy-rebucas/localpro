import { NextRequest, NextResponse } from 'next/server';
import { createSession, createSessionCookie, createApiTokenCookie } from '@/lib/session';

// Development-only authentication bypass
// This should NEVER be used in production
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const { role = 'provider' } = await request.json();

    // Create mock user data
    const mockUserData = {
      userId: 'dev-user-123',
      email: 'dev@localpro.com',
      name: 'Development User',
      role: role,
      phone: '+15551234567',
      firstName: 'Dev',
      lastName: 'User',
      bio: 'Development test user',
      location: 'San Francisco, CA',
      website: 'https://localpro.com',
      skills: ['development', 'testing'],
      experience: '5+ years',
      avatar: '/api/placeholder/100/100',
      portfolio: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: true,
      apiToken: 'dev-mock-api-token'
    };

    // Create session
    const { sessionId, encryptedSession } = await createSession(
      mockUserData,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    );

    // Create session cookie
    const sessionCookie = createSessionCookie(encryptedSession);
    
    // Create API token cookie
    const apiTokenCookie = createApiTokenCookie(mockUserData.apiToken);

    // Return success with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Development authentication bypass successful',
      user: mockUserData,
      sessionId
    });

    // Set both cookies
    response.headers.set('Set-Cookie', [sessionCookie, apiTokenCookie].join(', '));

    return response;

  } catch (error) {
    console.error('Dev auth bypass error:', error);
    return NextResponse.json(
      { error: 'Failed to create development session' },
      { status: 500 }
    );
  }
}
