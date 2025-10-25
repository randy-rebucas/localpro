import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ad ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['draft', 'pending', 'active', 'paused', 'expired', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // TODO: Implement actual database update
    // For now, return success response
    console.log(`Updating ad ${id} status to ${status}`, { rejectionReason });

    return NextResponse.json({
      success: true,
      message: `Ad status updated to ${status}`,
      data: {
        id,
        status,
        rejectionReason,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating ad status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update ad status',
        message: 'An error occurred while updating the advertisement status'
      },
      { status: 500 }
    );
  }
}
