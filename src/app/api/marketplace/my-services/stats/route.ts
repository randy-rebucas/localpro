import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

// Mock statistics data
const mockStats = {
  totalServices: 3,
  activeServices: 2,
  totalBookings: 77,
  totalEarnings: 13150,
  averageRating: 4.85
};

// GET /api/marketplace/my-services/stats - Get user's service statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    // For development, allow unauthenticated requests
    const isAuthenticated = !!session?.user?.id;
    
    // Try to fetch from external API first (only if authenticated), fallback to mock data
    if (isAuthenticated) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/marketplace/my-services/stats`, {
          headers: {
            "Authorization": `Bearer ${session.user.id}`,
            "Content-Type": "application/json"
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (fetchError) {
        console.log("External API unavailable, using mock stats:", fetchError);
      }
    }

    // Return mock data
    console.log("API: Returning mock service statistics");
    return NextResponse.json(mockStats);

  } catch (error) {
    console.error("Error fetching service statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
