import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST(_request: NextRequest) {
  try {
    // Create response with cleared session cookie
    const response = NextResponse.json({ 
      message: "Logged out successfully" 
    });

    // Clear the session cookie
    response.headers.set('Set-Cookie', clearSessionCookie());

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
