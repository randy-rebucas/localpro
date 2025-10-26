import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";
import { getServerSession } from "@/lib/server-session";

// PUT /api/localpro-plus/plans/:id - Update subscription plan (ADMIN ONLY)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await handleApiRoute(async () => {
    // Check admin permissions
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin privileges required');
    }

    const body = await request.json();
    const { id: planId } = await params;

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
        headers: {
          'Content-Type': 'application/json'
        },
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
      const errorText = await response.text();
      throw new Error(`Failed to update subscription plan: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    
    // Handle different response formats
    let updatedPlan;
    if (responseData.data) {
      updatedPlan = responseData.data;
    } else if (responseData.plan) {
      updatedPlan = responseData.plan;
    } else {
      updatedPlan = responseData;
    }

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

// DELETE /api/localpro-plus/plans/:id - Delete subscription plan (ADMIN ONLY)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await handleApiRoute(async () => {
    // Check admin permissions
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin privileges required');
    }

    const { id: planId } = await params;

    // Delete plan via external API
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'localProPlusPlanById',
      [planId],
      {},
      { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete subscription plan: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    
    // Handle different response formats
    if (responseData.success || responseData.deleted) {
      return { id: planId, deleted: true };
    } else {
      return { id: planId, deleted: true, message: 'Plan deleted successfully' };
    }
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
