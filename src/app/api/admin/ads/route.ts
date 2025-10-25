import { NextRequest, NextResponse } from 'next/server';
import { 
  makeAuthenticatedRequestWithPath, 
  handleApiRoute, 
  createErrorResponse 
} from '@/lib/api-auth-utils';

export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    // Build query parameters for the API request
    const queryParams: Record<string, string> = {
      page,
      limit
    };

    if (search) queryParams.search = search;
    if (category && category !== 'all') queryParams.category = category;
    if (status && status !== 'all') queryParams.status = status;
    if (type && type !== 'all') queryParams.type = type;

    // Make authenticated request to the ads API endpoint
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'ads',
      [], // No path parameters
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  }, "Admin ads fetch");

  if (result.error) {
    return NextResponse.json(
      { 
        success: false, 
        error: result.error, 
        details: result.details 
      },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}
