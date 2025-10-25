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

    // Fetch real maps data from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {};
      if (period) queryParams.period = period;

      let endpoint: string;
      switch (type) {
        case 'analytics':
          endpoint = 'mapsAnalytics';
          break;
        case 'usage':
          endpoint = 'mapsUsage';
          break;
        default:
          endpoint = 'mapsAnalytics';
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
        throw new Error(`Failed to fetch maps ${type}: ${response.status}`);
      }

      const mapsData = await response.json();
      return mapsData.data || mapsData;
    }, "Maps data");

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
    console.error('Maps API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maps data' },
      { status: 500 }
    );
  }
}
