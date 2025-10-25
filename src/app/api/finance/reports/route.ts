import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath, handleApiRoute } from "@/lib/api-auth-utils";

// GET /api/finance/reports - Get financial reports
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'summary';
    const format = searchParams.get('format') || 'json';

    // Build query parameters
    const queryParams: Record<string, string> = {
      type,
      format
    };

    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    // Make authenticated request to the finance reports endpoint
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'financeReports',
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  }, "Finance reports fetch");

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