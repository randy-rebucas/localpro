import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // For now, we'll use the same logic as /api/auth/me
    // In a real implementation, this would fetch from a users table
    // and could be used to fetch other users' profiles as well
    
    if (userId === session.user.id) {
      // Return current user's data
      const userData = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim(),
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        phone: session.user.phone,
        role: session.user.role,
        bio: session.user.bio,
        location: session.user.location,
        website: session.user.website,
        skills: session.user.skills || [],
        experience: session.user.experience,
        avatar: session.user.avatar,
        portfolio: session.user.portfolio || [],
        createdAt: session.user.createdAt || new Date().toISOString(),
        updatedAt: session.user.updatedAt || new Date().toISOString(),
        isVerified: session.user.isVerified || false,
        profileCompleteness: calculateProfileCompleteness(session.user)
      };

      return NextResponse.json(userData);
    } else {
      // For other users, return public profile data only
      // This would typically fetch from a users table
      return NextResponse.json(
        { error: "User not found or access denied" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Only allow users to update their own profile
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Update user data (in a real implementation, this would update the database)
    const updatedUser = {
      ...session.user,
      ...body,
      updatedAt: new Date().toISOString(),
      profileCompleteness: calculateProfileCompleteness({ ...session.user, ...body })
    };

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateProfileCompleteness(user: Record<string, unknown>): {
  percentage: number;
  completedFields: number;
  totalFields: number;
  missingFields: string[];
  fields: Record<string, { completed: boolean; required: boolean }>;
} {
  const fields = {
    name: { completed: !!(user.name || (user.firstName && user.lastName)), required: true },
    email: { completed: !!user.email, required: true },
    phone: { completed: !!user.phone, required: false },
    bio: { completed: !!user.bio, required: false },
    location: { completed: !!user.location, required: false },
    website: { completed: !!user.website, required: false },
    skills: { completed: !!(user.skills && Array.isArray(user.skills) && user.skills.length > 0), required: false },
    experience: { completed: !!user.experience, required: false },
    avatar: { completed: !!user.avatar, required: false },
    portfolio: { completed: !!(user.portfolio && Array.isArray(user.portfolio) && user.portfolio.length > 0), required: false }
  };

  const completedFields = Object.values(fields).filter(field => field.completed).length;
  const totalFields = Object.keys(fields).length;
  const percentage = Math.round((completedFields / totalFields) * 100);
  
  const missingFields = Object.entries(fields)
    .filter(([, field]) => !field.completed)
    .map(([key]) => key);

  return {
    percentage,
    completedFields,
    totalFields,
    missingFields,
    fields
  };
}
