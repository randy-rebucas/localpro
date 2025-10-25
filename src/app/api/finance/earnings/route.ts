import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath, handleApiRoute } from "@/lib/api-auth-utils";

// GET /api/finance/earnings - Get earnings
export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Check if user has admin access
    if (session.user.role !== 'admin') {
      throw new Error("Admin access required");
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const source = searchParams.get('source');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query parameters
    const queryParams: Record<string, string> = {
      page,
      limit,
      sortBy,
      sortOrder
    };

    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    if (source && source !== 'all') queryParams.source = source;

    // Make authenticated request to the finance earnings endpoint
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'financeEarnings',
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  }, "Finance earnings fetch");

  if (result.error) {
    return NextResponse.json(
      { 
        success: false, 
        error: result.error, 
        details: result.details 
      },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}