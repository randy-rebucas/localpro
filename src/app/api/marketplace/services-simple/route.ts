import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";
import { getServerSession } from "@/lib/server-session";

// GET /api/marketplace/services-simple - Simple services endpoint
export async function GET(request: NextRequest) {
  try {
    console.log("Simple API: Fetching services...");
    const session = await getServerSession(request);
    
    // Make request to external API
    const response = await fetch(`${API_BASE_URL}/api/marketplace/services-simple`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${session?.user?.id || ''}`,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      return NextResponse.json(
        { 
          error: `External service error: ${response.status}`,
          errorMessage: `Failed to fetch services from external service`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Simple API: External API response:", data);

    return NextResponse.json(data);

  } catch (error) {
    console.error("Simple API: Error:", error);
    
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
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      },
      { status: statusCode }
    );
  }
}
