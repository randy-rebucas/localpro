import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath, handleApiRoute } from "@/lib/api-auth-utils";

// GET /api/admin/payments/transactions - Get payment transactions
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
    const method = searchParams.get('method');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
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
    if (method && method !== 'all') queryParams.method = method;
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    if (search) queryParams.search = search;

    // Make authenticated request to the finance transactions endpoint
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'financeTransactions',
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  }, "Payment transactions fetch");

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

// PATCH /api/admin/payments/transactions - Update transaction status
export async function PATCH(request: NextRequest) {
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
    const { transactionId, status, notes } = body;

    // Validate required fields
    if (!transactionId || !status) {
      throw new Error("Missing required fields: transactionId, status");
    }

    // Make authenticated request to update transaction
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'financeTransactions',
      [transactionId],
      {},
      { 
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  }, "Payment transaction update");

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
