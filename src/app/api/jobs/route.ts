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
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Fetch real jobs data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'jobs') {
        // Fetch jobs with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        if (category) queryParams.category = category;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'jobs',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.status}`);
        }

        const jobsData = await response.json();
        return {
          data: jobsData.data || jobsData,
          pagination: jobsData.pagination || {
            page,
            limit,
            total: jobsData.total || 0,
            pages: Math.ceil((jobsData.total || 0) / limit)
          }
        };
      } else {
        // Fetch jobs overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'jobsStats',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch jobs statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Jobs data");

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
    console.error('Jobs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs data' },
      { status: 500 }
    );
  }
}