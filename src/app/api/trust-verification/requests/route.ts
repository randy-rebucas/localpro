import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const dateRange = searchParams.get('dateRange');
    const sortBy = searchParams.get('sortBy') || 'submittedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const result = await handleApiRoute(async () => {
      // Fetch verification requests with query parameters
      const queryParams: Record<string, string> = {};
      if (status) queryParams.status = status;
      if (type) queryParams.type = type;
      if (priority) queryParams.priority = priority;
      if (search) queryParams.search = search;
      if (dateRange) queryParams.dateRange = dateRange;
      queryParams.page = page.toString();
      queryParams.limit = limit.toString();
      queryParams.sortBy = sortBy;
      queryParams.sortOrder = sortOrder;

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
    }, "Trust verification requests");

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
    console.error('Trust verification requests API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification requests' },
      { status: 500 }
    );
  }
}
