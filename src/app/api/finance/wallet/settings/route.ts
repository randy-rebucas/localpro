import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

// PUT /api/finance/wallet/settings - Update wallet settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const response = await makeAuthenticatedRequestWithEndpoint(
      session,
      'financeWalletSettings',
      {
        method: 'PUT',
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to update wallet settings" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating wallet settings:", error);
    
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
