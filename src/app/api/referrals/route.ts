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

    // Fetch real referrals data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'referrals') {
        // Fetch referrals with query parameters
        const queryParams: Record<string, string> = {};
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'referralsMe',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch referrals: ${response.status}`);
        }

        const referralsData = await response.json();
        return {
          data: referralsData.data || referralsData,
          pagination: referralsData.pagination || {
            page,
            limit,
            total: referralsData.total || 0,
            pages: Math.ceil((referralsData.total || 0) / limit)
          }
        };
      } else {
        // Fetch referrals overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'referralsStats',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch referrals statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Referrals data");

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
    console.error('Referrals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals data' },
      { status: 500 }
    );
  }
}
