import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // day, week, month, year

    // Try to fetch real error monitoring statistics from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {};
      if (period) queryParams.period = period;

      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'errorMonitoringStats',
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          ...(Object.keys(queryParams).length > 0 && {
            body: JSON.stringify(queryParams)
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch error monitoring statistics: ${response.status}`);
      }

      const statsData = await response.json();
      return statsData.data || statsData;
    }, "Error monitoring statistics");

    // If external API fails, provide fallback mock data
    if (result.error) {
      console.warn('External API failed, using fallback data:', result.error);
      
      // Fallback mock data
      const fallbackStats = {
        total: 0,
        critical: 0,
        errors: 0,
        warnings: 0,
        resolved: 0,
        unresolved: 0,
        todayCount: 0,
        weekCount: 0,
        monthCount: 0,
        trends: {
          daily: [],
          weekly: [],
          monthly: []
        },
        topErrors: [],
        environmentStats: [],
        levelDistribution: [],
        resolutionTime: {
          average: 0,
          median: 0,
          p95: 0
        }
      };

      return NextResponse.json({
        success: true,
        data: fallbackStats,
        period,
        generatedAt: new Date().toISOString(),
        fallback: true
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      period,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching error statistics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
