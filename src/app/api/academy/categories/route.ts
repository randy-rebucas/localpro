import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

// GET /api/academy/categories - Get course categories
export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/academy/categories`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch course categories" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching course categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
