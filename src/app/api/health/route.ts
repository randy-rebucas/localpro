import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

export async function GET(_request: NextRequest) {
  try {
    // Test connectivity to external API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return NextResponse.json({
        status: "healthy",
        externalApi: {
          reachable: true,
          status: response.status,
          responseTime: Date.now(),
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      return NextResponse.json({
        status: "degraded",
        externalApi: {
          reachable: false,
          error: fetchError instanceof Error ? fetchError.message : "Unknown error",
        },
      }, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
