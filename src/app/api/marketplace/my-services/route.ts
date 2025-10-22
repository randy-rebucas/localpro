import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";


// GET /api/marketplace/my-services - Get user's services
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Build query parameters for external API
    const queryParams = new URLSearchParams();
    if (status && status !== 'all') queryParams.append('status', status);
    if (category) queryParams.append('category', category);
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());

    // Make request to external API
    const response = await fetch(`${API_BASE_URL}/api/marketplace/my-services?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${session.user.id}`,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      
      // In development, return empty services instead of error
      if (process.env.NODE_ENV === 'development') {
        console.log("Development mode: Returning empty services due to external API error");
        return NextResponse.json({
          services: [],
          total: 0,
          page: 1,
          limit: 10
        });
      }
      
      return NextResponse.json(
        { 
          error: `External service error: ${response.status}`,
          errorMessage: `Failed to fetch user services from external service`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("My Services API: External API response:", data);

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching user services:", error);
    
    // In development, return empty services instead of error
    if (process.env.NODE_ENV === 'development') {
      console.log("Development mode: Returning empty services due to connection error");
      return NextResponse.json({
        services: [],
        total: 0,
        page: 1,
        limit: 10
      });
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
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      },
      { status: statusCode }
    );
  }
}
