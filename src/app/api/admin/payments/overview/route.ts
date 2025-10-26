import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath, handleApiRoute } from "@/lib/api-auth-utils";

// GET /api/admin/payments/overview - Get payment processing overview
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
    const period = searchParams.get('period') || '30'; // days
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query parameters
    const queryParams: Record<string, string> = {
      period
    };

    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    // Make authenticated request to the payment overview endpoint
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'financeOverview',
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to include payment processing specific metrics
    return {
      success: true,
      data: {
        totalTransactions: data.data?.totalTransactions || 0,
        totalRevenue: data.data?.totalRevenue || 0,
        pendingPayments: data.data?.pendingPayments || 0,
        failedPayments: data.data?.failedPayments || 0,
        successRate: data.data?.successRate || 0,
        averageTransactionValue: data.data?.averageTransactionValue || 0,
        paymentMethods: data.data?.paymentMethods || [],
        recentTransactions: data.data?.recentTransactions || [],
        dailyStats: data.data?.dailyStats || [],
        monthlyStats: data.data?.monthlyStats || [],
        topPaymentMethods: data.data?.topPaymentMethods || [],
        paymentStatusBreakdown: data.data?.paymentStatusBreakdown || {},
        refunds: data.data?.refunds || 0,
        chargebacks: data.data?.chargebacks || 0,
        processingFees: data.data?.processingFees || 0,
        netRevenue: data.data?.netRevenue || 0
      }
    };
  }, "Payment processing overview fetch");

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
