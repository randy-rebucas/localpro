import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { z } from "zod";

const sendCodeSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .transform((val) => val.trim()) // Remove leading/trailing whitespace
    .refine((val) => val.length > 0, "Phone number cannot be empty")
    .refine((val) => {
      // Remove all non-digit characters except + for validation
      const digits = val.replace(/[^\d+]/g, '');
      return digits.length >= 10 && digits.length <= 15;
    }, "Phone number must be between 10 and 15 digits")
    .refine((val) => {
      // Must start with + for international format
      return val.startsWith('+');
    }, "Phone number must start with + for international format"),
});

// Helper function to make API request with retry logic
async function makeApiRequestWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Body:", body);
    const { phoneNumber } = sendCodeSchema.parse(body);
    console.log("Phone number:", phoneNumber.trim());

    // // Check if we're in development mode and API is not available
    // const isDevelopment = process.env.NODE_ENV === 'development';
    // const isApiAvailable = API_BASE_URL && API_BASE_URL !== '' && API_BASE_URL !== 'undefined';

    // console.log("Environment check:", { isDevelopment, isApiAvailable, API_BASE_URL });

    // // For development, if no API base URL is set, use mock response
    // if (isDevelopment && !isApiAvailable) {
    //   console.log("Development mode: Using mock response for send-code");
    //   return NextResponse.json(
    //     { 
    //       success: true, 
    //       message: "Verification code sent (mock)",
    //       phoneNumber: phoneNumber
    //     }, 
    //     { status: 200 }
    //   );
    // }

    try {
      const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.authSendCode}`;
      console.log("Attempting to call API:", apiUrl);
      
      const response = await makeApiRequestWithRetry(
        apiUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
        }
      );
      console.log("Send code response:", response);
      const data = await response.json();

      if (!response.ok) {
        console.error(`Backend API error: ${response.status} - ${JSON.stringify(data)}`);
        return NextResponse.json(
          { 
            error: data.error || `Failed to send verification code (${response.status})`,
            details: data.details || `Backend returned ${response.status}: ${response.statusText}`
          },
          { status: response.status }
        );
      }

      return NextResponse.json(data, { status: response.status });
    } catch (fetchError) {
      console.error("Send code fetch error:", fetchError);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("Send code timeout after retries:", fetchError);
        return NextResponse.json(
          { error: "Request timeout - please try again" },
          { status: 408 }
        );
      }
      
      if (fetchError instanceof Error && fetchError.message.includes('fetch failed')) {
        console.error("Send code connection error after retries:", fetchError);
        return NextResponse.json(
          { 
            error: "Unable to connect to verification service - please try again later",
            details: `Connection failed: ${fetchError.message}`
          },
          { status: 503 }
        );
      }
      
      // Handle other network errors
      if (fetchError instanceof Error) {
        return NextResponse.json(
          { 
            error: "Network error occurred",
            details: `Error: ${fetchError.message}`
          },
          { status: 503 }
        );
      }
      
      throw fetchError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
