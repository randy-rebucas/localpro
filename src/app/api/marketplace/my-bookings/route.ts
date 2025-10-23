import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// GET /api/marketplace/my-bookings - Get user's bookings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    console.log("My Bookings API: Session:", session?.user?.email);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // client or provider
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log("My Bookings API: Query params:", {
      type,
      status,
      dateFrom,
      dateTo,
      page,
      limit
    });
    
    // Build query parameters for external API
    const queryParams: Record<string, string> = {};
    if (type) queryParams.type = type;
    if (status && status !== 'all') queryParams.status = status;
    if (dateFrom) queryParams.dateFrom = dateFrom;
    if (dateTo) queryParams.dateTo = dateTo;
    if (page) queryParams.page = page.toString();
    if (limit) queryParams.limit = limit.toString();

    // Make request to external API using new approach
    const response = await makeAuthenticatedRequestWithPath(
      session,
      'marketplaceMyBookings',
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      
      // For development, return empty bookings instead of error
      if (process.env.NODE_ENV === 'development') {
        console.log("Development mode: Returning empty bookings due to external API error");
        return NextResponse.json({
          bookings: [],
          total: 0,
          page: 1,
          limit: 10
        });
      }
      
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.error || `External service error: ${response.status}`,
          errorMessage: `Failed to fetch user bookings from external service`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("My Bookings API: External API response:", data);

    // Return the data from external API
    return NextResponse.json({
      bookings: data.bookings || data || [],
      total: data.total || (Array.isArray(data) ? data.length : 0),
      page: data.page || 1,
      limit: data.limit || 10
    });

  } catch (error) {
    console.error("Error fetching user bookings:", error);
    
    // For development, return empty bookings instead of error
    if (process.env.NODE_ENV === 'development') {
      console.log("Development mode: Returning empty bookings due to connection error");
      return NextResponse.json({
        bookings: [],
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
