import { NextRequest, NextResponse } from 'next/server';

// Mock announcements data - in production, this would come from a database
const mockAnnouncements = [
  {
    id: '1',
    title: 'Welcome to LocalPro!',
    message: 'We\'re excited to have you on board. Explore our marketplace to find local services and connect with professionals in your area. Start by completing your profile to get better matches.',
    type: 'feature',
    priority: 'high',
    startDate: new Date().toISOString(),
    isActive: true,
    isDismissible: true,
    actionUrl: '/marketplace',
    actionText: 'Explore Marketplace',
    targetAudience: ['all'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'New Features Coming Soon',
    message: 'We\'re working on exciting new features including Academy courses for skill development, Supplies marketplace for tools and materials, and Financial services for salary advances and micro-loans. Stay tuned for updates!',
    type: 'info',
    priority: 'medium',
    startDate: new Date().toISOString(),
    isActive: true,
    isDismissible: true,
    targetAudience: ['all'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Complete Your Profile',
    message: 'Complete your profile to get better matches and increase your visibility to potential clients. Add your skills, experience, and portfolio to stand out.',
    type: 'warning',
    priority: 'medium',
    startDate: new Date().toISOString(),
    isActive: true,
    isDismissible: true,
    actionUrl: '/profile/edit',
    actionText: 'Complete Profile',
    targetAudience: ['incomplete_profile'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'LocalPro Plus Available',
    message: 'Upgrade to LocalPro Plus for premium features including priority listing, advanced analytics, and exclusive tools to grow your business.',
    type: 'feature',
    priority: 'low',
    startDate: new Date().toISOString(),
    isActive: true,
    isDismissible: true,
    actionUrl: '/plus',
    actionText: 'Learn More',
    targetAudience: ['free_users'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'System Maintenance',
    message: 'We\'ll be performing scheduled maintenance on Sunday, 2:00 AM - 4:00 AM PST. Some features may be temporarily unavailable.',
    type: 'info',
    priority: 'medium',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    isActive: true,
    isDismissible: false,
    targetAudience: ['all'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would:
    // 1. Get user information from session/auth
    // 2. Filter announcements based on user's target audience
    // 3. Check if announcements are dismissed by the user
    // 4. Fetch from database with proper filtering

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const includeDismissed = url.searchParams.get('includeDismissed') === 'true';

    // Filter active announcements
    const activeAnnouncements = mockAnnouncements.filter(announcement => {
      const now = new Date();
      const startDate = new Date(announcement.startDate);
      const endDate = announcement.endDate ? new Date(announcement.endDate) : null;
      
      return announcement.isActive && 
             startDate <= now && 
             (!endDate || endDate >= now);
    });

    // In production, you would filter by user's target audience and dismissed status
    // For now, we'll return all active announcements
    
    return NextResponse.json({
      success: true,
      announcements: activeAnnouncements,
      total: activeAnnouncements.length
    });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch announcements',
        announcements: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This would be used to create new announcements (admin only)
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'message', 'type', 'priority'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // In production, you would:
    // 1. Verify admin permissions
    // 2. Validate data
    // 3. Save to database
    // 4. Return the created announcement

    const newAnnouncement = {
      id: Date.now().toString(),
      ...body,
      isActive: body.isActive !== false,
      isDismissible: body.isDismissible !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      announcement: newAnnouncement
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}