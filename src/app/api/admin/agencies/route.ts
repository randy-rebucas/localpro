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

    // Fetch real agencies data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'agencies') {
        // Fetch agencies with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'agencies',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch agencies: ${response.status}`);
        }

        const agenciesData = await response.json();
        return {
          data: agenciesData.data || agenciesData,
          pagination: agenciesData.pagination || {
            page,
            limit,
            total: agenciesData.total || 0,
            pages: Math.ceil((agenciesData.total || 0) / limit)
          }
        };
      } else {
        // Fetch agencies overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'agenciesAnalytics',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch agencies statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Agencies data");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    const { data, pagination } = result.data;

    return NextResponse.json({
      success: true,
      data,
      pagination
    });

  } catch (error) {
    console.error('Agencies admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agencies data' },
      { status: 500 }
    );
  }
}