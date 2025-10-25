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

    // Fetch real communication data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'conversations') {
        // Fetch conversations with query parameters
        const queryParams: Record<string, string> = {};
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'communicationConversations',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch conversations: ${response.status}`);
        }

        const conversationsData = await response.json();
        return {
          data: conversationsData.data || conversationsData,
          pagination: conversationsData.pagination || {
            page,
            limit,
            total: conversationsData.total || 0,
            pages: Math.ceil((conversationsData.total || 0) / limit)
          }
        };
      } else if (type === 'notifications') {
        // Fetch notifications with query parameters
        const queryParams: Record<string, string> = {};
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'communicationNotifications',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch notifications: ${response.status}`);
        }

        const notificationsData = await response.json();
        return {
          data: notificationsData.data || notificationsData,
          pagination: notificationsData.pagination || {
            page,
            limit,
            total: notificationsData.total || 0,
            pages: Math.ceil((notificationsData.total || 0) / limit)
          }
        };
      } else {
        // Fetch communication overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'communicationUnreadCount',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch communication overview: ${response.status}`);
        }

        const overviewData = await response.json();
        return {
          data: overviewData.data || overviewData,
          pagination: undefined
        };
      }
    }, "Communication data");

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
    console.error('Communication API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communication data' },
      { status: 500 }
    );
  }
}
