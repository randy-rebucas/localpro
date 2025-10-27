import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

// Cache for user data to reduce API calls
const userCache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const USER_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > USER_CACHE_DURATION) {
      userCache.delete(key);
    }
  }
}, USER_CACHE_DURATION);

export async function GET(request: NextRequest) {
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

    const userId = session.userId;
    const cacheKey = userId;
    
    // Check cache first
    const cached = userCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < USER_CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Return session data directly (no need for external API call since we have all user data)
    const userData = {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
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
    };
    
    // Cache the result
    userCache.set(cacheKey, {
      data: userData,
      timestamp: Date.now(),
    });

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}