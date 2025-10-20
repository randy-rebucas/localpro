import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

// GET /api/auth/profile-completeness - Get user profile completeness
export async function GET(request: NextRequest) {
  try {
    // Get session cookie from request (same approach as /api/auth/me)
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionCookie = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('session='))
      ?.split('=')[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decrypt session
    const session = await decrypt(sessionCookie);
    
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use session data directly (same as /api/auth/me)
    const userData = {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      phone: session.phone,
      firstName: session.firstName,
      lastName: session.lastName,
    };
      
    // Calculate profile completeness based on available fields
    const fields = [
      { key: 'firstName', label: 'First Name', value: userData.firstName },
      { key: 'lastName', label: 'Last Name', value: userData.lastName },
      { key: 'email', label: 'Email', value: userData.email },
      { key: 'phone', label: 'Phone Number', value: userData.phone },
      { key: 'name', label: 'Full Name', value: userData.name },
      { key: 'role', label: 'Role', value: userData.role },
    ];

    const completedFields = fields.filter(field => 
      field.value && 
      field.value !== '' && 
      field.value !== null && 
      field.value !== undefined &&
      (Array.isArray(field.value) ? field.value.length > 0 : true)
    );

    const totalFields = fields.length;
    const completedCount = completedFields.length;
    const percentage = Math.round((completedCount / totalFields) * 100);

    const completenessData = {
      percentage,
      completedFields: completedCount,
      totalFields,
      fields: fields.map(field => ({
        ...field,
        completed: completedFields.some(cf => cf.key === field.key)
      })),
      missingFields: fields.filter(field => 
        !completedFields.some(cf => cf.key === field.key)
      ).map(field => field.label)
    };

    return NextResponse.json(completenessData);
  } catch (error) {
    console.error("Error in profile completeness endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
