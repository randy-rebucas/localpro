import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

/**
 * Development-only endpoint to debug session data
 * This should be removed in production
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    // Get session cookie from request
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionCookie = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('session='))
      ?.split('=')[1];

    if (!sessionCookie) {
      return NextResponse.json({ 
        error: "No session cookie found",
        debug: {
          cookieHeader,
          hasSessionCookie: false
        }
      }, { status: 401 });
    }

    // Decrypt session
    const session = await decrypt(sessionCookie);
    
    if (!session) {
      return NextResponse.json({ 
        error: "Failed to decrypt session",
        debug: {
          cookieHeader,
          hasSessionCookie: true,
          sessionCookieLength: sessionCookie.length
        }
      }, { status: 401 });
    }

    // Return session data for debugging
    return NextResponse.json({ 
      success: true,
      session: {
        sessionId: session.sessionId,
        userId: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        phone: session.phone,
        firstName: session.firstName,
        lastName: session.lastName,
        isVerified: session.isVerified,
        hasApiToken: !!session.apiToken,
        fingerprint: session.fingerprint
      },
      debug: {
        cookieHeader,
        hasSessionCookie: true,
        sessionCookieLength: sessionCookie.length,
        sessionKeys: Object.keys(session)
      }
    });
  } catch (error) {
    console.error("Debug session error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        debug: {
          error: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    );
  }
}
