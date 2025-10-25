import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// GET /api/admin/marketplace - Fetch marketplace services with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin access
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query parameters for the backend API
    const queryParams: Record<string, string> = {
      page,
      limit,
      sortBy,
      sortOrder
    };

    if (search) queryParams.search = search;
    if (category && category !== 'all') queryParams.category = category;
    if (status && status !== 'all') queryParams.status = status;

    // Make authenticated request to the backend API
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'marketplaceServices', // Using the marketplace services endpoint from API_ENDPOINTS
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch marketplace services from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching marketplace services:', error);
    
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

// POST /api/admin/marketplace - Create a new marketplace service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category, price, providerId, status = 'pending' } = body;

    // Validate required fields
    if (!name || !description || !category || !price || !providerId) {
      return NextResponse.json(
        { error: 'Name, description, category, price, and provider ID are required' },
        { status: 400 }
      );
    }

    // Make authenticated request to the backend API to create marketplace service
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'marketplaceServices', // Using the marketplace services endpoint from API_ENDPOINTS
      [],
      {},
      { 
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to create marketplace service in backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error creating marketplace service:', error);
    
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
