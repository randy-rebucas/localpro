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

    // Fetch real trust verification data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'requests') {
        // Fetch verification requests with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'trustVerificationRequests',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch verification requests: ${response.status}`);
        }

        const requestsData = await response.json();
        return {
          data: requestsData.data || requestsData,
          pagination: requestsData.pagination || {
            page,
            limit,
            total: requestsData.total || 0,
            pages: Math.ceil((requestsData.total || 0) / limit)
          }
        };
      } else {
        // Fetch trust verification overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'trustVerificationStatistics',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch trust verification statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Trust verification data");

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
    console.error('Trust verification admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trust verification data' },
      { status: 500 }
    );
  }
}