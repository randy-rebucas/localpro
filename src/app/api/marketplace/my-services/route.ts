import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

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
    const queryParams: Record<string, string> = {};
    if (status && status !== 'all') queryParams.status = status;
    if (category) queryParams.category = category;
    if (page) queryParams.page = page.toString();
    if (limit) queryParams.limit = limit.toString();

    // Make request to external API using new approach
    const response = await makeAuthenticatedRequestWithPath(
      session,
      'marketplaceMyServices',
      [],
      queryParams,
      { method: 'GET' }
    );

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
      
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.error || `External service error: ${response.status}`,
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
