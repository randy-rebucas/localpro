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
    const category = searchParams.get('category');

    // Fetch real academy data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'courses') {
        // Fetch courses with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        if (category) queryParams.category = category;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'academyCourses',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.status}`);
        }

        const coursesData = await response.json();
        return {
          data: coursesData.data || coursesData,
          pagination: coursesData.pagination || {
            page,
            limit,
            total: coursesData.total || 0,
            pages: Math.ceil((coursesData.total || 0) / limit)
          }
        };
      } else {
        // Fetch academy overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'academyStatistics',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch academy statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Academy data");

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
    console.error('Academy admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academy data' },
      { status: 500 }
    );
  }
}