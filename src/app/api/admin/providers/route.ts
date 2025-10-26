import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

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

    // Fetch real providers data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'providers') {
        // Fetch providers with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        if (category) queryParams.category = category;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        // Use the API auth utilities for proper authentication
        const response = await makeAuthenticatedRequestWithPath(
          request,
          'providersAdminAll',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch providers: ${response.status}`);
        }

        const providersData = await response.json();
        return {
          data: providersData.data || providersData,
          pagination: providersData.pagination || {
            page,
            limit,
            total: providersData.total || 0,
            pages: Math.ceil((providersData.total || 0) / limit)
          }
        };
      } else {
        // Fetch providers overview/statistics using the same endpoint with stats parameter
        const response = await makeAuthenticatedRequestWithPath(
          request,
          'providersAdminAll',
          [],
          { type: 'stats' },
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch providers statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Providers data");

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
    console.error('Providers admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers data' },
      { status: 500 }
    );
  }
}