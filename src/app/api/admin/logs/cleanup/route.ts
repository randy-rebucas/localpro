import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithEndpoint, handleApiRoute } from '@/lib/api-auth-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      olderThanDays = 30, 
      level = 'debug', 
      category = 'system',
      dryRun = false 
    } = body;

    // Clean up expired logs from external API
    const result = await handleApiRoute(async () => {
      const cleanupData = {
        olderThanDays,
        level,
        category,
        dryRun
      };

      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'logsCleanup',
        { 
          method: 'POST',
          body: JSON.stringify(cleanupData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cleanup logs: ${response.status}`);
      }

      const cleanupResult = await response.json();
      return cleanupResult.data || cleanupResult;
    }, "Logs cleanup");

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
    console.error('Admin logs cleanup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
