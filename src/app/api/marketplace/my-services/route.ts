import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

// Mock data for user's services
const mockUserServices = [
  {
    id: "user-service-1",
    name: "Professional House Cleaning",
    description: "Complete house cleaning service including kitchen, bathrooms, living areas, and bedrooms. We use eco-friendly products and provide all cleaning supplies.",
    category: "CLEANING",
    price: 150,
    duration: 180,
    status: "ACTIVE",
    rating: 4.8,
    reviewCount: 127,
    bookingCount: 45,
    totalEarnings: 6750,
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1581578731548-c6a0c3f2f6b4?w=400&h=300&fit=crop"
    ],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z"
  },
  {
    id: "user-service-2",
    name: "Emergency Plumbing Repair",
    description: "24/7 emergency plumbing services for leaks, clogs, and repairs. Licensed plumber with 10+ years experience. Same-day service available.",
    category: "PLUMBING",
    price: 200,
    duration: 120,
    status: "ACTIVE",
    rating: 4.9,
    reviewCount: 89,
    bookingCount: 32,
    totalEarnings: 6400,
    images: [
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop"
    ],
    createdAt: "2024-01-10T14:30:00Z",
    updatedAt: "2024-01-18T09:15:00Z"
  },
  {
    id: "user-service-3",
    name: "Electrical Installation",
    description: "Professional electrical services including outlet installation, lighting, and electrical repairs. Fully licensed and insured electrician.",
    category: "ELECTRICAL",
    price: 175,
    duration: 150,
    status: "PENDING",
    rating: 0,
    reviewCount: 0,
    bookingCount: 0,
    totalEarnings: 0,
    images: [],
    createdAt: "2024-01-22T11:20:00Z",
    updatedAt: "2024-01-22T11:20:00Z"
  }
];

// GET /api/marketplace/my-services - Get user's services
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    // For development, allow unauthenticated requests
    // In production, you might want to require authentication
    const isAuthenticated = !!session?.user?.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Filter mock data based on query parameters
    let filteredServices = [...mockUserServices];
    
    // Filter by status
    if (status && status !== 'all') {
      filteredServices = filteredServices.filter(service => 
        service.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    // Filter by category
    if (category) {
      filteredServices = filteredServices.filter(service => 
        service.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedServices = filteredServices.slice(startIndex, endIndex);

    // Try to fetch from external API first (only if authenticated), fallback to mock data
    if (isAuthenticated) {
      try {
        const queryString = searchParams.toString();
        const response = await fetch(`${API_BASE_URL}/api/marketplace/my-services?${queryString}`, {
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
    console.log("API: Returning mock user services with", paginatedServices.length, "services");
    return NextResponse.json({
      services: paginatedServices,
      total: filteredServices.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(filteredServices.length / limit)
    });

  } catch (error) {
    console.error("Error fetching user services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
