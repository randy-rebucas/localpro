import { NextRequest, NextResponse } from "next/server";
import { decrypt, createSession, createSessionCookie } from "@/lib/session";

/**
 * Development-only endpoint to set current user as admin
 * This should be removed in production
 */
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decrypt session
    const session = await decrypt(sessionCookie);
    
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request metadata for session security
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     undefined;

    // Create new session with admin role
    const { encryptedSession } = await createSession({
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: 'admin', // Set role to admin
      phone: session.phone,
      firstName: session.firstName,
      lastName: session.lastName,
      bio: session.bio,
      location: session.location,
      website: session.website,
      skills: session.skills,
      experience: session.experience,
      avatar: session.avatar,
      portfolio: session.portfolio,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      isVerified: session.isVerified,
      apiToken: session.apiToken,
    }, userAgent, ipAddress);
    
    // Create new session cookie with admin role
    const newSessionCookie = createSessionCookie(encryptedSession);

    console.log(`Setting user ${session.userId} (${session.email}) as admin`);
    
    const response = NextResponse.json({ 
      success: true, 
      message: "User role updated to admin",
      userId: session.userId,
      email: session.email,
      role: 'admin'
    });

    // Set the new session cookie
    response.headers.set('Set-Cookie', newSessionCookie);
    
    return response;
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
