import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ errorId: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { errorId } = await params;

    // Fetch real error details from external API
    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'errorMonitoringById',
        [errorId],
        {},
        { method: 'GET' }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Error not found');
        }
        throw new Error(`Failed to fetch error details: ${response.status}`);
      }

      const errorData = await response.json();
      return errorData.data || errorData;
    }, "Error details");

    if (result.error) {
      if (result.error.includes('not found')) {
        return NextResponse.json({ 
          success: false,
          error: 'Error not found' 
        }, { status: 404 });
      }
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json({ 
      success: true,
      data: result.data,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching error details:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
