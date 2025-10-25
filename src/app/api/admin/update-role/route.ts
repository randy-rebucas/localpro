import { NextRequest, NextResponse } from "next/server";
import { decrypt, createSession, createSessionCookie } from "@/lib/session";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(['client', 'provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin']),
});

/**
 * Endpoint to update user role in session
 * This should be protected in production
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);

    // Get request metadata for session security
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     undefined;

    // Create new session with updated role
    const { encryptedSession } = await createSession({
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: role, // Set the new role
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
    
    // Create new session cookie with updated role
    const newSessionCookie = createSessionCookie(encryptedSession);

    console.log(`Updating user ${session.userId} (${session.email}) role to ${role}`);
    
    const response = NextResponse.json({ 
      success: true, 
      message: `User role updated to ${role}`,
      userId: session.userId,
      email: session.email,
      role: role
    });

    // Set the new session cookie
    response.headers.set('Set-Cookie', newSessionCookie);
    
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid role", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
