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

    // Fetch real rentals data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'rentals') {
        // Fetch rentals with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        if (category) queryParams.category = category;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'rentals',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch rentals: ${response.status}`);
        }

        const rentalsData = await response.json();
        return {
          data: rentalsData.data || rentalsData,
          pagination: rentalsData.pagination || {
            page,
            limit,
            total: rentalsData.total || 0,
            pages: Math.ceil((rentalsData.total || 0) / limit)
          }
        };
      } else {
        // Fetch rentals overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'rentalsStatistics',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch rentals statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Rentals data");

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
    console.error('Rentals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rentals data' },
      { status: 500 }
    );
  }
}