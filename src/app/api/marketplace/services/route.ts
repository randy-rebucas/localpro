import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(["CLEANING", "PLUMBING", "ELECTRICAL", "MOVING"]),
  price: z.number().positive(),
  duration: z.number().positive(),
});

// GET /api/marketplace/services - Get all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const response = await fetch(`${API_BASE_URL}/api/marketplace/services?${queryString}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch services" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, price, duration } = serviceSchema.parse(body);

    const response = await fetch(`${API_BASE_URL}/api/marketplace/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        category,
        price,
        duration,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to create service" },
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

    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
