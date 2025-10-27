import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { handleApiRequestWithEndpoint } from "@/lib/api-auth-utils";
import { createSession, createSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const response = await handleApiRequestWithEndpoint(
      request,
      'authUploadAvatar',
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to upload avatar" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // If avatar upload was successful, update session data
    if (data.avatar) {
      const updatedUserData = {
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
        avatar: data.avatar,
        portfolio: session.user.portfolio,
        createdAt: session.user.createdAt,
        updatedAt: new Date().toISOString(),
        isVerified: session.user.isVerified,
        apiToken: session.apiToken,
      };

      // Create new session with updated avatar
      const { encryptedSession } = await createSession(updatedUserData);
      const sessionCookie = createSessionCookie(encryptedSession);

      // Return success response with session cookie
      const response = NextResponse.json(data);
      response.headers.set('Set-Cookie', sessionCookie);
      return response;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Upload avatar error:", error);
    
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
