import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";
import { getServerSession } from "@/lib/server-session";
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(["CLEANING", "PLUMBING", "ELECTRICAL", "MOVING"]),
  price: z.number().positive(),
  duration: z.number().positive(),
});

// Mock data for development
const mockServices = [
  {
    id: "1",
    name: "Professional House Cleaning",
    description: "Complete house cleaning service including kitchen, bathrooms, living areas, and bedrooms. We use eco-friendly products and provide all cleaning supplies.",
    category: "CLEANING",
    price: 150,
    duration: 180,
    provider: {
      id: "provider-1",
      name: "Sarah Johnson",
      rating: 4.8,
      reviewCount: 127,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    location: {
      city: "New York",
      state: "NY"
    },
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1581578731548-c6a0c3f2f6b4?w=400&h=300&fit=crop"
    ],
    rating: 4.8,
    reviewCount: 127,
    isAvailable: true,
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    name: "Emergency Plumbing Repair",
    description: "24/7 emergency plumbing services for leaks, clogs, and repairs. Licensed plumber with 10+ years experience. Same-day service available.",
    category: "PLUMBING",
    price: 200,
    duration: 120,
    provider: {
      id: "provider-2",
      name: "Mike Rodriguez",
      rating: 4.9,
      reviewCount: 89,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    location: {
      city: "Los Angeles",
      state: "CA"
    },
    images: [
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop"
    ],
    rating: 4.9,
    reviewCount: 89,
    isAvailable: true,
    createdAt: "2024-01-10T14:30:00Z"
  },
  {
    id: "3",
    name: "Electrical Installation",
    description: "Professional electrical services including outlet installation, lighting, and electrical repairs. Fully licensed and insured electrician.",
    category: "ELECTRICAL",
    price: 175,
    duration: 150,
    provider: {
      id: "provider-3",
      name: "David Chen",
      rating: 4.7,
      reviewCount: 156,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    location: {
      city: "Chicago",
      state: "IL"
    },
    images: [
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=300&fit=crop"
    ],
    rating: 4.7,
    reviewCount: 156,
    isAvailable: true,
    createdAt: "2024-01-08T09:15:00Z"
  },
  {
    id: "4",
    name: "Full Service Moving",
    description: "Complete moving service including packing, loading, transportation, and unpacking. We handle everything from start to finish.",
    category: "MOVING",
    price: 500,
    duration: 480,
    provider: {
      id: "provider-4",
      name: "Moving Pros LLC",
      rating: 4.6,
      reviewCount: 203,
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face"
    },
    location: {
      city: "Houston",
      state: "TX"
    },
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
    ],
    rating: 4.6,
    reviewCount: 203,
    isAvailable: true,
    createdAt: "2024-01-05T11:20:00Z"
  }
];

// GET /api/marketplace/services - Get all services
export async function GET(request: NextRequest) {
  try {
    console.log("API: Fetching services...");
    const session = await getServerSession(request);
    console.log("API: Session:", session);
    
    if (!session?.user?.id) {
      console.log("API: No session or user ID");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const location = searchParams.get('location');
    const minRating = searchParams.get('minRating');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const available = searchParams.get('available');
    const sort = searchParams.get('sort');

    console.log("API: Query parameters:", { category, search, location, minRating, minPrice, maxPrice, available, sort });

    // Filter mock data based on query parameters
    let filteredServices = [...mockServices];

    if (category) {
      filteredServices = filteredServices.filter(service => service.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredServices = filteredServices.filter(service => 
        service.name.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower)
      );
    }

    if (location) {
      const locationLower = location.toLowerCase();
      filteredServices = filteredServices.filter(service => 
        service.location.city.toLowerCase().includes(locationLower) ||
        service.location.state.toLowerCase().includes(locationLower)
      );
    }

    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      filteredServices = filteredServices.filter(service => service.rating >= minRatingNum);
    }

    if (minPrice) {
      const minPriceNum = parseFloat(minPrice);
      filteredServices = filteredServices.filter(service => service.price >= minPriceNum);
    }

    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      filteredServices = filteredServices.filter(service => service.price <= maxPriceNum);
    }

    if (available === 'true') {
      filteredServices = filteredServices.filter(service => service.isAvailable);
    }

    // Sort services
    if (sort) {
      switch (sort) {
        case 'price_low':
          filteredServices.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          filteredServices.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filteredServices.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          filteredServices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        default:
          // Default sorting by relevance (rating + review count)
          filteredServices.sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount));
      }
    }

    // Try to fetch from external API first, fallback to mock data
    try {
      const queryString = searchParams.toString();
      const response = await fetch(`${API_BASE_URL}/api/marketplace/services?${queryString}`, {
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

    // Return mock data
    console.log("API: Returning mock data with", filteredServices.length, "services");
    const response = {
      services: filteredServices,
      total: filteredServices.length,
      page: 1,
      limit: 20
    };
    
    console.log("API: Response data:", JSON.stringify(response, null, 2));
    return NextResponse.json(response);

  } catch (error) {
    console.error("API: Error fetching services:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/services - Create a new service
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
    const { name, description, category, price, duration } = serviceSchema.parse(body);

    const response = await fetch(`${API_BASE_URL}/api/marketplace/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.user.id}`,
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
