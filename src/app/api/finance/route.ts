import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch real finance data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'transactions') {
        // Fetch transactions with query parameters
        const queryParams: Record<string, string> = {};
        if (startDate) queryParams.startDate = startDate;
        if (endDate) queryParams.endDate = endDate;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'financeTransactions',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.status}`);
        }

        const transactionsData = await response.json();
        return {
          data: transactionsData.data || transactionsData,
          pagination: transactionsData.pagination || {
            page,
            limit,
            total: transactionsData.total || 0,
            pages: Math.ceil((transactionsData.total || 0) / limit)
          }
        };
      } else if (type === 'withdrawals') {
        // Fetch withdrawals with query parameters
        const queryParams: Record<string, string> = {};
        if (startDate) queryParams.startDate = startDate;
        if (endDate) queryParams.endDate = endDate;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'financeWithdrawalsProcess',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch withdrawals: ${response.status}`);
        }

        const withdrawalsData = await response.json();
        return {
          data: withdrawalsData.data || withdrawalsData,
          pagination: withdrawalsData.pagination || {
            page,
            limit,
            total: withdrawalsData.total || 0,
            pages: Math.ceil((withdrawalsData.total || 0) / limit)
          }
        };
      } else {
        // Fetch finance overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'financeOverview',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch finance overview: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Finance data");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    const { data, pagination } = result.data || { data: null, pagination: null };

    return NextResponse.json({
      success: true,
      data,
      pagination
    });

  } catch (error) {
    console.error('Finance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance data' },
      { status: 500 }
    );
  }
}
