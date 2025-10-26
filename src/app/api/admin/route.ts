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

    // Fetch real admin dashboard data from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {};
      if (period) queryParams.period = period;

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
        case 'plus':
          endpoint = 'plusUsage';
          break;
        case 'ads':
          endpoint = 'adsAnalytics';
          break;
        case 'academy':
          endpoint = 'academyStatistics';
          break;
        case 'supplies':
          endpoint = 'suppliesStatistics';
          break;
        case 'rentals':
          endpoint = 'rentalsStatistics';
          break;
        case 'facility-care':
          endpoint = 'facilityCareStatistics';
          break;
        case 'trust-verification':
          endpoint = 'trustVerificationStatistics';
          break;
        case 'error-monitoring':
          endpoint = 'errorMonitoringStats';
          break;
        case 'audit':
          endpoint = 'auditLogsStats';
          break;
        case 'maps':
          endpoint = 'mapsAnalytics';
          break;
        case 'paymaya':
          endpoint = 'paymayaAnalytics';
          break;
        case 'paypal':
          endpoint = 'paypalAnalytics';
          break;
        default:
          endpoint = 'analyticsOverview';
      }

      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        endpoint as keyof typeof API_ENDPOINTS,
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} admin data: ${response.status}`);
      }

      const adminData = await response.json();
      return adminData.data || adminData;
    }, "Admin dashboard data");

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
    console.error('Admin dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard data' },
      { status: 500 }
    );
  }
}
