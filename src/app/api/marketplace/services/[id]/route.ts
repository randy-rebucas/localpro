import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

// GET /api/marketplace/services/[id] - Get specific service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/marketplace/services/${params.id}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch service" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
