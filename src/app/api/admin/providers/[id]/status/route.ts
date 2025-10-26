import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath } from '@/lib/api-auth-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body;

    // Validate status
    const validStatuses = ['active', 'suspended', 'pending', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: active, suspended, pending, rejected' },
        { status: 400 }
      );
    }

    // Use the API auth utilities for proper authentication
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'providersAdminStatus',
      [id],
      {},
      {
        method: 'PUT',
        body: JSON.stringify({
          status,
          reason: reason || null,
          updatedBy: session.user.id
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update provider status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      data: result.data || result,
      message: `Provider status updated to ${status}`
    });

  } catch (error) {
    console.error('Update provider status error:', error);
    return NextResponse.json(
      { error: 'Failed to update provider status' },
      { status: 500 }
    );
  }
}
