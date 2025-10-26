import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";
import { getServerSession } from "@/lib/server-session";

// GET /api/localpro-plus/analytics - Get subscription analytics (ADMIN ONLY)
export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    // Check admin permissions
    const session = await getServerSession(request);
    
    if (!session?.user || session.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin privileges required');
    }

    // Fetch real analytics data from the external API
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'localProPlusAnalytics',
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics data: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    
    // Handle different response formats from the API
    let analyticsData;
    if (responseData.data) {
      analyticsData = responseData.data;
    } else if (responseData.analytics) {
      analyticsData = responseData.analytics;
    } else if (responseData.success && responseData.data) {
      analyticsData = responseData.data;
    } else {
      analyticsData = responseData;
    }
    
    // Extract plus subscription specific metrics with better data parsing
    const stats = {
      // Core metrics
      totalSubscribers: Number(analyticsData.totalSubscribers || analyticsData.plusSubscribers?.total || analyticsData.subscribers?.total || 0),
      activeSubscriptions: Number(analyticsData.activeSubscriptions || analyticsData.plusSubscribers?.active || analyticsData.subscriptions?.active || 0),
      monthlyRevenue: Number(analyticsData.monthlyRevenue || analyticsData.plusRevenue?.monthly || analyticsData.revenue?.monthly || 0),
      annualRevenue: Number(analyticsData.annualRevenue || analyticsData.plusRevenue?.annual || analyticsData.revenue?.annual || 0),
      averageRating: Number(analyticsData.averageRating || analyticsData.plusRating?.average || analyticsData.rating?.average || 0),
      churnRate: Number(analyticsData.churnRate || analyticsData.plusMetrics?.churnRate || analyticsData.metrics?.churnRate || 0),
      conversionRate: Number(analyticsData.conversionRate || analyticsData.plusMetrics?.conversionRate || analyticsData.metrics?.conversionRate || 0),
      popularPlan: analyticsData.popularPlan || analyticsData.plusMetrics?.popularPlan || analyticsData.metrics?.popularPlan || 'Pro',
      revenueGrowth: Number(analyticsData.revenueGrowth || analyticsData.plusMetrics?.revenueGrowth || analyticsData.metrics?.revenueGrowth || 0),
      newSubscribersToday: Number(analyticsData.newSubscribersToday || analyticsData.plusSubscribers?.newToday || analyticsData.subscribers?.newToday || 0),
      cancelledSubscriptions: Number(analyticsData.cancelledSubscriptions || analyticsData.plusSubscribers?.cancelled || analyticsData.subscriptions?.cancelled || 0),
      pendingPayments: Number(analyticsData.pendingPayments || analyticsData.plusPayments?.pending || analyticsData.payments?.pending || 0),
      
      // Additional analytics with better parsing
      planDistribution: analyticsData.planDistribution || analyticsData.plan_distribution || {},
      revenueByPlan: analyticsData.revenueByPlan || analyticsData.revenue_by_plan || {},
      subscriptionTrends: analyticsData.subscriptionTrends || analyticsData.subscription_trends || {},
      userRetention: analyticsData.userRetention || analyticsData.user_retention || {},
      paymentMethods: analyticsData.paymentMethods || analyticsData.payment_methods || {},
      geographicDistribution: analyticsData.geographicDistribution || analyticsData.geographic_distribution || {},
      monthlyActiveUsers: Number(analyticsData.monthlyActiveUsers || analyticsData.mau || 0),
      averageRevenuePerUser: Number(analyticsData.averageRevenuePerUser || analyticsData.arpu || 0),
      lifetimeValue: Number(analyticsData.lifetimeValue || analyticsData.ltv || 0),
      refundRate: Number(analyticsData.refundRate || analyticsData.refund_rate || 0),
      upgradeRate: Number(analyticsData.upgradeRate || analyticsData.upgrade_rate || 0),
      downgradeRate: Number(analyticsData.downgradeRate || analyticsData.downgrade_rate || 0)
    };

    return stats;
  }, "Plus subscription analytics");

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
