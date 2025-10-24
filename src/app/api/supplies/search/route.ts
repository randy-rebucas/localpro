import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// GET /api/supplies/search - Advanced search for supplies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate and sanitize search parameters
    const searchQuery = {
      q: queryParams.q || '', // Search query
      category: queryParams.category || '',
      type: queryParams.type || '',
      status: queryParams.status || 'available',
      minPrice: queryParams.minPrice ? parseFloat(queryParams.minPrice) : undefined,
      maxPrice: queryParams.maxPrice ? parseFloat(queryParams.maxPrice) : undefined,
      location: queryParams.location || '',
      radius: queryParams.radius ? parseFloat(queryParams.radius) : 50, // km
      sortBy: queryParams.sortBy || 'createdAt',
      sortOrder: queryParams.sortOrder || 'desc',
      page: queryParams.page ? parseInt(queryParams.page) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      features: queryParams.features ? queryParams.features.split(',') : [],
      tags: queryParams.tags ? queryParams.tags.split(',') : [],
      supplierId: queryParams.supplierId || '',
      verified: queryParams.verified === 'true',
      inStock: queryParams.inStock === 'true'
    };

    const response = await makeAuthenticatedRequestWithPath(
      request,
      'suppliesSearch',
      [],
      searchQuery,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to search supplies" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error searching supplies:", error);
    
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
