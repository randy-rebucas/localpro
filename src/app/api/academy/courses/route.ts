import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";



// GET /api/academy/courses - Get all courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const response = await fetch(`${API_BASE_URL}/api/academy/courses?${queryString}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch courses" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/academy/courses - Create course (Instructor/Admin)
export async function POST(request: NextRequest) {
  const session = await getServerSession(request);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

    try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/academy/courses`, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.user.id}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Request failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error in ${request.method} /api/academy/courses:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
