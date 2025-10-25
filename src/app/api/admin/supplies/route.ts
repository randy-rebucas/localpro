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

    // Fetch real supplies data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'supplies') {
        // Fetch supplies with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        if (category) queryParams.category = category;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'supplies',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch supplies: ${response.status}`);
        }

        const suppliesData = await response.json();
        return {
          data: suppliesData.data || suppliesData,
          pagination: suppliesData.pagination || {
            page,
            limit,
            total: suppliesData.total || 0,
            pages: Math.ceil((suppliesData.total || 0) / limit)
          }
        };
      } else {
        // Fetch supplies overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'suppliesStatistics',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch supplies statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Supplies data");

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
    console.error('Supplies admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplies data' },
      { status: 500 }
    );
  }
}