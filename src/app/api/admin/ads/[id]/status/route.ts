import { NextRequest, NextResponse } from 'next/server';
import { 
  makeAuthenticatedRequestWithPath, 
  handleApiRoute, 
  createErrorResponse 
} from '@/lib/api-auth-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await handleApiRoute(async () => {
    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!id) {
      throw new Error('Ad ID is required');
    }

    if (!status) {
      throw new Error('Status is required');
    }

    const validStatuses = ['draft', 'pending', 'active', 'paused', 'expired', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    // Make authenticated request to update ad status
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'adsById',
      [id, 'status'], // Path parameters: ad ID and status endpoint
      {},
      {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  }, "Ad status update");

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
