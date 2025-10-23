import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Build query parameters for external API
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Make request to external API using new approach
    const response = await makeAuthenticatedRequestWithPath(
      session,
      'announcements',
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false,
          error: errorData.error || `External service error: ${response.status}`,
          errorMessage: `Failed to fetch announcements from external service`,
          announcements: []
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Announcements API: External API response:", data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching announcements:', error);
    
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
        success: false,
        error: errorMessage,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        announcements: []
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'message', 'type', 'priority'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Make request to external API using new approach
    const response = await makeAuthenticatedRequestWithPath(
      session,
      'announcements',
      [],
      {},
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false,
          error: errorData.error || `External service error: ${response.status}`,
          errorMessage: "Failed to create announcement in external service"
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Announcements API: External API response:", data);

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error creating announcement:', error);
    
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
        success: false,
        error: errorMessage,
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      },
      { status: statusCode }
    );
  }
}