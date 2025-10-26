import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    // Fetch real plus data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'subscriptions') {
        // Fetch plus subscriptions with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'localProPlusMySubscription',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch plus subscriptions: ${response.status}`);
        }

        const subscriptionsData = await response.json();
        return {
          data: subscriptionsData.data || subscriptionsData,
          pagination: subscriptionsData.pagination || {
            page,
            limit,
            total: subscriptionsData.total || 0,
            pages: Math.ceil((subscriptionsData.total || 0) / limit)
          }
        };
      } else if (type === 'plans') {
        // Fetch plus plans
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'localProPlusPlans',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch plus plans: ${response.status}`);
        }

        const plansData = await response.json();
        return {
          data: plansData.data || plansData,
          pagination: undefined
        };
      } else {
        // Fetch plus overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'localProPlusAnalytics',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch plus statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Plus data");

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
    console.error('Plus admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plus data' },
      { status: 500 }
    );
  }
}
