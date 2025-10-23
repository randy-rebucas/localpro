import { NextRequest, NextResponse } from "next/server";
import { makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";
import { z } from "zod";

const sendCodeSchema = z.object({
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = sendCodeSchema.parse(body);

    // Create a mock session for unauthenticated requests
    const mockSession = { user: { id: 'anonymous' } };

    const response = await makeAuthenticatedRequestWithEndpoint(
      mockSession,
      'authSendCode',
      {
        method: 'POST',
        body: JSON.stringify({ phoneNumber })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to send verification code" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Send code error:", error);
    
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
