import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Mock announcement data - replace with actual database query
    const announcement = {
      id,
      title: 'System Maintenance Notice',
      content: 'We will be performing scheduled maintenance on Sunday...',
      type: 'system',
      status: 'active',
      priority: 'high',
      targetAudience: 'all',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: session.user.id,
      views: 1250,
      acknowledgments: 890,
      comments: [
        {
          id: '1',
          content: 'Thanks for the notice!',
          author: 'user1',
          createdAt: new Date().toISOString()
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: announcement
    });

  } catch (error) {
    console.error('Get announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcement' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { title, content, type, priority, targetAudience, status } = body;

    // Update announcement
    const updatedAnnouncement = {
      id,
      title: title || 'System Maintenance Notice',
      content: content || 'We will be performing scheduled maintenance...',
      type: type || 'system',
      priority: priority || 'high',
      targetAudience: targetAudience || 'all',
      status: status || 'active',
      updatedAt: new Date().toISOString(),
      author: session.user.id
    };

    // Save to database (mock implementation)
    console.log('Updating announcement:', updatedAnnouncement);

    return NextResponse.json({
      success: true,
      data: updatedAnnouncement,
      message: 'Announcement updated successfully'
    });

  } catch (error) {
    console.error('Update announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Delete announcement
    console.log('Deleting announcement:', id);

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}
