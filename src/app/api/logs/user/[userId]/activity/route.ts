import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

// GET /api/logs/user/[userId]/activity - Get user activity logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(request);
    // Derive bearer from cookie if present, otherwise from session
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieToken = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('session='))
      ?.split('=')[1] || null;
    const bearer = cookieToken || session?.user?.id || null;

    if (!bearer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Forward the request to the external API
    const response = await fetch(`${API_BASE_URL}/api/logs/user/${userId}/activity?${queryString}`, {
      headers: {
        "Authorization": `Bearer ${bearer}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch user activity logs" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching user activity logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

