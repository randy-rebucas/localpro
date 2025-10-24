import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// GET /api/plus/usage - Get LocalPro Plus usage statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'localProPlusUsage',
      [], // No path parameters
      queryParams, // Query parameters
      { method: 'GET' }
    );

    if (!response.ok) {
      // Return default values when external API fails
      return NextResponse.json({
        success: true,
        stats: {
          totalSubscribers: 0,
          activeSubscriptions: 0,
          monthlyRevenue: 0,
          averageRating: 0
        }
      });
    }

    const data = await response.json();
    
    // Ensure the response has the expected structure
    const formattedData = {
      success: true,
      stats: {
        totalSubscribers: data.stats?.totalSubscribers || 0,
        activeSubscriptions: data.stats?.activeSubscriptions || 0,
        monthlyRevenue: data.stats?.monthlyRevenue || 0,
        averageRating: data.stats?.averageRating || 0
      }
    };
    
    return NextResponse.json(formattedData);

  } catch (error) {
    console.error("Error fetching usage data:", error);
    
    // Return default values when any error occurs
    return NextResponse.json({
      success: true,
      stats: {
        totalSubscribers: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        averageRating: 0
      }
    });
  }
}
