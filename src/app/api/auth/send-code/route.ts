import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";
import { z } from "zod";

const sendCodeSchema = z.object({
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
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
    const { phoneNumber } = sendCodeSchema.parse(body);

    try {
      const response = await makeApiRequestWithRetry(`${API_BASE_URL}/api/auth/send-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.error || "Failed to send verification code" },
          { status: response.status }
        );
      }

      return NextResponse.json(data, { status: response.status });
    } catch (fetchError) {
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
          { error: "Unable to connect to verification service - please try again later" },
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
