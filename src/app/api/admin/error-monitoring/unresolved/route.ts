import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const level = searchParams.get('level');
    const environment = searchParams.get('environment');
    const search = searchParams.get('search');

    // Try to fetch real unresolved errors from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
        status: 'unresolved'
      };

      if (level && level !== 'all') {
        queryParams.level = level;
      }
      if (environment && environment !== 'all') {
        queryParams.environment = environment;
      }
      if (search) {
        queryParams.search = search;
      }

      const response = await makeAuthenticatedRequestWithPath(
        request,
        'errorMonitoringUnresolved',
        [],
        queryParams,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch unresolved errors: ${response.status}`);
      }

      const errorsData = await response.json();
      return errorsData.data || errorsData;
    }, "Unresolved errors");

    // If external API fails, provide fallback empty data
    if (result.error) {
      console.warn('External API failed, using fallback data:', result.error);
      
      return NextResponse.json({
        success: true,
        data: {
          errors: [],
          stats: {
            total: 0,
            critical: 0,
            errors: 0,
            warnings: 0,
            info: 0
          }
        },
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        },
        generatedAt: new Date().toISOString(),
        fallback: true
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.data?.pagination || {
        page,
        limit,
        total: result.data?.errors?.length || 0,
        totalPages: Math.ceil((result.data?.errors?.length || 0) / limit)
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching unresolved errors:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
