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
        isActive?: boolean;
        color?: string;
        targetAudience?: string;
        createdAt?: string;
        updatedAt?: string;
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
      
      // Return empty data - external API integration needed
      return [];
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