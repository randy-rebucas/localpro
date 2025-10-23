import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { handleApiRequestWithEndpoint } from "@/lib/api-auth-utils";

// GET /api/communication/notifications/count - Get notification count
export async function GET(request: NextRequest) {
  try {
    console.log("Count API - Request headers:", {
      authorization: request.headers.get('authorization'),
      cookie: request.headers.get('cookie'),
      userAgent: request.headers.get('user-agent')
    });
    
    const session = await getServerSession(request);
    
    console.log("Count API - Session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.id) {
      console.log("Count API - No session or user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await handleApiRequestWithEndpoint(
      request,
      'communicationNotificationCount',
      { method: 'GET' }
    );

    const data = await response.json();
    console.log("Count API - Response:", data);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch notification count" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notification count:", error);
    
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
