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

      // Try primary logs cleanup endpoint first
      let response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'logsCleanup',
        { 
          method: 'POST',
          body: JSON.stringify(cleanupData)
        }
      );

      // If primary endpoint fails, try admin audit logs cleanup as fallback
      if (!response.ok && response.status === 404) {
        console.warn('Primary logs cleanup endpoint not found, trying admin audit logs cleanup');
        response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'adminAuditLogsCleanup',
          { 
            method: 'POST',
            body: JSON.stringify(cleanupData)
          }
        );
      }

      // If both fail, try regular audit logs cleanup
      if (!response.ok && response.status === 404) {
        console.warn('Admin audit logs cleanup not found, trying regular audit logs cleanup');
        response = await makeAuthenticatedRequestWithEndpoint(
          request,
          'auditLogsCleanup',
          { 
            method: 'POST',
            body: JSON.stringify(cleanupData)
          }
        );
      }

      if (!response.ok) {
        // If all endpoints fail, return a mock success response for development
        if (process.env.NODE_ENV === 'development') {
          console.warn('All cleanup endpoints failed, returning mock success for development');
          return {
            deletedCount: 0,
            message: 'Cleanup endpoints not available in development mode',
            dryRun: dryRun
          };
        }
        throw new Error(`Failed to cleanup logs: ${response.status} ${response.statusText}`);
      }

      const cleanupResult = await response.json();
      return cleanupResult.data || cleanupResult;
    }, "Logs cleanup");

    if (result.error) {
      console.error('Logs cleanup error:', result.error);
      return NextResponse.json(
        { 
          error: result.error, 
          details: result.details,
          success: false,
          timestamp: new Date().toISOString()
        },
        { status: result.status || 500 }
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
