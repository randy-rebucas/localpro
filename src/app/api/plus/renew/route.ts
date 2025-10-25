import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function POST(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    const body = await request.json();

    // Validate required fields
    if (!body.subscriptionId) {
      throw new Error("Missing required field: subscriptionId");
    }

    // Renew subscription via external API
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'localProPlusRenew',
      {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: body.subscriptionId,
          billingPeriod: body.billingPeriod,
          paymentMethod: body.paymentMethod || 'credit_card',
          promoCode: body.promoCode || null,
          autoRenew: body.autoRenew || true
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to renew subscription');
    }

    const renewal = await response.json();
    return renewal;
  }, "Renew plus subscription");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
