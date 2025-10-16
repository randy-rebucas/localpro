import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";
import { z } from "zod";

const sendCodeSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(["email", "phone"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, type } = sendCodeSchema.parse(body);

    const response = await fetch(`${API_BASE_URL}/api/auth/send-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        phone,
        type,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to send verification code" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
