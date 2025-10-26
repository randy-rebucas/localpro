import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Try to fetch real rentals statistics from external API, fallback to mock data
    let result;
    try {
      result = await handleApiRoute(async () => {
        const queryParams: Record<string, string> = {};
        if (period) queryParams.period = period;
        if (startDate) queryParams.startDate = startDate;
        if (endDate) queryParams.endDate = endDate;

        const response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'rentalsStatistics',
          { 
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch rentals statistics: ${response.status}`);
        }

        const statisticsData = await response.json();
        return statisticsData.data || statisticsData;
      }, "Rentals statistics");

      if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.warn('External API failed, using fallback data:', error);
      // Fallback to mock data when external API fails
      result = {
        data: {
          totalRentals: 0,
          availableRentals: 0,
          averageDailyRate: 0,
          totalProviders: 0,
          totalBookings: 0,
          totalRevenue: 0,
          averageRating: 0,
          topCategories: []
        }
      };
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      period,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Rentals statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rentals statistics' },
      { status: 500 }
    );
  }
}