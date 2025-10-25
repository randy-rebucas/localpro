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
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');

    // Fetch real error monitoring data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'errors') {
        // Fetch errors with query parameters
        const queryParams: Record<string, string> = {};
        if (severity) queryParams.severity = severity;
        if (status) queryParams.status = status;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'errorMonitoringErrors',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch errors: ${response.status}`);
        }

        const errorsData = await response.json();
        return {
          data: errorsData.data || errorsData,
          pagination: errorsData.pagination || {
            page,
            limit,
            total: errorsData.total || 0,
            pages: Math.ceil((errorsData.total || 0) / limit)
          }
        };
      } else {
        // Fetch error monitoring overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'errorMonitoringStats',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch error monitoring statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Error monitoring data");

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
    console.error('Error monitoring API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error monitoring data' },
      { status: 500 }
    );
  }
}
