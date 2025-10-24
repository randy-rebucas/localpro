import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// POST /api/supplies/bulk - Bulk operations on supplies
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.operation || !body.supplyIds || !Array.isArray(body.supplyIds)) {
      return NextResponse.json(
        { error: "Missing required fields: operation, supplyIds" },
        { status: 400 }
      );
    }

    // Validate operation type
    const validOperations = ['update', 'delete', 'activate', 'deactivate', 'updateInventory'];
    if (!validOperations.includes(body.operation)) {
      return NextResponse.json(
        { error: `Invalid operation. Must be one of: ${validOperations.join(', ')}` },
        { status: 400 }
      );
    }

    const response = await makeAuthenticatedRequestWithPath(
      request,
      'suppliesBulk',
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
        { error: errorData.error || "Failed to perform bulk operation" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error performing bulk operation:", error);
    
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
