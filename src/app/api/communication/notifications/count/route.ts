import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

// GET /api/communication/notifications/count - Get notification count
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    // Try to get bearer from cookie if present
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieToken = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('session='))
      ?.split('=')[1] || null;
    const bearer = cookieToken || session?.user?.id || null;
    if (!bearer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const response = await fetch(`${API_BASE_URL}/api/communication/notifications/count?${queryString}`, {
      headers: {
        "Authorization": `Bearer ${bearer}`,
      },
    });

    const data = await response.json();

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
