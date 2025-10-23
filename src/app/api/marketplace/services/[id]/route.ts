import { NextRequest, NextResponse } from "next/server";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

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
      email: "sarah.johnson@email.com",
      phone: "+1 (555) 123-4567",
      rating: 4.8,
      reviewCount: 127,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      bio: "Professional cleaner with 5+ years experience. Specialized in residential cleaning with eco-friendly products.",
      joinedDate: "2023-01-15T10:00:00Z",
      verified: true
    },
    location: {
      city: "New York",
      state: "NY",
      address: "123 Main St, New York, NY 10001"
    },
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1581578731548-c6a0c3f2f6b4?w=400&h=300&fit=crop"
    ],
    rating: 4.8,
    reviewCount: 127,
    isAvailable: true,
    createdAt: "2024-01-15T10:00:00Z",
    features: [
      "Deep cleaning of all rooms",
      "Kitchen and bathroom sanitization",
      "Eco-friendly cleaning products",
      "All supplies included",
      "Satisfaction guarantee"
    ],
    requirements: [
      "Access to water and electricity",
      "Clear access to all areas",
      "Pets should be secured during cleaning"
    ]
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
      email: "mike.rodriguez@email.com",
      phone: "+1 (555) 234-5678",
      rating: 4.9,
      reviewCount: 89,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      bio: "Licensed plumber with 10+ years of experience in residential and commercial plumbing.",
      joinedDate: "2022-06-10T14:30:00Z",
      verified: true
    },
    location: {
      city: "Los Angeles",
      state: "CA",
      address: "456 Oak Ave, Los Angeles, CA 90210"
    },
    images: [
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop"
    ],
    rating: 4.9,
    reviewCount: 89,
    isAvailable: true,
    createdAt: "2024-01-10T14:30:00Z",
    features: [
      "24/7 emergency service",
      "Licensed and insured",
      "Same-day repairs",
      "Quality guarantee",
      "Free estimates"
    ],
    requirements: [
      "Clear access to plumbing fixtures",
      "Water shut-off valve access",
      "Basic tools may be needed"
    ]
  }
];

// GET /api/marketplace/services/[id] - Get specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try to fetch from external API first, fallback to mock data
    try {
      const response = await makeAuthenticatedRequestWithPath(
        { user: { id: 'anonymous' } }, // Public endpoint, no authentication required
        'marketplaceServiceById',
        [id],
        {},
        { method: 'GET' }
      );
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (fetchError) {
      console.log("External API unavailable, using mock data:", fetchError);
    }

    // Find service in mock data
    const service = mockServices.find(s => s.id === id);
    
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "Request timeout - the external service is taking too long to respond";
        statusCode = 504;
      } else if (error.message.includes('fetch failed')) {
        errorMessage = "Unable to connect to external service - please try again later";
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: statusCode }
    );
  }
}
