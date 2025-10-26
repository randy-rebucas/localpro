import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';
import { API_ENDPOINTS } from '@/lib/api';

export async function GET(request: NextRequest) {
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
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const company = searchParams.get('company') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Use API constants approach to fetch jobs data
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {
        page,
        limit,
        sortBy,
        sortOrder
      };

      if (search) queryParams.search = search;
      if (status) queryParams.status = status;
      if (category) queryParams.category = category;
      if (type) queryParams.type = type;
      if (company) queryParams.company = company;

      const response = await makeAuthenticatedRequestWithPath(
        request,
        'jobs',
        [],
        queryParams,
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      const jobsData = await response.json();
      return {
        jobs: jobsData.data || jobsData,
        pagination: jobsData.pagination || {
          page: parseInt(page),
          limit: parseInt(limit),
          total: jobsData.total || 0,
          pages: Math.ceil((jobsData.total || 0) / parseInt(limit))
        }
      };
    }, "Jobs data");

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
    console.error('Admin jobs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { action, jobId, data: jobData } = body;

    // Handle different job management actions
    const result = await handleApiRoute(async () => {
      switch (action) {
        case 'create':
          // Create new job
          const createResponse = await makeAuthenticatedRequestWithPath(
            request,
            'jobs',
            [],
            {},
            {
              method: 'POST',
              body: JSON.stringify(jobData)
            }
          );

          if (!createResponse.ok) {
            throw new Error(`Failed to create job: ${createResponse.status}`);
          }

          return await createResponse.json();

        case 'update':
          // Update existing job
          const updateResponse = await makeAuthenticatedRequestWithPath(
            request,
            'jobs',
            [jobId],
            {},
            {
              method: 'PUT',
              body: JSON.stringify(jobData)
            }
          );

          if (!updateResponse.ok) {
            throw new Error(`Failed to update job: ${updateResponse.status}`);
          }

          return await updateResponse.json();

        case 'feature':
          // Feature/unfeature job
          const featureResponse = await makeAuthenticatedRequestWithPath(
            request,
            'jobs',
            [jobId, 'feature'],
            {},
            {
              method: 'POST',
              body: JSON.stringify({ featured: jobData.featured })
            }
          );

          if (!featureResponse.ok) {
            throw new Error(`Failed to feature job: ${featureResponse.status}`);
          }

          return await featureResponse.json();

        case 'urgent':
          // Mark job as urgent
          const urgentResponse = await makeAuthenticatedRequestWithPath(
            request,
            'jobs',
            [jobId, 'urgent'],
            {},
            {
              method: 'POST',
              body: JSON.stringify({ urgent: jobData.urgent })
            }
          );

          if (!urgentResponse.ok) {
            throw new Error(`Failed to mark job as urgent: ${urgentResponse.status}`);
          }

          return await urgentResponse.json();

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }, "Job management action");

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      action,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin jobs POST API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process job action' },
      { status: 500 }
    );
  }
}