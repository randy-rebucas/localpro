import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
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

    // Update provider status
    const updatedProvider = {
      id,
      status,
      reason: reason || null,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.id
    };

    // Save to database (mock implementation)
    console.log('Updating provider status:', updatedProvider);

    return NextResponse.json({
      success: true,
      data: updatedProvider,
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
