import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { z } from "zod";
import { createSession, createSessionCookie, createApiTokenCookie } from "@/lib/session";

const verifyCodeSchema = z.object({
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  code: z.string().min(4, "Please enter a valid verification code"),
});

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Verify-code API called");
    console.log("🔍 Environment variables:", {
      NODE_ENV: process.env.NODE_ENV,
      API_BASE_URL: process.env.API_BASE_URL,
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL
    });
    
    const body = await request.json();
    const { phoneNumber, code } = verifyCodeSchema.parse(body);
    console.log("phoneNumber", phoneNumber);
    console.log("code", code);
    // Check if we're in development mode and API is not available
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isApiAvailable = API_BASE_URL && API_BASE_URL !== '' && API_BASE_URL !== 'undefined';

    console.log("Environment check:", { isDevelopment, isApiAvailable, API_BASE_URL });

    // For development, if no API base URL is set, use mock response
    if (isDevelopment && !isApiAvailable) {
      console.log("Development mode: Using mock response for verify-code");
      
      // Mock verification - accept any 6-digit code
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        // Create a mock user session
        const mockUser = {
          id: 'mock-user-123',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: phoneNumber,
          role: 'user'
        };
        
        const mockToken = 'mock-jwt-token-123';
        
        // Get request metadata for session security
        const userAgent = request.headers.get("user-agent") || undefined;
        const ipAddress = request.headers.get("x-forwarded-for") || 
                         request.headers.get("x-real-ip") || 
                         undefined;

        // Create unique session with security features
        const { encryptedSession } = await createSession({
          userId: mockUser.id,
          email: mockUser.email,
          name: `${mockUser.firstName} ${mockUser.lastName}`,
          role: mockUser.role,
          phone: mockUser.phoneNumber,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          apiToken: mockToken,
        }, userAgent, ipAddress);
        
        // Create session cookie with the encrypted session data
        const sessionCookie = createSessionCookie(encryptedSession);
        
        // Create API token cookie for client-side access
        const apiTokenCookie = createApiTokenCookie(mockToken);
        
        const response_data = NextResponse.json(
          { 
            success: true, 
            message: "Verification successful (mock)",
            user: mockUser,
            token: mockToken
          },
          { status: 200 }
        );

        // Set both cookies
        response_data.headers.set('Set-Cookie', sessionCookie);
        response_data.headers.append('Set-Cookie', apiTokenCookie);

        return response_data;
      } else {
        return NextResponse.json(
          { error: "Invalid verification code (mock)" },
          { status: 400 }
        );
      }
    }

    const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.authVerifyCode}`;
    console.log("Attempting to call API:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        code,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to verify code" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract user data and token from the API response
    const { user, token } = data;

    // Get request metadata for session security
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     undefined;

    // Create unique session with security features
    const { encryptedSession } = await createSession({
      userId: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: user.role,
      phone: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      // Store the actual API token in the session data
      apiToken: token, // This is the real token from the external API
    }, userAgent, ipAddress);
    
    // Create session cookie with the encrypted session data
    const sessionCookie = createSessionCookie(encryptedSession);
    
    // Create API token cookie for client-side access
    const apiTokenCookie = createApiTokenCookie(token);

    // Return success response with the actual API token
    const response_data = NextResponse.json(
      { 
        success: true,
        message: "Verification successful",
        token: token, // This is the actual token from the external API
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

    // Set both cookies
    response_data.headers.set('Set-Cookie', sessionCookie);
    response_data.headers.append('Set-Cookie', apiTokenCookie);

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
