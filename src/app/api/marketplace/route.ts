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

    // Fetch real marketplace data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'listings') {
        // Fetch marketplace listings with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        if (category) queryParams.category = category;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'marketplaceListings',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch marketplace listings: ${response.status}`);
        }

        const listingsData = await response.json();
        return {
          data: listingsData.data || listingsData,
          pagination: listingsData.pagination || {
            page,
            limit,
            total: listingsData.total || 0,
            pages: Math.ceil((listingsData.total || 0) / limit)
          }
        };
      } else {
        // Fetch marketplace overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'analyticsMarketplace',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch marketplace statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Marketplace data");

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
    console.error('Marketplace API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace data' },
      { status: 500 }
    );
  }
}
