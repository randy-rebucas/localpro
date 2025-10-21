import { NextResponse } from "next/server";

// Simple mock data
const mockServices = [
  {
    id: "1",
    name: "Professional House Cleaning",
    description: "Complete house cleaning service including kitchen, bathrooms, living areas, and bedrooms.",
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
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
    ],
    rating: 4.8,
    reviewCount: 127,
    isAvailable: true,
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    name: "Emergency Plumbing Repair",
    description: "24/7 emergency plumbing services for leaks, clogs, and repairs.",
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
  }
];

// GET /api/marketplace/services-simple - Simple services endpoint
export async function GET() {
  console.log("Simple API: Fetching services...");
  
  try {
    return NextResponse.json({
      services: mockServices,
      total: mockServices.length,
      page: 1,
      limit: 20
    });
  } catch (error) {
    console.error("Simple API: Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
