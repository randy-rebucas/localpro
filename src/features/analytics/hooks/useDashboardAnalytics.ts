"use client";

import { useCallback, useRef, useState } from "react";
import useSWR from "swr";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { createSWRKey, swrFetcher } from "@/lib/swr-config";
import type { Timeframe, MetricType, Granularity } from "@/features/analytics/types";
import { logger } from "@/lib/logger";

// Re-export types from useAnalytics for backward compatibility
export type { Timeframe, MetricType, Granularity } from "@/features/analytics/types";

export interface DashboardSummaryData {
  summary: {
    totalUsers?: number;
    totalServices?: number;
    totalBookings?: number;
    totalRevenue?: number;
    totalJobs?: number;
    totalReferrals?: number;
    activeProviders?: number;
    activeAgencies?: number;
  };
  growth: {
    users?: {
      value: number;
      percentage: number;
      trend: "up" | "down" | "stable";
    };
    bookings?: {
      value: number;
      percentage: number;
      trend: "up" | "down" | "stable";
    };
    revenue?: {
      value: number;
      percentage: number;
      trend: "up" | "down" | "stable";
    };
    services?: {
      value: number;
      percentage: number;
      trend: "up" | "down" | "stable";
    };
  };
  recentActivity?: {
    newUsers?: number;
    newBookings?: number;
    newJobs?: number;
    newReferrals?: number;
  };
  topMetrics?: {
    topServices?: Array<{ name: string; count: number }>;
    topProviders?: Array<{ name: string; bookings: number }>;
    topCategories?: Array<{ name: string; count: number }>;
  };
}

export interface RealtimeMetricsData {
  activeUsers?: number;
  activeUsersLast15Min?: number;
  activeUsersLastHour?: number;
  recentBookings?: number;
  recentBookingsLast15Min?: number;
  recentBookingsLastHour?: number;
  recentJobs?: number;
  recentApplications?: number;
  systemHealth?: {
    status: "healthy" | "degraded" | "down";
    responseTime?: number;
    errorRate?: number;
  };
}

export interface TimeSeriesDataPoint {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
  timeframe?: Timeframe;
  granularity?: Granularity;
}

export interface ComparisonDataPoint {
  current: {
    value: number;
    period: string;
  };
  previous: {
    value: number;
    period: string;
  };
  change: {
    absolute: number;
    percentage: number;
    trend: "up" | "down" | "stable";
  };
}

export interface DashboardAnalyticsParams {
  timeframe?: Timeframe;
  startDate?: string;
  endDate?: string;
  metric?: MetricType;
  granularity?: Granularity;
  /**
   * When false, the SWR request is skipped (useful for role-gated dashboards).
   * Defaults to true.
   */
  enabled?: boolean;
}

export function useDashboardAnalytics(params: DashboardAnalyticsParams = {}) {
  const enabled = params.enabled !== false;

  const swrKey = enabled
    ? createSWRKey(API_ENDPOINTS.analyticsDashboard, {
        timeframe: params.timeframe,
        startDate: params.startDate,
        endDate: params.endDate,
      })
    : null;

  const { data, error, isLoading, mutate } = useSWR<{ data?: DashboardSummaryData } | DashboardSummaryData>(
    swrKey,
    swrFetcher,
    {
      revalidateOnFocus: true, // Revalidate dashboard on focus for real-time updates
      refreshInterval: 60000, // Refresh every minute for dashboard
    }
  );

  const dashboard = data ? ((data as { data?: DashboardSummaryData }).data || (data as DashboardSummaryData)) : null;

  return {
    dashboard,
    loading: enabled ? isLoading : false,
    error: enabled ? (error ? (error instanceof Error ? error.message : String(error)) : null) : null,
    refetch: enabled ? mutate : async () => undefined,
  };
}

export function useRealtimeAnalytics() {
  const { data, error, isLoading, mutate } = useSWR<{ data?: RealtimeMetricsData } | RealtimeMetricsData>(
    API_ENDPOINTS.analyticsRealtime,
    swrFetcher,
    {
      refreshInterval: 30000, // Poll every 30 seconds for real-time updates
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const realtime = data ? ((data as { data?: RealtimeMetricsData }).data || (data as RealtimeMetricsData)) : null;

  return {
    realtime,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: mutate,
  };
}

export function useTimeSeriesAnalytics(params: { metric: MetricType; timeframe: Timeframe; granularity: Granularity }) {
  const swrKey = createSWRKey(API_ENDPOINTS.analyticsTimeSeries, {
    metric: params.metric,
    timeframe: params.timeframe,
    granularity: params.granularity,
  });

  const { data, error, isLoading, mutate } = useSWR<{ data?: TimeSeriesDataPoint } | TimeSeriesDataPoint>(
    swrKey,
    swrFetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const timeSeries = data ? ((data as { data?: TimeSeriesDataPoint }).data || (data as TimeSeriesDataPoint)) : null;

  return {
    timeSeries,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: mutate,
  };
}

export function useComparisonAnalytics(timeframe: Timeframe) {
  const swrKey = createSWRKey(API_ENDPOINTS.analyticsComparison, {
    timeframe,
  });

  const { data, error, isLoading, mutate } = useSWR<{ data?: ComparisonDataPoint } | ComparisonDataPoint>(
    swrKey,
    swrFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const comparison = data ? ((data as { data?: ComparisonDataPoint }).data || (data as ComparisonDataPoint)) : null;

  return {
    comparison,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: mutate,
  };
}

export function useExportAnalytics(type: string, timeframe: Timeframe, format: "json" | "csv" = "json") {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const exportData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setExporting(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append("type", type);
      queryParams.append("timeframe", timeframe);
      queryParams.append("format", format);

      const url = `${API_BASE_URL}${API_ENDPOINTS.analyticsExport}?${queryParams.toString()}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to export analytics: ${response.status}`);
      }

      if (format === "csv") {
        // Handle CSV download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `analytics-${type}-${timeframe}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // Handle JSON download
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `analytics-${type}-${timeframe}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }

      if (mountedRef.current) {
        setExporting(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error exporting analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setExporting(false);
      }
    }
  }, [type, timeframe, format]);

  return {
    exportData,
    exporting,
    error,
  };
}

