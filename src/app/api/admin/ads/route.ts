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
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Fetch real ads data from external API
    const result = await handleApiRoute(async () => {
      if (type === 'ads') {
        // Fetch ads with query parameters
        const queryParams: Record<string, string> = {};
        if (status) queryParams.status = status;
        if (category) queryParams.category = category;
        queryParams.page = page.toString();
        queryParams.limit = limit.toString();

        const response = await makeAuthenticatedRequestWithPath(
          request,
          'ads',
          [],
          queryParams,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch ads: ${response.status}`);
        }

        const adsData = await response.json();
        return {
          data: adsData.data || adsData,
          pagination: adsData.pagination || {
            page,
            limit,
            total: adsData.total || 0,
            pages: Math.ceil((adsData.total || 0) / limit)
          }
        };
      } else {
        // Fetch ads overview/statistics
        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'adsAnalytics',
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch ads statistics: ${response.status}`);
        }

        const statsData = await response.json();
        return {
          data: statsData.data || statsData,
          pagination: undefined
        };
      }
    }, "Ads data");

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
    console.error('Ads admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ads data' },
      { status: 500 }
    );
  }
}