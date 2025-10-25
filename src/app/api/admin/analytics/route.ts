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

    // Fetch real analytics data from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {};
      if (period) queryParams.period = period;
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      let endpoint: string;
      switch (type) {
        case 'user':
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
        case 'custom':
          endpoint = 'analyticsCustom';
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
        throw new Error(`Failed to fetch ${type} analytics: ${response.status}`);
      }

      const analyticsData = await response.json();
      return analyticsData.data || analyticsData;
    }, "Analytics data");

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
    console.error('Analytics admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { event, properties, userId } = body;

    // Track custom analytics event using real API
    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'analyticsTrack',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event,
            properties,
            userId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to track analytics event: ${response.status}`);
      }

      return await response.json();
    }, "Analytics tracking");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}