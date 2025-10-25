import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// GET /api/audit-logs/export/data - Export audit logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin access for audit log export
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Add export-specific parameters
    const exportParams = {
      ...queryParams,
      type: 'audit',
      export: 'true',
      includeUserDetails: 'true',
      includeSystemDetails: 'true',
      format: queryParams.format || 'json'
    };

    const response = await makeAuthenticatedRequestWithPath(
      request,
      'analyticsCustom',
      [],
      exportParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to export audit logs" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Set appropriate headers for file download
    const format = queryParams.format || 'json';
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    
    const headers = new Headers();
    headers.set('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    
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
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: statusCode }
    );
  }
}
