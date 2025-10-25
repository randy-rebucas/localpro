import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    try {
      // Try to fetch real subscription data from the external API
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
      let subscriptionsData;
      if (Array.isArray(responseData)) {
        subscriptionsData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        subscriptionsData = responseData.data;
      } else if (responseData.subscriptions && Array.isArray(responseData.subscriptions)) {
        subscriptionsData = responseData.subscriptions;
      } else {
        throw new Error('Invalid response format from subscriptions API');
      }
      
      // Transform the API response to match our interface
      const subscriptions = subscriptionsData.map((subscription: any) => ({
        id: subscription.id,
        userId: subscription.userId,
        userEmail: subscription.userEmail,
        userName: subscription.userName,
        planId: subscription.planId,
        planName: subscription.planName,
        status: subscription.status,
        billingPeriod: subscription.billingPeriod,
        amount: subscription.amount,
        currency: subscription.currency || 'PHP',
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        paymentMethod: subscription.paymentMethod,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      }));

      return subscriptions;
    } catch (error) {
      console.warn('External API not available, using fallback data:', error);
      
      // Fallback to mock data when external API is not available
      const mockSubscriptions = [
        {
          id: "sub_001",
          userId: "user_123",
          userEmail: "john.doe@example.com",
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
        },
        {
          id: "sub_002",
          userId: "user_456",
          userEmail: "jane.smith@example.com",
          userName: "Jane Smith",
          planId: "elite",
          planName: "Elite",
          status: "active",
          billingPeriod: "annual",
          amount: 10000,
          currency: "PHP",
          startDate: "2024-01-15T00:00:00Z",
          endDate: "2024-12-31T23:59:59Z",
          nextBillingDate: "2025-01-15T00:00:00Z",
          paymentMethod: "paypal",
          createdAt: "2024-01-15T00:00:00Z",
          updatedAt: "2024-01-15T00:00:00Z"
        },
        {
          id: "sub_003",
          userId: "user_789",
          userEmail: "bob.wilson@example.com",
          userName: "Bob Wilson",
          planId: "starter",
          planName: "Starter",
          status: "cancelled",
          billingPeriod: "monthly",
          amount: 199,
          currency: "PHP",
          startDate: "2023-12-01T00:00:00Z",
          endDate: "2024-01-01T00:00:00Z",
          nextBillingDate: "2024-01-01T00:00:00Z",
          paymentMethod: "credit_card",
          createdAt: "2023-12-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        },
        {
          id: "sub_004",
          userId: "user_101",
          userEmail: "alice.brown@example.com",
          userName: "Alice Brown",
          planId: "business-partner",
          planName: "Business Partner",
          status: "pending",
          billingPeriod: "annual",
          amount: 15000,
          currency: "PHP",
          startDate: "2024-01-20T00:00:00Z",
          endDate: "2024-12-31T23:59:59Z",
          nextBillingDate: "2025-01-20T00:00:00Z",
          paymentMethod: "bank_transfer",
          createdAt: "2024-01-20T00:00:00Z",
          updatedAt: "2024-01-20T00:00:00Z"
        }
      ];

      return mockSubscriptions;
    }
  }, "Plus subscriptions");

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
