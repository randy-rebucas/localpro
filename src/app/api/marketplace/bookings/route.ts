import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// GET /api/marketplace/bookings - Get user bookings
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

    // Build query parameters for external API
    const queryParams: Record<string, string> = {};
    if (status && status !== 'all') {
      queryParams.status = status;
    }

    // Make request to external API using proper authentication
    const response = await makeAuthenticatedRequestWithPath(
      session,
      'marketplaceBookings',
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.error || `External service error: ${response.status}`,
          errorMessage: `Failed to fetch bookings from external service`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Bookings API: External API response:", data);

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching bookings:", error);
    
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

// POST /api/marketplace/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Bookings API: Creating booking:", body);
    
    // Make request to external API using proper authentication
    const response = await makeAuthenticatedRequestWithPath(
      session,
      'marketplaceBookings',
      [],
      {},
      {
        method: "POST",
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.error || `External service error: ${response.status}`,
          errorMessage: `Failed to create booking in external service`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Bookings API: External API response:", data);

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error("Error creating booking:", error);
    
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
