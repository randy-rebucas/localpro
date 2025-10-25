import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function POST(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    const body = await request.json();

    // Validate required fields
    if (!body.planId || !body.billingPeriod) {
      throw new Error("Missing required fields: planId, billingPeriod");
    }

    // Create subscription via external API
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'localProPlusSubscribe',
      {
        method: 'POST',
        body: JSON.stringify({
          planId: body.planId,
          billingPeriod: body.billingPeriod,
          paymentMethod: body.paymentMethod || 'credit_card',
          userId: body.userId,
          promoCode: body.promoCode || null
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }

    const subscription = await response.json();
    return subscription;
  }, "Create plus subscription");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
