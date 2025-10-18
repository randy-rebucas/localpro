import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";
import { apiProxy } from "@/lib/api-proxy";

// GET /api/jobs/[id] - Get specific job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${params.id}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch job" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id] - Update job (Provider/Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
    const session = await getServerSession(request);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return apiProxy(request, `${API_BASE_URL}/api/jobs/${params.id}`, session.user.id);
}

// DELETE /api/jobs/[id] - Delete job (Provider/Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
    const session = await getServerSession(request);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return apiProxy(request, `${API_BASE_URL}/api/jobs/${params.id}`, session.user.id);
}
