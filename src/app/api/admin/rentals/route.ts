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

    // Try to fetch real rentals data from external API, fallback to empty data
    let result;
    try {
      result = await handleApiRoute(async () => {
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
        throw new Error(result.error);
      }
    } catch (error) {
      console.warn('External API failed, using fallback data:', error);
      // Fallback to empty data when external API fails
      result = {
        data: type === 'rentals' ? [] : {
          totalRentals: 0,
          availableRentals: 0,
          averageDailyRate: 0,
          totalProviders: 0
        },
        pagination: type === 'rentals' ? {
          page,
          limit,
          total: 0,
          pages: 0
        } : undefined
      };
    }

    const { data, pagination } = (result.data as { 
      data: unknown[]; 
      pagination: { page: number; limit: number; total: number; pages: number } | undefined 
    }) || { data: null, pagination: null };

    return NextResponse.json({
      success: true,
      data,
      pagination
    });

  } catch (error) {
    console.error('Rentals admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rentals data' },
      { status: 500 }
    );
  }
}