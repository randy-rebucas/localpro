import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

export async function PATCH(
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
    const body = await request.json();
    const { action, notes } = body;

    if (!action || !['resolve', 'unresolve'].includes(action)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid action. Use "resolve" or "unresolve"' 
      }, { status: 400 });
    }

    // Update error status via external API
    const result = await handleApiRoute(async () => {
      const requestBody = {
        action,
        ...(notes && { notes }),
        resolvedBy: session.user.email || 'admin'
      };

      const response = await makeAuthenticatedRequestWithPath(
        request,
        'errorMonitoringResolve',
        [errorId],
        {},
        { 
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Error not found');
        }
        throw new Error(`Failed to update error status: ${response.status}`);
      }

      const updateData = await response.json();
      return updateData.data || updateData;
    }, "Error status update");

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
      data: {
        ...result.data,
        message: action === 'resolve' ? 'Error resolved successfully' : 'Error marked as unresolved'
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating error status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
