"use client";

import { useDashboardAnalytics, useRealtimeAnalytics } from "@/features/analytics/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Activity,
  RefreshCw,
  Download
} from "lucide-react";
import { 
  formatAdminNumber, 
  formatAdminCurrency, 
  calculateDashboardMetrics
} from "@/features/admin/lib/admin-utils";
import { useExportAnalytics } from "@/features/analytics/hooks/useDashboardAnalytics";
import type { Timeframe } from "@/features/analytics/types";

interface AdminDashboardSummaryProps {
  timeframe?: Timeframe;
  onRefresh?: () => void;
  onExport?: () => void;
}

export function AdminDashboardSummary({ 
  timeframe = "30d",
  onRefresh,
  onExport 
}: AdminDashboardSummaryProps) {
  const { dashboard, loading, error, refetch } = useDashboardAnalytics({ timeframe });
  const { realtime } = useRealtimeAnalytics();
  const { exportData, exporting } = useExportAnalytics("overview", timeframe, "json");

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  const handleExport = () => {
    exportData();
    onExport?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error loading dashboard: {error}</div>
      </div>
    );
  }

  const summary = dashboard?.summary;
  const growth = dashboard?.growth;
  const metrics = calculateDashboardMetrics({
    revenue: summary?.totalRevenue,
    bookings: summary?.totalBookings,
    users: summary?.totalUsers,
    providers: summary?.activeProviders,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Platform overview and statistics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      {realtime && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold">{realtime.activeUsers || 0}</p>
                <p className="text-xs text-gray-400">
                  Last 15 min: {realtime.activeUsersLast15Min || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recent Bookings</p>
                <p className="text-2xl font-bold">{realtime.recentBookings || 0}</p>
                <p className="text-xs text-gray-400">
                  Last hour: {realtime.recentBookingsLastHour || 0}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">System Health</p>
                <p className="text-2xl font-bold capitalize">
                  {realtime.systemHealth?.status || "healthy"}
                </p>
                <p className="text-xs text-gray-400">
                  Response: {realtime.systemHealth?.responseTime || 0}ms
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAdminNumber(summary.totalUsers || 0)}
                </p>
                {growth?.users && (
                  <div className="flex items-center mt-1">
                    {growth.users.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : growth.users.trend === "down" ? (
                      <TrendingUp className="w-4 h-4 text-red-500 mr-1 rotate-180" />
                    ) : null}
                    <p className={`text-xs ${growth.users.trend === "up" ? "text-green-600" : growth.users.trend === "down" ? "text-red-600" : "text-gray-600"}`}>
                      {growth.users.trend === "up" ? "+" : ""}{growth.users.percentage.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAdminNumber(summary.totalBookings || 0)}
                </p>
                {growth?.bookings && (
                  <div className="flex items-center mt-1">
                    {growth.bookings.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : growth.bookings.trend === "down" ? (
                      <TrendingUp className="w-4 h-4 text-red-500 mr-1 rotate-180" />
                    ) : null}
                    <p className={`text-xs ${growth.bookings.trend === "up" ? "text-green-600" : growth.bookings.trend === "down" ? "text-red-600" : "text-gray-600"}`}>
                      {growth.bookings.trend === "up" ? "+" : ""}{growth.bookings.percentage.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAdminCurrency(summary.totalRevenue || 0)}
                </p>
                {growth?.revenue && (
                  <div className="flex items-center mt-1">
                    {growth.revenue.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : growth.revenue.trend === "down" ? (
                      <TrendingUp className="w-4 h-4 text-red-500 mr-1 rotate-180" />
                    ) : null}
                    <p className={`text-xs ${growth.revenue.trend === "up" ? "text-green-600" : growth.revenue.trend === "down" ? "text-red-600" : "text-gray-600"}`}>
                      {growth.revenue.trend === "up" ? "+" : ""}{growth.revenue.percentage.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Providers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAdminNumber(summary.activeProviders || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {summary.totalServices || 0} services
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Conversion Rate</p>
            <p className="text-3xl font-bold">{metrics.conversionRate.toFixed(2)}%</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Average Order Value</p>
            <p className="text-3xl font-bold">{formatAdminCurrency(metrics.averageOrderValue)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Total Transactions</p>
            <p className="text-3xl font-bold">{formatAdminNumber(metrics.totalBookings)}</p>
          </Card>
        </div>
      )}
    </div>
  );
}

