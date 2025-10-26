import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || (session.user.role !== 'admin' && session.user.id !== params.userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch user activity logs from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString()
      };
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      const response = await makeAuthenticatedRequestWithPath(
        request,
        'logsUserActivity',
        [params.userId],
        queryParams,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user activity: ${response.status}`);
      }

      const activityData = await response.json();
      return {
        data: activityData.data || activityData,
        pagination: activityData.pagination || {
          page,
          limit,
          total: activityData.total || 0,
          pages: Math.ceil((activityData.total || 0) / limit)
        }
      };
    }, "User activity logs");

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
    console.error('Admin logs user activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
