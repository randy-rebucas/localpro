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
    const type = searchParams.get('type') || 'logs';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const user = searchParams.get('user');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Fetch real system logs data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'logs') {
        // Fetch system logs with query parameters
        const queryParams: Record<string, string> = {
          page: page.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder
        };
        
        if (startDate) queryParams.startDate = startDate;
        if (endDate) queryParams.endDate = endDate;
        if (level) queryParams.level = level;
        if (category) queryParams.category = category;
        if (user) queryParams.user = user;
        if (source) queryParams.source = source;
        if (search) queryParams.search = search;

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'logs',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch system logs: ${response.status}`);
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
        // Fetch logs statistics
        const queryParams: Record<string, string> = {};
        if (startDate) queryParams.startDate = startDate;
        if (endDate) queryParams.endDate = endDate;

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'logsStats',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch logs statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "System logs data");

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
    console.error('Admin logs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data: logData } = body;

    // Handle different log management actions
    const result = await handleApiRoute(async () => {
      switch (action) {
        case 'cleanup':
          // Clean up old logs
          const cleanupResponse = await makeAuthenticatedRequestWithEndpoint(
            request,
            'logsCleanup',
            { 
              method: 'POST',
              body: JSON.stringify(logData)
            }
          );

          if (!cleanupResponse.ok) {
            throw new Error(`Failed to cleanup logs: ${cleanupResponse.status}`);
          }

          return await cleanupResponse.json();

        case 'flush':
          // Flush logs cache
          const flushResponse = await makeAuthenticatedRequestWithEndpoint(
            request,
            'logsFlush',
            { method: 'POST' }
          );

          if (!flushResponse.ok) {
            throw new Error(`Failed to flush logs: ${flushResponse.status}`);
          }

          return await flushResponse.json();

        case 'export':
          // Export logs data
          const exportResponse = await makeAuthenticatedRequestWithPath(
            request,
            'logsExportData',
            [],
            logData,
            { method: 'POST' }
          );

          if (!exportResponse.ok) {
            throw new Error(`Failed to export logs: ${exportResponse.status}`);
          }

          return await exportResponse.json();

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }, "Log management action");

    if (result.error) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Admin logs POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
