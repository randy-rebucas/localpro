import { NextResponse } from "next/server";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";

// GET /api/marketplace/services-simple - Simple services endpoint
export async function GET() {
  try {
    console.log("Simple API: Fetching services...");
    // const session = await getServerSession(request);
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceServices}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.error || `External service error: ${response.status}`,
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
