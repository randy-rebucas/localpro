import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";
import { getServerSession } from "@/lib/server-session";

// GET /api/localpro-plus/plans - Get all subscription plans (public)
export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    // Fetch real subscription plans from the external API
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'localProPlusPlans',
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription plans: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    
    // Handle different response formats from the API
    let plansData;
    if (Array.isArray(responseData)) {
      plansData = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      plansData = responseData.data;
    } else if (responseData.plans && Array.isArray(responseData.plans)) {
      plansData = responseData.plans;
    } else if (responseData.success && responseData.data && Array.isArray(responseData.data)) {
      plansData = responseData.data;
    } else {
      console.error('Unexpected API response format:', responseData);
      throw new Error('Invalid response format from plans API');
    }
    
    // Transform the API response to match our interface
    const plans = plansData.map((plan: Record<string, unknown>) => ({
      id: plan.id || plan._id,
      name: plan.name || plan.title,
      monthlyPrice: Number(plan.monthlyPrice) || 0,
      annualPrice: Number(plan.annualPrice) || 0,
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features : [],
      isActive: plan.isActive !== false && plan.status !== 'inactive',
      color: plan.color || "bg-blue-100 text-blue-700",
      targetAudience: plan.targetAudience || plan.audience || null,
      createdAt: plan.createdAt || plan.created_at || new Date().toISOString(),
      updatedAt: plan.updatedAt || plan.updated_at || new Date().toISOString()
    }));

    return plans;
  }, "Plus subscription plans");

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

// POST /api/localpro-plus/plans - Create subscription plan (ADMIN ONLY)
export async function POST(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    // Check admin permissions
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin privileges required');
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.description || !body.monthlyPrice || !body.annualPrice) {
      throw new Error("Missing required fields: name, description, monthlyPrice, annualPrice");
    }

    // Create new plan via external API
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'localProPlusPlans',
      {
        method: 'POST',
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
      throw new Error(`Failed to create subscription plan: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    
    // Handle different response formats
    let newPlan;
    if (responseData.data) {
      newPlan = responseData.data;
    } else if (responseData.plan) {
      newPlan = responseData.plan;
    } else {
      newPlan = responseData;
    }

    return newPlan;
  }, "Create plus subscription plan");

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
