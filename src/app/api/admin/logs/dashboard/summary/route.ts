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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '7d';

    // Fetch dashboard summary from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = { period };
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'logsDashboardSummary',
        { 
          method: 'GET',
          ...(Object.keys(queryParams).length > 0 && {
            body: JSON.stringify(queryParams)
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard summary: ${response.status}`);
      }

      const summaryData = await response.json();
      return summaryData.data || summaryData;
    }, "Dashboard summary");

    if (result.error) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Admin logs dashboard summary API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
