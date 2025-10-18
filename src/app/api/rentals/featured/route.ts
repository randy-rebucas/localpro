import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

// GET /api/rentals/featured - Get featured rentals
export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rentals/featured`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch featured rentals" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching featured rentals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
