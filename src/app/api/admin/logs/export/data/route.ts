import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const user = searchParams.get('user');
    const source = searchParams.get('source');
    const search = searchParams.get('search');

    // Fetch and export logs data from external API
    const result = await handleApiRoute(async () => {
      const queryParams: Record<string, string> = { format };
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;
      if (level) queryParams.level = level;
      if (category) queryParams.category = category;
      if (user) queryParams.user = user;
      if (source) queryParams.source = source;
      if (search) queryParams.search = search;

      const response = await makeAuthenticatedRequestWithPath(
        request,
        'logsExportData',
        [],
        queryParams,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to export logs data: ${response.status}`);
      }

      // Return the response as-is for file downloads
      return response;
    }, "Logs export");

    if (result.error) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    // Handle file download response
    if (result.data instanceof Response) {
      const response = result.data;
      const contentType = format === 'csv' 
        ? 'text/csv' 
        : format === 'json' 
          ? 'application/json' 
          : 'application/octet-stream';
      
      const filename = `system-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          ...response.headers
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Admin logs export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
