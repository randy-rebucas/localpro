import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const period = searchParams.get('period') || '30d';

    // Fetch real PayMaya data from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {};
      if (period) queryParams.period = period;

      let endpoint: string;
      switch (type) {
        case 'analytics':
          endpoint = 'paymayaAnalytics';
          break;
        case 'transactions':
          endpoint = 'paymayaTransactions';
          break;
        default:
          endpoint = 'paymayaAnalytics';
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
        throw new Error(`Failed to fetch PayMaya ${type}: ${response.status}`);
      }

      const paymayaData = await response.json();
      return paymayaData.data || paymayaData;
    }, "PayMaya data");

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
    console.error('PayMaya API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PayMaya data' },
      { status: 500 }
    );
  }
}
