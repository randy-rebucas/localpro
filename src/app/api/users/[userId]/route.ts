import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(request);
    console.log("session", session);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;
    
    // For development, return mock data if external API is not available
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_MOCK_DATA === 'true') {
      console.log("Using mock data for development");
      const mockUserData = {
        id: userId,
        email: session.user.email,
        name: session.user.name,
        firstName: session.user.firstName || "John",
        lastName: session.user.lastName || "Doe",
        phone: session.user.phone || "+1234567890",
        bio: session.user.bio || "Professional service provider",
        location: session.user.location || "New York, NY",
        website: session.user.website || "https://example.com",
        skills: session.user.skills || ["Web Development", "Design"],
        experience: session.user.experience || "5+ years",
        avatar: session.user.avatar || null,
        portfolio: session.user.portfolio || [],
        createdAt: session.user.createdAt || new Date().toISOString(),
        updatedAt: session.user.updatedAt || new Date().toISOString(),
        isVerified: session.user.isVerified || false,
        role: session.user.role || "provider"
      };
      return NextResponse.json(mockUserData);
    }
    
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'usersById',
      [userId],
      { method: 'GET' }
    );
    console.log("response", response);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch user data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching user data:", error);

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const body = await request.json();

    const response = await makeAuthenticatedRequestWithPath(
      request,
      'usersById',
      [userId],
      {},
      {
        method: 'PUT',
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to update user data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error updating user data:", error);

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

