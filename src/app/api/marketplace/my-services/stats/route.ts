import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { handleApiRequestWithEndpoint } from "@/lib/api-auth-utils";

// External API integration needed

// GET /api/marketplace/my-services/stats - Get user's service statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    // For development, allow unauthenticated requests
    const isAuthenticated = !!session?.user?.id;
    
    // Try to fetch from external API first (only if authenticated), fallback to mock data
    if (isAuthenticated) {
      try {
        const response = await handleApiRequestWithEndpoint(
      request,
      'marketplaceMyServices',
          { method: 'GET' }
        );

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (fetchError) {
        console.log("External API unavailable, using mock stats:", fetchError);
      }
    }

    // Return empty data - external API integration needed
    console.log("API: External API unavailable, returning empty data");
    return NextResponse.json({
      totalServices: 0,
      activeServices: 0,
      totalBookings: 0,
      totalEarnings: 0,
      averageRating: 0
    });

  } catch (error) {
    console.error("Error fetching service statistics:", error);
    
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
