import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath, handleApiRoute } from "@/lib/api-auth-utils";

// PUT /api/finance/withdrawals/:withdrawalId/process - Process withdrawal (Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ withdrawalId: string }> }
) {
  const result = await handleApiRoute(async () => {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Check if user has admin access
    if (session.user.role !== 'admin') {
      throw new Error("Admin access required");
    }

    const { withdrawalId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.status || !['approved', 'rejected'].includes(body.status)) {
      throw new Error("Missing or invalid status. Must be 'approved' or 'rejected'");
    }

    // Make authenticated request to process withdrawal
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'financeWithdraw',
      [withdrawalId, 'process'],
      {},
      { 
        method: 'PUT',
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  }, "Finance withdrawal processing");

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