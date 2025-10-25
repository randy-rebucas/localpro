import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    try {
      // Try to fetch real subscription plans from the external API
      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'localProPlusPlans',
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
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
      } else {
        throw new Error('Invalid response format from plans API');
      }
      
      // Transform the API response to match our interface
      const plans = plansData.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        description: plan.description,
        features: plan.features || [],
        isActive: plan.isActive !== false,
        color: plan.color || "bg-blue-100 text-blue-700",
        targetAudience: plan.targetAudience || null,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }));

      return plans;
    } catch (error) {
      console.warn('External plans API not available, using fallback data:', error);
      
      // Fallback to mock data when external API is not available
      const mockPlans = [
        {
          id: "starter",
          name: "Starter",
          monthlyPrice: 199,
          annualPrice: 2000,
          description: "Perfect for individuals starting their service business",
          features: [
            "Access to job listings",
            "Wallet tools",
            "Basic profile visibility",
            "Email support",
            "Mobile app access"
          ],
          isActive: true,
          color: "bg-blue-100 text-blue-700",
          targetAudience: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        },
        {
          id: "pro",
          name: "Pro",
          monthlyPrice: 499,
          annualPrice: 5000,
          description: "Advanced features for growing service providers",
          features: [
            "Priority listing placement",
            "Advanced analytics dashboard",
            "Professional badge",
            "Enhanced profile visibility",
            "Priority customer support",
            "Performance insights",
            "Custom branding options"
          ],
          isActive: true,
          color: "bg-yellow-100 text-yellow-700",
          targetAudience: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        },
        {
          id: "elite",
          name: "Elite",
          monthlyPrice: 999,
          annualPrice: 10000,
          description: "Premium features for established service providers",
          features: [
            "Premium visibility boost",
            "Leads guarantee program",
            "Everything in Pro",
            "Dedicated account manager",
            "Advanced analytics & insights",
            "Custom integrations",
            "Priority booking placement",
            "24/7 phone support"
          ],
          isActive: true,
          color: "bg-purple-100 text-purple-700",
          targetAudience: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        },
        {
          id: "business-partner",
          name: "Business Partner",
          monthlyPrice: 1499,
          annualPrice: 15000,
          description: "Enterprise solution for hotels, developers, and agencies",
          features: [
            "Multi-location management",
            "Team collaboration tools",
            "White-label solutions",
            "Custom integrations",
            "Dedicated account manager",
            "Everything in Elite",
            "Advanced security features",
            "Custom training sessions",
            "API access",
            "Bulk operations"
          ],
          isActive: true,
          color: "bg-emerald-100 text-emerald-700",
          targetAudience: "For hotels, developers, agencies",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        }
      ];

      return mockPlans;
    }
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

export async function POST(request: NextRequest) {
  const result = await handleApiRoute(async () => {
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
      throw new Error('Failed to create subscription plan');
    }

    const newPlan = await response.json();
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
