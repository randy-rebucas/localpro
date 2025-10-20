import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { encrypt } from "@/lib/session";

// POST /api/auth/token - Generate Bearer token for API access
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Generate a new session token that can be used as Bearer token
    const tokenData = {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      phone: session.user.phone,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      bio: session.user.bio,
      location: session.user.location,
      website: session.user.website,
      skills: session.user.skills,
      experience: session.user.experience,
      avatar: session.user.avatar,
      portfolio: session.user.portfolio,
      createdAt: session.user.createdAt,
      updatedAt: session.user.updatedAt,
      isVerified: session.user.isVerified,
    };

    const bearerToken = await encrypt(tokenData);

    return NextResponse.json({
      success: true,
      token: bearerToken,
      expiresIn: "7d",
      tokenType: "Bearer"
    });
  } catch (error) {
    console.error("Error generating Bearer token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/auth/token - Validate Bearer token
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        isVerified: session.user.isVerified
      }
    });
  } catch (error) {
    console.error("Error validating Bearer token:", error);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
