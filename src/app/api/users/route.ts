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
    const role = searchParams.get('role');

    // Fetch real users data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'users') {
        // Fetch users with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        if (role) queryParams.role = role;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'users',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const usersData = await response.json();
        return {
          data: usersData.data || usersData,
          pagination: usersData.pagination || {
            page,
            limit,
            total: usersData.total || 0,
            pages: Math.ceil((usersData.total || 0) / limit)
          }
        };
      } else {
        // Fetch users overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'analyticsUser',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch users statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Users data");

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
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users data' },
      { status: 500 }
    );
  }
}
