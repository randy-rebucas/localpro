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
    const userId = searchParams.get('userId');

    // Fetch real activities data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'activities') {
        // Fetch activities with query parameters
        const queryParams: Record<string, string> = {};
        if (userId) queryParams.userId = userId;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'activities',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.status}`);
        }

        const activitiesData = await response.json();
        return {
          data: activitiesData.data || activitiesData,
          pagination: activitiesData.pagination || {
            page,
            limit,
            total: activitiesData.total || 0,
            pages: Math.ceil((activitiesData.total || 0) / limit)
          }
        };
      } else if (type === 'stats') {
        // Fetch activity statistics
        const queryParams: Record<string, string> = {};
        if (userId) queryParams.userId = userId;

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'activitiesStatsMy',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch activity statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      } else {
        // Fetch activities overview/feed
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'activitiesFeed',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch activities overview: ${response.status}`);
        }

        const overviewData = await response.json();
        return {
          data: overviewData.data || overviewData,
          pagination: undefined
        };
      }
    }, "Activities data");

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
    console.error('Activities admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities data' },
      { status: 500 }
    );
  }
}