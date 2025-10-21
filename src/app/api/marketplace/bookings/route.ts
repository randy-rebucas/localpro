import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

// Mock data for development
const mockBookings = [
  {
    id: "booking-1",
    service: {
      id: "1",
      name: "Professional House Cleaning",
      category: "CLEANING",
      price: 150,
      duration: 180,
      provider: {
        id: "provider-1",
        name: "Sarah Johnson",
        phone: "+1 (555) 123-4567",
        email: "sarah.johnson@email.com",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
      }
    },
    status: "CONFIRMED",
    date: "2024-01-25",
    time: "10:00",
    duration: 180,
    totalPrice: 150,
    notes: "Please focus on the kitchen and bathrooms",
    contactPhone: "+1 (555) 987-6543",
    contactEmail: "customer@email.com",
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
    paymentStatus: "PAID",
    paymentMethod: "Credit Card"
  },
  {
    id: "booking-2",
    service: {
      id: "2",
      name: "Emergency Plumbing Repair",
      category: "PLUMBING",
      price: 200,
      duration: 120,
      provider: {
        id: "provider-2",
        name: "Mike Rodriguez",
        phone: "+1 (555) 234-5678",
        email: "mike.rodriguez@email.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      }
    },
    status: "COMPLETED",
    date: "2024-01-18",
    time: "14:00",
    duration: 120,
    totalPrice: 200,
    notes: "Kitchen sink is completely blocked",
    contactPhone: "+1 (555) 987-6543",
    contactEmail: "customer@email.com",
    createdAt: "2024-01-17T09:00:00Z",
    updatedAt: "2024-01-18T16:00:00Z",
    paymentStatus: "PAID",
    paymentMethod: "PayPal"
  }
];

// GET /api/marketplace/bookings - Get user bookings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Try to fetch from external API first, fallback to mock data
    try {
      const queryString = searchParams.toString();
      const response = await fetch(`${API_BASE_URL}/api/marketplace/bookings?${queryString}`, {
        headers: {
          "Authorization": `Bearer ${session.user.id}`,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (fetchError) {
      console.log("External API unavailable, using mock data:", fetchError);
    }

    // Filter mock data
    let filteredBookings = [...mockBookings];
    if (status && status !== 'all') {
      filteredBookings = filteredBookings.filter(booking => booking.status === status);
    }

    return NextResponse.json(filteredBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Try to create booking via external API first
    try {
      const response = await fetch(`${API_BASE_URL}/api/marketplace/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.user.id}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (fetchError) {
      console.log("External API unavailable, using mock response:", fetchError);
    }

    // Create mock booking response
    const newBooking = {
      id: `booking-${Date.now()}`,
      ...body,
      status: "PENDING",
      paymentStatus: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
