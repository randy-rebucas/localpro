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
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    // Fetch real audit data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'logs') {
        // Fetch audit logs with query parameters
        const queryParams: Record<string, string> = {};
        if (action) queryParams.action = action;
        if (userId) queryParams.userId = userId;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'auditLogs',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch audit logs: ${response.status}`);
        }

        const logsData = await response.json();
        return {
          data: logsData.data || logsData,
          pagination: logsData.pagination || {
            page,
            limit,
            total: logsData.total || 0,
            pages: Math.ceil((logsData.total || 0) / limit)
          }
        };
      } else {
        // Fetch audit overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'auditLogsStats',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch audit statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Audit data");

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
    console.error('Audit admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit data' },
      { status: 500 }
    );
  }
}