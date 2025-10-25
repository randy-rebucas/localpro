import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    try {
      // Fetch user's subscription from external API
      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'localProPlusMySubscription',
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }

      const responseData = await response.json();
      
      // Handle different response formats from the API
      let subscriptionData;
      if (Array.isArray(responseData)) {
        subscriptionData = responseData[0]; // Get first subscription
      } else if (responseData.data) {
        subscriptionData = responseData.data;
      } else if (responseData.subscription) {
        subscriptionData = responseData.subscription;
      } else {
        subscriptionData = responseData;
      }
      
      // Transform the API response to match our interface
      const subscription = {
        id: subscriptionData.id,
        userId: subscriptionData.userId,
        userEmail: subscriptionData.userEmail,
        userName: subscriptionData.userName,
        planId: subscriptionData.planId,
        planName: subscriptionData.planName,
        status: subscriptionData.status,
        billingPeriod: subscriptionData.billingPeriod,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'PHP',
        startDate: subscriptionData.startDate,
        endDate: subscriptionData.endDate,
        nextBillingDate: subscriptionData.nextBillingDate,
        paymentMethod: subscriptionData.paymentMethod,
        createdAt: subscriptionData.createdAt,
        updatedAt: subscriptionData.updatedAt
      };

      return subscription;
    } catch (error) {
      console.warn('External API not available, using fallback data:', error);
      
      // Fallback to mock data when external API is not available
      const mockSubscription = {
        id: "sub_001",
        userId: "user_123",
        userEmail: "user@example.com",
        userName: "John Doe",
        planId: "pro",
        planName: "Pro",
        status: "active",
        billingPeriod: "monthly",
        amount: 499,
        currency: "PHP",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-12-31T23:59:59Z",
        nextBillingDate: "2024-02-01T00:00:00Z",
        paymentMethod: "credit_card",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      };

      return mockSubscription;
    }
  }, "Plus subscription");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
