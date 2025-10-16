import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { API_BASE_URL } from "@/lib/api";
import { authOptions } from "@/lib/auth";

// POST /api/marketplace/bookings/paypal/approve - Approve PayPal booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/marketplace/bookings/paypal/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.user.id}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to approve PayPal booking" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error approving PayPal booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
