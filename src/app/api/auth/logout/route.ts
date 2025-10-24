import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { handleApiRequestWithEndpoint } from "@/lib/api-auth-utils";
import { clearSessionCookie, removeSession } from "@/lib/session";
import { serialize } from "cookie";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call the backend logout endpoint first
    const response = await handleApiRequestWithEndpoint(
      request,
      'authLogout',
      { method: 'POST' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to logout" },
        { status: response.status }
      );
    }

    // Remove session from our session store
    if (session.sessionId) {
      removeSession(session.sessionId);
    }

    // Create response with cleared cookies
    const logoutResponse = NextResponse.json({ 
      message: "Logged out successfully" 
    });

    // Clear both session and API token cookies
    logoutResponse.headers.set('Set-Cookie', clearSessionCookie());
    logoutResponse.headers.append('Set-Cookie', serialize('api-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
    }));

    return logoutResponse;

  } catch (error) {
    console.error("Error during logout:", error);
    
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "Request timeout - the external service is taking too long to respond";
        statusCode = 504;
      } else if (error.message.includes('fetch failed')) {
        errorMessage = "Unable to connect to external service - please try again later";
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: statusCode }
    );
  }
}
