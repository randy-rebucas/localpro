import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function POST(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    const body = await request.json();

    // Validate required fields
    if (!body.subscriptionId || !body.paymentId) {
      throw new Error("Missing required fields: subscriptionId, paymentId");
    }

    // Confirm payment via external API
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'localProPlusConfirmPayment',
      {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: body.subscriptionId,
          paymentId: body.paymentId,
          amount: body.amount,
          currency: body.currency || 'PHP',
          paymentMethod: body.paymentMethod || 'credit_card',
          transactionId: body.transactionId
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to confirm payment');
    }

    const confirmation = await response.json();
    return confirmation;
  }, "Confirm plus subscription payment");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
