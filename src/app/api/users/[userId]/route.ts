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
    
    // Always try external API first, but provide session data as fallback
    try {
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'usersById',
        [userId],
        { method: 'GET' }
      );
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      } else {
        console.warn("External API failed, returning session data as fallback");
        // Return actual session data instead of mock data
        const sessionUserData = {
          id: userId,
          email: session.user.email,
          name: session.user.name,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          phone: session.user.phone,
          bio: session.user.bio,
          location: session.user.location,
          website: session.user.website,
          skills: session.user.skills,
          experience: session.user.experience,
          avatar: session.user.avatar,
          portfolio: session.user.portfolio,
          createdAt: session.user.createdAt || new Date().toISOString(),
          updatedAt: session.user.updatedAt || new Date().toISOString(),
          isVerified: session.user.isVerified,
          role: session.user.role
        };
        return NextResponse.json(sessionUserData);
      }
    } catch (apiError) {
      console.warn("External API unavailable, returning session data as fallback:", apiError);
      // Return actual session data instead of mock data
      const sessionUserData = {
        id: userId,
        email: session.user.email,
        name: session.user.name,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        phone: session.user.phone,
        bio: session.user.bio,
        location: session.user.location,
        website: session.user.website,
        skills: session.user.skills,
        experience: session.user.experience,
        avatar: session.user.avatar,
        portfolio: session.user.portfolio,
        createdAt: session.user.createdAt || new Date().toISOString(),
        updatedAt: session.user.updatedAt || new Date().toISOString(),
        isVerified: session.user.isVerified,
        role: session.user.role
      };
      return NextResponse.json(sessionUserData);
    }

  } catch (error) {
    console.error("Error fetching user data:", error);

    // If we have session data, return it as fallback instead of error
    if (session?.user) {
      console.warn("Returning session data as fallback due to error");
      const sessionUserData = {
        id: userId,
        email: session.user.email,
        name: session.user.name,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        phone: session.user.phone,
        bio: session.user.bio,
        location: session.user.location,
        website: session.user.website,
        skills: session.user.skills,
        experience: session.user.experience,
        avatar: session.user.avatar,
        portfolio: session.user.portfolio,
        createdAt: session.user.createdAt || new Date().toISOString(),
        updatedAt: session.user.updatedAt || new Date().toISOString(),
        isVerified: session.user.isVerified,
        role: session.user.role
      };
      return NextResponse.json(sessionUserData);
    }

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

