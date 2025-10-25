import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// GET /api/admin/marketplace/stats - Fetch marketplace statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Build query parameters for the backend API
    const queryParams: Record<string, string> = {
      period
    };

    // Make authenticated request to the backend API for marketplace statistics
    // Using analytics endpoint for marketplace statistics
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'analyticsMarketplace', // Using the analytics marketplace endpoint from API_ENDPOINTS
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch marketplace statistics from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching marketplace statistics:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - the external service is taking too long to respond';
        statusCode = 504;
      } else if (error.message.includes('fetch failed')) {
        errorMessage = 'Unable to connect to external service - please try again later';
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
