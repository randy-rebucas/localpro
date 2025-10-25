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
    const type = searchParams.get('type') || 'overview';
    const period = searchParams.get('period') || '30d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch real dashboard data from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {};
      if (period) queryParams.period = period;
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      let endpoint: string;
      switch (type) {
        case 'analytics':
          endpoint = 'analyticsOverview';
          break;
        case 'users':
          endpoint = 'analyticsUser';
          break;
        case 'marketplace':
          endpoint = 'analyticsMarketplace';
          break;
        case 'jobs':
          endpoint = 'analyticsJobs';
          break;
        case 'referrals':
          endpoint = 'analyticsReferrals';
          break;
        case 'agencies':
          endpoint = 'analyticsAgencies';
          break;
        case 'finance':
          endpoint = 'financeOverview';
          break;
        case 'communication':
          endpoint = 'communicationUnreadCount';
          break;
        case 'activities':
          endpoint = 'activitiesFeed';
          break;
        default:
          endpoint = 'analyticsOverview';
      }

      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        endpoint as any,
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} dashboard data: ${response.status}`);
      }

      const dashboardData = await response.json();
      return dashboardData.data || dashboardData;
    }, "Dashboard data");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      period,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}