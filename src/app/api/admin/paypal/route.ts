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

    // Fetch real PayPal data from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {};
      if (period) queryParams.period = period;

      let endpoint: string;
      switch (type) {
        case 'analytics':
          endpoint = 'paypalAnalytics';
          break;
        case 'transactions':
          endpoint = 'paypalTransactions';
          break;
        default:
          endpoint = 'paypalAnalytics';
      }

      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        endpoint,
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch PayPal ${type}: ${response.status}`);
      }

      const paypalData = await response.json();
      return paypalData.data || paypalData;
    }, "PayPal data");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      period
    });

  } catch (error) {
    console.error('PayPal admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PayPal data' },
      { status: 500 }
    );
  }
}