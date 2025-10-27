import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { makeAuthenticatedRequestWithPath, handleApiRoute } from '@/lib/api-auth-utils';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestIds, action, notes, rejectionReason } = body;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json(
        { error: 'Request IDs are required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'under_review', 'pending'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const result = await handleApiRoute(async () => {
      const results = [];
      const errors = [];

      // Process each request individually
      for (const requestId of requestIds) {
        try {
          let status: string;
          switch (action) {
            case 'approve':
              status = 'approved';
              break;
            case 'reject':
              status = 'rejected';
              break;
            case 'under_review':
              status = 'under_review';
              break;
            case 'pending':
              status = 'pending';
              break;
            default:
              status = 'pending';
          }

          const response = await makeAuthenticatedRequestWithPath(
            request,
            'trustVerificationReview',
            [requestId],
            {},
            {
              method: 'PATCH',
              body: JSON.stringify({
                status,
                notes,
                rejectionReason,
                reviewedBy: session.user.id,
                reviewedAt: new Date().toISOString()
              })
            }
          );

          if (response.ok) {
            const updateData = await response.json();
            results.push({
              requestId,
              success: true,
              data: updateData.data || updateData
            });
          } else {
            errors.push({
              requestId,
              error: `Failed to update request ${requestId}: ${response.status}`
            });
          }
        } catch (error) {
          errors.push({
            requestId,
            error: `Error updating request ${requestId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      return {
        results,
        errors,
        totalProcessed: requestIds.length,
        successful: results.length,
        failed: errors.length
      };
    }, "Bulk trust verification request update");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'No data returned from bulk operation' },
        { status: 500 }
      );
    }

    const { results, errors, totalProcessed, successful, failed } = result.data;

    return NextResponse.json({
      success: true,
      data: {
        results,
        errors,
        summary: {
          totalProcessed,
          successful,
          failed
        }
      },
      message: `Bulk action completed: ${successful} successful, ${failed} failed`
    });

  } catch (error) {
    console.error('Bulk trust verification request update error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
