import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await handleApiRoute(async () => {
    const body = await request.json();
    const planId = params.id;

    // Validate required fields
    if (!body.name || !body.description || !body.monthlyPrice || !body.annualPrice) {
      throw new Error("Missing required fields: name, description, monthlyPrice, annualPrice");
    }

    // Update plan via external API
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'localProPlusPlanById',
      [planId],
      {},
      {
        method: 'PUT',
        body: JSON.stringify({
          name: body.name,
          description: body.description,
          monthlyPrice: parseFloat(body.monthlyPrice),
          annualPrice: parseFloat(body.annualPrice),
          features: body.features || [],
          isActive: body.isActive !== false,
          color: body.color || "bg-blue-100 text-blue-700",
          targetAudience: body.targetAudience || null
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update subscription plan');
    }

    const updatedPlan = await response.json();
    return updatedPlan;
  }, "Update plus subscription plan");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json({
    success: true,
    data: result.data
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await handleApiRoute(async () => {
    const planId = params.id;

    // Delete plan via external API
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'localProPlusPlanById',
      [planId],
      {},
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error('Failed to delete subscription plan');
    }

    return { id: planId, deleted: true };
  }, "Delete plus subscription plan");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json({
    success: true,
    data: result.data
  });
}
