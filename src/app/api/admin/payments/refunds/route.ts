import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath, handleApiRoute } from "@/lib/api-auth-utils";

// GET /api/admin/payments/refunds - Get refunds
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
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query parameters
    const queryParams: Record<string, string> = {
      page,
      limit,
      sortBy,
      sortOrder
    };

    if (status && status !== 'all') queryParams.status = status;
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    // Make authenticated request to get refunds
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'financeTransactions',
      [],
      { ...queryParams, type: 'refund' },
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  }, "Refunds fetch");

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

// POST /api/admin/payments/refunds - Process refund
export async function POST(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Check if user has admin access
    if (session.user.role !== 'admin') {
      throw new Error("Admin access required");
    }

    const body = await request.json();
    const { transactionId, amount, reason, notes } = body;

    // Validate required fields
    if (!transactionId || !amount || !reason) {
      throw new Error("Missing required fields: transactionId, amount, reason");
    }

    // Make authenticated request to process refund
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'financeTransactions',
      [transactionId, 'refund'],
      {},
      { 
        method: 'POST',
        body: JSON.stringify({ amount, reason, notes })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  }, "Refund processing");

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
