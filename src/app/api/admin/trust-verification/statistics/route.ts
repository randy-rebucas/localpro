import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // const { searchParams } = new URL(request.url);
    // const period = searchParams.get('period') || '30d';
    // const type = searchParams.get('type') || 'overview';

    const result = await handleApiRoute(async () => {
      // Fetch trust verification statistics
      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'trustVerificationStatistics',
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch trust verification statistics: ${response.status}`);
      }

      const statsData = await response.json();
      return statsData.data || statsData;
    }, "Trust verification statistics");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Trust verification statistics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trust verification statistics' },
      { status: 500 }
    );
  }
}