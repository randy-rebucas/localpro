"use client";

import { useState } from "react";
import { useDashboardAnalytics, useRealtimeAnalytics, useTimeSeriesAnalytics, useComparisonAnalytics } from "@/features/analytics/hooks";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Users, DollarSign, Calendar, Activity } from "lucide-react";
import type { Timeframe, MetricType, Granularity } from "@/features/analytics/types";
import { formatAdminNumber, formatAdminCurrency } from "@/features/admin/lib/admin-utils";

interface AnalyticsDashboardProps {
  defaultTimeframe?: Timeframe;
}

export function AnalyticsDashboard({ defaultTimeframe = "30d" }: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("users");
  const [granularity] = useState<Granularity>("daily");

  const { dashboard, loading: dashboardLoading, error: dashboardError } = useDashboardAnalytics({ timeframe });
  const { realtime, loading: realtimeLoading } = useRealtimeAnalytics();
  const { timeSeries } = useTimeSeriesAnalytics({
    metric: selectedMetric,
    timeframe,
    granularity,
  });
  const { comparison } = useComparisonAnalytics(timeframe);

  if (dashboardLoading || realtimeLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error loading analytics: {dashboardError}</div>
      </div>
    );
  }

  const summary = dashboard?.summary;
  const growth = dashboard?.growth;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as Timeframe)}
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </Select>
          <Select
            value={selectedMetric}
            onValueChange={(value) => setSelectedMetric(value as MetricType)}
          >
            <option value="users">Users</option>
            <option value="bookings">Bookings</option>
            <option value="revenue">Revenue</option>
            <option value="services">Services</option>
            <option value="jobs">Jobs</option>
            <option value="referrals">Referrals</option>
          </Select>
        </div>
      </div>

      {/* Real-time Metrics */}
      {realtime && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold">{realtime.activeUsers || 0}</p>
                <p className="text-xs text-gray-400">Last 15 min: {realtime.activeUsersLast15Min || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recent Bookings</p>
                <p className="text-2xl font-bold">{realtime.recentBookings || 0}</p>
                <p className="text-xs text-gray-400">Last hour: {realtime.recentBookingsLastHour || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">System Health</p>
                <p className="text-2xl font-bold capitalize">{realtime.systemHealth?.status || "healthy"}</p>
                <p className="text-xs text-gray-400">Response: {realtime.systemHealth?.responseTime || 0}ms</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{formatAdminNumber(summary.totalUsers || 0)}</p>
                {growth?.users && (
                  <p className={`text-xs ${growth.users.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {growth.users.trend === "up" ? "+" : ""}{growth.users.percentage.toFixed(1)}%
                  </p>
                )}
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold">{formatAdminNumber(summary.totalBookings || 0)}</p>
                {growth?.bookings && (
                  <p className={`text-xs ${growth.bookings.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {growth.bookings.trend === "up" ? "+" : ""}{growth.bookings.percentage.toFixed(1)}%
                  </p>
                )}
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">{formatAdminCurrency(summary.totalRevenue || 0)}</p>
                {growth?.revenue && (
                  <p className={`text-xs ${growth.revenue.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {growth.revenue.trend === "up" ? "+" : ""}{growth.revenue.percentage.toFixed(1)}%
                  </p>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Services</p>
                <p className="text-2xl font-bold">{formatAdminNumber(summary.totalServices || 0)}</p>
                {growth?.services && (
                  <p className={`text-xs ${growth.services.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {growth.services.trend === "up" ? "+" : ""}{growth.services.percentage.toFixed(1)}%
                  </p>
                )}
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Comparison */}
      {comparison && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Period Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Current Period</p>
              <p className="text-2xl font-bold">{formatAdminNumber(comparison.current.value)}</p>
              <p className="text-xs text-gray-400">{comparison.current.period}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Previous Period</p>
              <p className="text-2xl font-bold">{formatAdminNumber(comparison.previous.value)}</p>
              <p className="text-xs text-gray-400">{comparison.previous.period}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">Change</p>
            <p className={`text-xl font-bold ${comparison.change.trend === "up" ? "text-green-600" : comparison.change.trend === "down" ? "text-red-600" : "text-gray-600"}`}>
              {comparison.change.trend === "up" ? "+" : ""}{comparison.change.percentage.toFixed(1)}%
            </p>
          </div>
        </Card>
      )}

      {/* Time Series Chart Placeholder */}
      {timeSeries && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart visualization would go here
            <br />
            (Integrate with Recharts or Chart.js)
          </div>
        </Card>
      )}
    </div>
  );
}

