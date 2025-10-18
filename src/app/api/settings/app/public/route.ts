import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

// GET /api/settings/app/public - Get public app settings
export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/app/public`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch public app settings" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching public app settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
