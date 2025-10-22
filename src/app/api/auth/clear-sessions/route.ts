import { NextRequest, NextResponse } from 'next/server';
import { clearAllSessionCookies } from '@/lib/session';

/**
 * Clear all session cookies
 * Useful for debugging or when session secrets change
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ 
      message: 'All session cookies cleared successfully' 
    });

    // Clear all session cookies
    const cookies = clearAllSessionCookies();
    cookies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });

    return response;
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return NextResponse.json(
      { error: 'Failed to clear sessions' },
      { status: 500 }
    );
  }
}
