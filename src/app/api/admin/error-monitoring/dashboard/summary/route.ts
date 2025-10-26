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
    const period = searchParams.get('period') || 'week';

    // Fetch real error monitoring dashboard summary from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {};
      if (period) queryParams.period = period;

      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'errorMonitoringDashboardSummary',
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
        throw new Error(`Failed to fetch error monitoring dashboard summary: ${response.status}`);
      }

      const summaryData = await response.json();
      return summaryData.data || summaryData;
    }, "Error monitoring dashboard summary");

    if (result.error) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      period,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
