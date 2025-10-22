import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

// GET /api/communication/notifications/count - Get notification count
export async function GET(request: NextRequest) {
  try {
    console.log("Count API - Request headers:", {
      authorization: request.headers.get('authorization'),
      cookie: request.headers.get('cookie'),
      userAgent: request.headers.get('user-agent')
    });
    
    const session = await getServerSession(request);
    
    console.log("Count API - Session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.id) {
      console.log("Count API - No session or user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${API_BASE_URL}/api/communication/notifications/count`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.user.id}`,
      },
    });

    const data = await response.json();
    console.log("Count API - Response:", data);
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch notification count" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
