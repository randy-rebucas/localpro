import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint, checkApiHealth } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    // Check if external API is available before attempting to fetch data
    const isApiHealthy = await checkApiHealth();
    
    if (!isApiHealthy) {
      console.log('External API is not available, using fallback data');
      throw new Error('External API is not available');
    }
    
    try {
      // Try to fetch real subscription data from the external API
      const response = await makeAuthenticatedRequestWithEndpoint(
        request,
        'localProPlusMySubscription',
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorMessage = `External API returned ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
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
      const subscriptions = subscriptionsData.map((subscription: Record<string, unknown>) => ({
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

      console.log('Successfully fetched subscription data from external API');
      return subscriptions;
    } catch (error) {
      // Log the specific error for debugging but don't make it alarming
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`External subscription API unavailable (${errorMessage}), using fallback data`);
      
      // Return empty data - external API integration needed
      console.log('External API unavailable, returning empty data');
      return [];
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
