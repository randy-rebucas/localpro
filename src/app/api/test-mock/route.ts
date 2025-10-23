import { NextResponse } from "next/server";

export async function GET() {
  // Test mock data response
  const mockUserData = {
    id: "68f7265e60f48a4fd66ef03d",
    email: "test@example.com",
    name: "Test User",
    firstName: "Test",
    lastName: "User",
    phone: "+1234567890",
    bio: "Professional service provider",
    location: "New York, NY",
    website: "https://example.com",
    skills: ["Web Development", "Design"],
    experience: "5+ years",
    avatar: null,
    portfolio: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isVerified: false,
    role: "provider"
  };
  
  return NextResponse.json(mockUserData);
}
