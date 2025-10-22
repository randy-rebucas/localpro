import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';
import { getServerSession } from '@/lib/server-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    // Build query parameters for external API
    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams();
    
    // Add any query parameters from the request
    for (const [key, value] of searchParams.entries()) {
      queryParams.append(key, value);
    }

    // Make request to external API
    const response = await fetch(`${API_BASE_URL}/api/announcements?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${session?.user?.id || ''}`,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      return NextResponse.json(
        { 
          success: false,
          error: `External service error: ${response.status}`,
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

    // Make request to external API
    const response = await fetch(`${API_BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${session.user.id}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000)
    });

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

    return NextResponse.json(data, { status: response.status });

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