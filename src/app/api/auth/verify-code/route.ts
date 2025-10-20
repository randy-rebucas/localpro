import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";
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

    const response = await fetch(`${API_BASE_URL}/api/auth/verify-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to verify code" },
        { status: response.status }
      );
    }

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
