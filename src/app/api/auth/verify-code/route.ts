import { NextRequest, NextResponse } from "next/server";
import { makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";
import { z } from "zod";
import { encrypt, createSessionCookie, SessionData } from "@/lib/session";

const verifyCodeSchema = z.object({
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  code: z.string().min(4, "Please enter a valid verification code"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, code } = verifyCodeSchema.parse(body);

    const response = await makeAuthenticatedRequestWithEndpoint(
      { user: { id: 'anonymous' } }, // Public endpoint, no authentication required
      'authVerifyCode',
      {
        method: "POST",
        body: JSON.stringify({
          phoneNumber,
          code,
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to verify code" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract user data from the API response
    const { user, token } = data;

    // Create session data from the verified user
    const sessionData: SessionData = {
      userId: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: user.role,
      phone: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Encrypt session data
    const encryptedSession = await encrypt(sessionData);
    
    // Create session cookie
    const sessionCookie = createSessionCookie(encryptedSession);

    // Return success response with session cookie
    const response_data = NextResponse.json(
      { 
        success: true,
        message: "Verification successful",
        token: token,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          subscription: user.subscription
        }
      }, 
      { status: 200 }
    );

    // Set the session cookie
    response_data.headers.set('Set-Cookie', sessionCookie);

    return response_data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Verify code error:", error);
    
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
