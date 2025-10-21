import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

// Mock data for user's bookings
const mockUserBookings = [
  {
    id: "booking-1",
    service: {
      id: "service-1",
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
    status: "COMPLETED",
    date: "2024-01-15",
    time: "10:00",
    duration: 180,
    totalPrice: 150,
    notes: "Please focus on the kitchen and bathrooms",
    contactPhone: "+1 (555) 987-6543",
    contactEmail: "client@email.com",
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z",
    paymentStatus: "PAID",
    userType: "client" // client or provider
  },
  {
    id: "booking-2",
    service: {
      id: "service-2",
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
    status: "IN_PROGRESS",
    date: "2024-01-20",
    time: "14:30",
    duration: 120,
    totalPrice: 200,
    notes: "Kitchen sink is completely blocked",
    contactPhone: "+1 (555) 876-5432",
    contactEmail: "client2@email.com",
    createdAt: "2024-01-18T09:15:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    paymentStatus: "PAID",
    userType: "client"
  },
  {
    id: "booking-3",
    service: {
      id: "service-3",
      name: "Electrical Installation",
      category: "ELECTRICAL",
      price: 175,
      duration: 150,
      provider: {
        id: "current-user",
        name: "Current User",
        phone: "+1 (555) 345-6789",
        email: "current.user@email.com",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      }
    },
    status: "CONFIRMED",
    date: "2024-01-25",
    time: "09:00",
    duration: 150,
    totalPrice: 175,
    notes: "Install new outlets in living room",
    contactPhone: "+1 (555) 765-4321",
    contactEmail: "client3@email.com",
    createdAt: "2024-01-22T11:20:00Z",
    updatedAt: "2024-01-22T11:20:00Z",
    paymentStatus: "PENDING",
    userType: "provider"
  },
  {
    id: "booking-4",
    service: {
      id: "service-4",
      name: "Full Service Moving",
      category: "MOVING",
      price: 500,
      duration: 480,
      provider: {
        id: "current-user",
        name: "Current User",
        phone: "+1 (555) 456-7890",
        email: "current.user@email.com",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      }
    },
    status: "PENDING",
    date: "2024-01-30",
    time: "08:00",
    duration: 480,
    totalPrice: 500,
    notes: "Moving from downtown to suburbs",
    contactPhone: "+1 (555) 654-3210",
    contactEmail: "client4@email.com",
    createdAt: "2024-01-25T15:45:00Z",
    updatedAt: "2024-01-25T15:45:00Z",
    paymentStatus: "PENDING",
    userType: "provider"
  },
  {
    id: "booking-5",
    service: {
      id: "service-1",
      name: "Professional House Cleaning",
      category: "CLEANING",
      price: 150,
      duration: 180,
      provider: {
        id: "current-user",
        name: "Current User",
        phone: "+1 (555) 567-8901",
        email: "current.user@email.com",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      }
    },
    status: "CANCELLED",
    date: "2024-01-12",
    time: "11:00",
    duration: 180,
    totalPrice: 150,
    notes: "Client cancelled due to emergency",
    contactPhone: "+1 (555) 543-2109",
    contactEmail: "client5@email.com",
    createdAt: "2024-01-08T16:30:00Z",
    updatedAt: "2024-01-12T10:00:00Z",
    paymentStatus: "REFUNDED",
    userType: "provider"
  }
];

// GET /api/marketplace/my-bookings - Get user's bookings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    // For development, allow unauthenticated requests
    const isAuthenticated = !!session?.user?.id;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // client or provider
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Filter mock data based on query parameters
    let filteredBookings = [...mockUserBookings];
    
    // Filter by user type (client or provider)
    if (type) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.userType.toLowerCase() === type.toLowerCase()
      );
    }
    
    // Filter by status
    if (status && status !== 'all') {
      filteredBookings = filteredBookings.filter(booking => 
        booking.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    // Filter by date range
    if (dateFrom) {
      filteredBookings = filteredBookings.filter(booking => 
        new Date(booking.date) >= new Date(dateFrom)
      );
    }
    
    if (dateTo) {
      filteredBookings = filteredBookings.filter(booking => 
        new Date(booking.date) <= new Date(dateTo)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

    // Try to fetch from external API first (only if authenticated), fallback to mock data
    if (isAuthenticated) {
      try {
        const queryString = searchParams.toString();
        const response = await fetch(`${API_BASE_URL}/api/marketplace/my-bookings?${queryString}`, {
          headers: {
            "Authorization": `Bearer ${session.user.id}`,
            "Content-Type": "application/json"
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (fetchError) {
        console.log("External API unavailable, using mock data:", fetchError);
      }
    }

    // Return mock data with pagination info
    console.log("API: Returning mock user bookings with", paginatedBookings.length, "bookings");
    return NextResponse.json({
      bookings: paginatedBookings,
      total: filteredBookings.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(filteredBookings.length / limit)
    });

  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
