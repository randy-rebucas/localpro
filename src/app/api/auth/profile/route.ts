import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { API_BASE_URL } from "@/lib/api";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updateData = updateProfileSchema.parse(body);

    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.user.id}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to update profile" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
