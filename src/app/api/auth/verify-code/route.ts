import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";
import { z } from "zod";

const verifyCodeSchema = z.object({
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  code: z.string().min(4, "Please enter a valid verification code"),
  firstName: z.string().min(1, "Please enter a valid first name"),
  lastName: z.string().min(1, "Please enter a valid last name"),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, code, firstName, lastName, email } = verifyCodeSchema.parse(body);

    const response = await fetch(`${API_BASE_URL}/api/auth/verify-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        code,
        firstName,
        lastName,
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to verify code" },
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

    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
