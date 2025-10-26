import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    try {
      // Fetch subscription plans from external API
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
      const plans = plansData.map((plan: {
        id: string;
        name: string;
        monthlyPrice: number;
        annualPrice: number;
        description: string;
        features?: string[];
        isPopular?: boolean;
        maxUsers?: number;
        maxStorage?: number;
        supportLevel?: string;
      }) => ({
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
          annualPrice: 1990,
          description: "Perfect for individuals getting started",
          features: [
            "Up to 5 service listings",
            "Basic analytics",
            "Email support",
            "Standard templates"
          ],
          isActive: true,
          color: "bg-green-100 text-green-700",
          targetAudience: "individuals",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        },
        {
          id: "pro",
          name: "Pro",
          monthlyPrice: 499,
          annualPrice: 4990,
          description: "Ideal for growing businesses",
          features: [
            "Up to 25 service listings",
            "Advanced analytics",
            "Priority support",
            "Custom templates",
            "API access"
          ],
          isActive: true,
          color: "bg-blue-100 text-blue-700",
          targetAudience: "small_business",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        },
        {
          id: "elite",
          name: "Elite",
          monthlyPrice: 999,
          annualPrice: 9990,
          description: "For established businesses",
          features: [
            "Unlimited service listings",
            "Premium analytics",
            "24/7 support",
            "White-label options",
            "Advanced API access",
            "Custom integrations"
          ],
          isActive: true,
          color: "bg-purple-100 text-purple-700",
          targetAudience: "enterprise",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        },
        {
          id: "business-partner",
          name: "Business Partner",
          monthlyPrice: 1499,
          annualPrice: 14990,
          description: "For agencies and partners",
          features: [
            "Unlimited everything",
            "Partner dashboard",
            "Revenue sharing",
            "Dedicated account manager",
            "Custom branding",
            "Advanced reporting"
          ],
          isActive: true,
          color: "bg-yellow-100 text-yellow-700",
          targetAudience: "agencies",
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

  return NextResponse.json({ success: true, data: result.data });
}