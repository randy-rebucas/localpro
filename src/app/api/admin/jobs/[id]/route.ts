import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const includeApplications = searchParams.get('includeApplications') === 'true';
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';

    // Use API constants approach to fetch specific job data
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {};
      if (includeApplications) queryParams.includeApplications = 'true';
      if (includeAnalytics) queryParams.includeAnalytics = 'true';

      const response = await makeAuthenticatedRequestWithPath(
        request,
        'jobsById',
        [id],
        queryParams,
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch job: ${response.status}`);
      }

      const jobData = await response.json();
      return jobData.data || jobData;
    }, "Job data");

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin job GET API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job data' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Use API constants approach to update job
    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'jobsById',
        [id],
        {},
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update job: ${response.status}`);
      }

      const jobData = await response.json();
      return jobData.data || jobData;
    }, "Job update");

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin job PUT API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Use API constants approach to delete job
    const result = await handleApiRoute(async () => {
      const response = await makeAuthenticatedRequestWithPath(
        request,
        'jobsById',
        [id],
        {},
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    }, "Job deletion");

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin job DELETE API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
