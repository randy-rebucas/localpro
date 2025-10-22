import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";


// GET /api/marketplace/my-bookings - Get user's bookings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    console.log("My Bookings API: Session:", session?.user?.email);

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
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    if (status && status !== 'all') queryParams.append('status', status);
    if (dateFrom) queryParams.append('dateFrom', dateFrom);
    if (dateTo) queryParams.append('dateTo', dateTo);
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());

    // Make request to external API
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api/marketplace/my-bookings?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          "Authorization": session?.user?.id ? `Bearer ${session.user.id}` : "",
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30000),
      });
    } catch (fetchError) {
      console.error("Failed to connect to external API:", fetchError);
      
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
      
      throw fetchError;
    }

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
      
      return NextResponse.json(
        { 
          error: `External service error: ${response.status}`,
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
