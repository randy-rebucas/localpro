import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';
import { API_ENDPOINTS } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const userRole = session.user?.role;
    if (!userRole || !['admin', 'agency_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Use API constants approach to fetch jobs statistics
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {
        period
      };

      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'analyticsJobs',
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs statistics: ${response.status}`);
      }

      const statsData = await response.json();
      return statsData.data || statsData;
    }, "Jobs statistics");

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
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
    console.error('Admin jobs stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs statistics' },
      { status: 500 }
    );
  }
}
