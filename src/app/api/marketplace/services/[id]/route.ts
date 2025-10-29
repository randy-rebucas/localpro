import { NextRequest, NextResponse } from "next/server";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// GET /api/marketplace/services/[id] - Get specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try to fetch from external API
    try {
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'marketplaceServiceById',
        [id],
        {},
        { method: 'GET' }
      );
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (fetchError) {
      console.error("External API unavailable:", fetchError);
      return NextResponse.json(
        { error: "Service not available" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error fetching service:", error);
    
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