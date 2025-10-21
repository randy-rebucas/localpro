import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";
import { getSessionToken } from "@/lib/auth-utils";

// GET /api/search/suggestions - Search suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    const sessionToken = getSessionToken();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("token", sessionToken);
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const response = await fetch(`${API_BASE_URL}/api/search/suggestions?${queryString}`, {
      headers: {
        "Authorization": `Bearer ${sessionToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch search suggestions" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
