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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Fetch real announcements data from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {};
      if (status) queryParams.status = status;
      if (type) queryParams.type = type;
      queryParams.page = page.toString();
      queryParams.limit = limit.toString();

      const response = await makeAuthenticatedRequestWithPath(
        request,
        'announcements',
        [],
        queryParams,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.status}`);
      }

      const announcementsData = await response.json();
      return {
        data: announcementsData.data || announcementsData,
        pagination: announcementsData.pagination || {
          page,
          limit,
          total: announcementsData.total || 0,
          pages: Math.ceil((announcementsData.total || 0) / limit)
        }
      };
    }, "Announcements data");

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
    console.error('Announcements admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
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
    const { title, content, type, priority, targetAudience, scheduledFor } = body;

    // Validate required fields
    if (!title || !content || !type) {
      return NextResponse.json(
        { error: 'Title, content, and type are required' },
        { status: 400 }
      );
    }

    // Create new announcement using real API
    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'announcements',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            content,
            type,
            priority: priority || 'medium',
            targetAudience: targetAudience || 'all',
            scheduledFor: scheduledFor || null
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create announcement: ${response.status}`);
      }

      return await response.json();
    }, "Create announcement");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Announcement created successfully'
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}