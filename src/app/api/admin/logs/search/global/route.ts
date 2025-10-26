import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const level = searchParams.get('level');
    const category = searchParams.get('category');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search logs globally from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {
        q: query,
        page: page.toString(),
        limit: limit.toString()
      };
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;
      if (level) queryParams.level = level;
      if (category) queryParams.category = category;

      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'logsSearchGlobal',
        { 
          method: 'GET',
          body: JSON.stringify(queryParams)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search logs: ${response.status}`);
      }

      const searchData = await response.json();
      return {
        data: searchData.data || searchData,
        pagination: searchData.pagination || {
          page,
          limit,
          total: searchData.total || 0,
          pages: Math.ceil((searchData.total || 0) / limit)
        }
      };
    }, "Global logs search");

    if (result.error) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    const { data, pagination } = result.data || { data: null, pagination: null };

    return NextResponse.json({
      success: true,
      data,
      pagination
    });

  } catch (error) {
    console.error('Admin logs global search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
