import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

// GET /api/supplies/featured - Get featured supplies
export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/supplies/featured`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch featured supplies" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching featured supplies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
