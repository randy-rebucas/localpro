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
    const category = searchParams.get('category');

    // Fetch real facility care data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'services') {
        // Fetch facility care services with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        if (category) queryParams.category = category;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'facilityCare',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch facility care services: ${response.status}`);
        }

        const servicesData = await response.json();
        return {
          data: servicesData.data || servicesData,
          pagination: servicesData.pagination || {
            page,
            limit,
            total: servicesData.total || 0,
            pages: Math.ceil((servicesData.total || 0) / limit)
          }
        };
      } else {
        // Fetch facility care overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'facilityCare' as any,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch facility care statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Facility care data");

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
    console.error('Facility care API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facility care data' },
      { status: 500 }
    );
  }
}
