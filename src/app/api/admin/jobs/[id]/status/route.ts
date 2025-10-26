import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const body = await request.json();
    const { status, reason } = body;

    // Validate status
    const validStatuses = ['active', 'paused', 'closed', 'draft'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be one of: active, paused, closed, draft' },
        { status: 400 }
      );
    }

    // Use API constants approach to update job status
    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'jobsApplicationStatus',
        [id],
        {},
        {
          method: 'POST',
          body: JSON.stringify({ 
            status,
            reason,
            updatedBy: session.user?.id,
            updatedAt: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update job status: ${response.status}`);
      }

      const jobData = await response.json();
      return jobData.data || jobData;
    }, "Job status update");

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      status,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin job status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update job status' },
      { status: 500 }
    );
  }
}
