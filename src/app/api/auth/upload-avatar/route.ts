import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { API_BASE_URL } from "@/lib/api";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const response = await fetch(`${API_BASE_URL}/api/auth/upload-avatar`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.user.id}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to upload avatar" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Upload avatar error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
