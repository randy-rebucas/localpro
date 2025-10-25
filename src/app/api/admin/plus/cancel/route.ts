import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function POST(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    const body = await request.json();

    // Validate required fields
    if (!body.subscriptionId) {
      throw new Error("Missing required field: subscriptionId");
    }

    // Cancel subscription via external API
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'localProPlusCancel',
      {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: body.subscriptionId,
          reason: body.reason || 'Admin cancellation',
          immediate: body.immediate || false,
          refundAmount: body.refundAmount || null
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    const cancellation = await response.json();
    return cancellation;
  }, "Cancel plus subscription");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
