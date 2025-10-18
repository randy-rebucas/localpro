import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

// PUT /api/jobs/[id]/applications/[applicationId]/status - Update application status (Provider/Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const session = await getServerSession(request);
    const { id, applicationId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/jobs/${id}/applications/${applicationId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.user.id}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to update application status" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
