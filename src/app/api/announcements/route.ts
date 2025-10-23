import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequest } from '@/lib/api-auth-utils';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build query parameters for external API
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Make request to external API using request-based authentication
    const response = await makeAuthenticatedRequest(
      request,
      `${API_BASE_URL}${API_ENDPOINTS.announcements}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      
      // Return mock data when external API is not available
      const mockAnnouncements = [
        {
          id: '1',
          title: 'Welcome to LocalPro!',
          message: 'We\'re excited to have you on board. Explore our marketplace to find local services and connect with professionals in your area.',
          type: 'feature',
          priority: 'high',
          startDate: new Date().toISOString(),
          isActive: true,
          isDismissible: true,
          actionUrl: '/marketplace',
          actionText: 'Explore Marketplace',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'New Features Coming Soon',
          message: 'We\'re working on exciting new features including Academy courses, Supplies marketplace, and Financial services. Stay tuned!',
          type: 'info',
          priority: 'medium',
          startDate: new Date().toISOString(),
          isActive: true,
          isDismissible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Profile Completion',
          message: 'Complete your profile to get better matches and increase your visibility to potential clients.',
          type: 'warning',
          priority: 'medium',
          startDate: new Date().toISOString(),
          isActive: true,
          isDismissible: true,
          actionUrl: '/profile/edit',
          actionText: 'Complete Profile',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return NextResponse.json({
        success: true,
        announcements: mockAnnouncements
      });
    }

    const data = await response.json();
    console.log("Announcements API: External API response:", data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching announcements:', error);

    // Return mock data when there's an error (e.g., external API not available)
    const mockAnnouncements = [
      {
        id: '1',
        title: 'Welcome to LocalPro!',
        message: 'We\'re excited to have you on board. Explore our marketplace to find local services and connect with professionals in your area.',
        type: 'feature',
        priority: 'high',
        startDate: new Date().toISOString(),
        isActive: true,
        isDismissible: true,
        actionUrl: '/marketplace',
        actionText: 'Explore Marketplace',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'New Features Coming Soon',
        message: 'We\'re working on exciting new features including Academy courses, Supplies marketplace, and Financial services. Stay tuned!',
        type: 'info',
        priority: 'medium',
        startDate: new Date().toISOString(),
        isActive: true,
        isDismissible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Profile Completion',
        message: 'Complete your profile to get better matches and increase your visibility to potential clients.',
        type: 'warning',
        priority: 'medium',
        startDate: new Date().toISOString(),
        isActive: true,
        isDismissible: true,
        actionUrl: '/profile/edit',
        actionText: 'Complete Profile',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      announcements: mockAnnouncements
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

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

    // Make request to external API using request-based authentication
    const response = await makeAuthenticatedRequest(
      request,
      `${API_BASE_URL}${API_ENDPOINTS.announcements}`,
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || `External service error: ${response.status}`,
          errorMessage: "Failed to create announcement in external service"
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Announcements API: External API response:", data);

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error creating announcement:', error);

    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "Request timeout - the external service is taking too long to respond";
        statusCode = 504;
      } else if (error.message.includes('fetch failed')) {
        errorMessage = "Unable to connect to external service - please try again later";
        statusCode = 503;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      },
      { status: statusCode }
    );
  }
}