import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(["CLEANING", "PLUMBING", "ELECTRICAL", "MOVING"]),
  price: z.number().positive(),
  duration: z.number().positive(),
});


// GET /api/marketplace/services - Get all services
export async function GET(request: NextRequest) {
  try {
    console.log("API: Fetching services...");
    const session = await getServerSession(request);
    console.log("API: Session:", session);
    
    // For development, allow unauthenticated requests for public marketplace
    // In production, you might want to require authentication for certain features

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const location = searchParams.get('location');
    const minRating = searchParams.get('minRating');
    const rating = searchParams.get('rating'); // Alternative to minRating
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const available = searchParams.get('available');
    const sort = searchParams.get('sort');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    const coordinates = searchParams.get('coordinates');
    const radius = searchParams.get('radius');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log("API: Query parameters:", { 
      category, search, location, minRating, rating, minPrice, maxPrice, 
      available, sort, sortBy, sortOrder, coordinates, radius, page, limit 
    });

    // Build query parameters for external API
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    if (search) queryParams.append('search', search);
    if (location) queryParams.append('location', location);
    if (minRating) queryParams.append('minRating', minRating);
    if (rating) queryParams.append('rating', rating);
    if (minPrice) queryParams.append('minPrice', minPrice);
    if (maxPrice) queryParams.append('maxPrice', maxPrice);
    if (available) queryParams.append('available', available);
    if (sort) queryParams.append('sort', sort);
    if (sortBy) queryParams.append('sortBy', sortBy);
    if (sortOrder) queryParams.append('sortOrder', sortOrder);
    if (coordinates) queryParams.append('coordinates', coordinates);
    if (radius) queryParams.append('radius', radius);
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());

    // Make request to external API using proper authentication with API constants
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const response = await makeAuthenticatedRequestWithPath(
      session,
      'marketplaceServices',
      [],
      Object.fromEntries(queryParams.entries()),
      { method: 'GET' }
    );

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
    console.log("API: External API response:", data);

    return NextResponse.json(data);

  } catch (error) {
    console.error("API: Error fetching services:", error);
    
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

// POST /api/marketplace/services - Create a new service
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
    const { name, description, category, price, duration } = serviceSchema.parse(body);

    const response = await makeAuthenticatedRequestWithPath(
      session,
      'marketplaceServices',
      [],
      {},
      {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          category,
          price,
          duration,
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.error || `External service error: ${response.status}`,
          errorMessage: "Failed to create service in external service"
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating service:", error);
    
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
