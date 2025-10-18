import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

// DELETE /api/ads/[id]/images/[imageId] - Delete ad image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const session = await getServerSession(request);
    const { id, imageId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${API_BASE_URL}/api/ads/${id}/images/${imageId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${session.user.id}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to delete ad image" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting ad image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
