import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

// GET /api/logs/user/[userId]/activity - Get user activity logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the same simple authentication method as other API routes
    const bearer = session.user.id;

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const requestHeaders = {
      "Authorization": `Bearer ${bearer}`,
      "Content-Type": "application/json",
    };
    
    const response = await fetch(`${API_BASE_URL}/api/logs/user/${userId}/activity?${queryString}`, {
      headers: requestHeaders,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `External service error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    
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

