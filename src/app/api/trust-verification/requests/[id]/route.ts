import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await handleApiRoute(async () => {
      // Fetch specific trust verification request details
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'trustVerificationRequestById',
        [id],
        {},
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch verification request: ${response.status}`);
      }

      const requestData = await response.json();
      return requestData.data || requestData;
    }, "Trust verification request details");

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
    console.error('Trust verification request API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes, rejectionReason } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const result = await handleApiRoute(async () => {
      // Update trust verification request status
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'trustVerificationReview',
        [id],
        {},
        {
          method: 'PATCH',
          body: JSON.stringify({
            status,
            notes,
            rejectionReason,
            reviewedBy: session.user.id,
            reviewedAt: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update verification request: ${response.status}`);
      }

      const updateData = await response.json();
      return updateData.data || updateData;
    }, "Trust verification request update");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Verification request updated successfully'
    });

  } catch (error) {
    console.error('Trust verification request update error:', error);
    return NextResponse.json(
      { error: 'Failed to update verification request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await handleApiRoute(async () => {
      // Delete trust verification request
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'trustVerificationDelete',
        [id],
        {},
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete verification request: ${response.status}`);
      }

      return { deleted: true };
    }, "Trust verification request deletion");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification request deleted successfully'
    });

  } catch (error) {
    console.error('Trust verification request deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete verification request' },
      { status: 500 }
    );
  }
}
