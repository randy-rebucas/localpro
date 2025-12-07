"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type Timeframe = "1h" | "24h" | "7d" | "30d" | "90d" | "1y";
export type MetricType = "users" | "bookings" | "revenue" | "services" | "jobs" | "referrals";
export type Granularity = "hourly" | "daily" | "weekly" | "monthly";
export type ExportType = "overview" | "users" | "revenue" | "bookings";
export type ExportFormat = "json" | "csv";

export type EventType =
  | "page_view"
  | "service_view"
  | "booking_created"
  | "booking_completed"
  | "job_view"
  | "job_application"
  | "course_enrollment"
  | "product_purchase"
  | "referral_click"
  | "referral_completed"
  | "subscription_upgrade"
  | "payment_completed"
  | "search_performed"
  | "filter_applied"
  | "user_registration"
  | "user_login"
  | "profile_update";

export interface AnalyticsMetadata {
  timeframes: Timeframe[];
  metrics: MetricType[];
  granularities: Granularity[];
  exportTypes: ExportType[];
  exportFormats: ExportFormat[];
  categories: {
    services: string[];
    jobs: string[];
  };
}

export interface GrowthMetrics {
  users: string;
  services: string;
  bookings: string;
  revenue: string;
  jobs?: string;
  referrals?: string;
}

export interface DashboardSummary {
  users: { total: number; new: number };
  services: { total: number; new: number };
  bookings: { total: number; completed: number; completionRate: string };
  revenue: { total: number; currency: string };
  jobs: { total: number; applications: number };
  referrals: { total: number };
  growth: GrowthMetrics;
}

export interface DashboardData {
  summary: DashboardSummary;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
  }>;
  topMetrics: {
    topProviders: Array<{ id: string; name: string; bookings: number; revenue: number }>;
    topServices: Array<{ id: string; name: string; bookings: number }>;
    topCategories: Array<{ category: string; count: number }>;
  };
  timeframe: Timeframe;
  generatedAt: string;
}

export interface RealtimeData {
  activeUsers: {
    lastHour: number;
    last15Minutes: number;
  };
  bookings: { lastHour: number };
  revenue: { lastHour: number };
  newUsers: { lastHour: number };
  timestamp: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  count: number;
  revenue?: number;
}

export interface TimeSeriesData {
  metric: MetricType;
  timeframe: Timeframe;
  granularity: Granularity;
  series: TimeSeriesDataPoint[];
}

export interface ComparisonData {
  current: Record<string, number>;
  previous: Record<string, number>;
  growth: GrowthMetrics;
  timeframe: Timeframe;
  comparisonPeriod: string;
}

export interface FinancialData {
  summary: {
    totalRevenue: number;
    transactionCount: number;
    averageOrderValue: string;
    growth: string;
  };
  revenueByCategory: Array<{ _id: string; revenue: number; bookings: number }>;
  revenueByMonth: Array<{ month: string; revenue: number; bookings: number }>;
  topEarners: Array<{ id: string; name: string; revenue: number }>;
  paymentMethods: Array<{ method: string; count: number; total: number }>;
  currency: string;
}

export interface ProviderAnalytics {
  overview: {
    totalServices: number;
    activeServices: number;
    totalBookings: number;
    completedBookings: number;
    completionRate: string;
    totalRevenue: number;
    averageOrderValue: string;
  };
  growth: {
    bookings: string;
    revenue: string;
    completedBookings: string;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    distribution: Record<string, number>;
  };
  revenue: Array<{ period: string; amount: number }>;
  bookingTrends: Array<{ period: string; count: number }>;
  services: Array<{ id: string; name: string; bookings: number; revenue: number }>;
}

export interface OverviewData {
  overview: {
    totalUsers: number;
    totalServices: number;
    totalJobs: number;
    totalAgencies: number;
    totalReferrals: number;
  };
  userRegistrations: Array<{ date: string; count: number }>;
  serviceCategories: Array<{ category: string; count: number }>;
  jobCategories: Array<{ category: string; count: number }>;
  topProviders: Array<{ id: string; name: string; rating: number; bookings: number }>;
  revenueAnalytics: Array<{ period: string; revenue: number }>;
  referralAnalytics: Array<{ status: string; count: number }>;
}

export interface UserAnalytics {
  userRegistrations: Array<{ date: string; count: number }>;
  usersByRole: Array<{ role: string; count: number }>;
  usersByLocation: Array<{ location: string; count: number }>;
  userEngagement: Array<{ date: string; activeUsers: number; newUsers: number }>;
}

export interface MarketplaceAnalytics {
  serviceAnalytics: Array<{ category: string; count: number; revenue: number }>;
  bookingAnalytics: Array<{ status: string; count: number }>;
  topServices: Array<{ id: string; name: string; bookings: number }>;
  providerPerformance: Array<{ id: string; name: string; rating: number; completionRate: string }>;
}

export interface JobAnalytics {
  jobAnalytics: Array<{ category: string; count: number }>;
  jobStatusAnalytics: Array<{ status: string; count: number }>;
  topEmployers: Array<{ id: string; name: string; jobs: number }>;
  applicationAnalytics: Array<{ date: string; applications: number }>;
}

export interface ReferralAnalytics {
  referralStatusAnalytics: Array<{ status: string; count: number }>;
  referralTypeAnalytics: Array<{ type: string; count: number }>;
  topReferrers: Array<{ id: string; name: string; referrals: number; rewards: number }>;
  referralConversion: Array<{ period: string; sent: number; converted: number }>;
}

export interface AgencyAnalytics {
  agencyAnalytics: Array<{ status: string; count: number }>;
  agencyPerformance: Array<{ id: string; name: string; providers: number; bookings: number; revenue: number }>;
}

export interface TrackEventPayload {
  eventType: EventType;
  module: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildUrl(endpoint: string, pathParams?: Record<string, string>, queryParams?: Record<string, string | undefined>): string {
  let url = `${API_BASE_URL}${endpoint}`;
  
  // Replace path parameters
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      url = url.replace(`[${key}]`, encodeURIComponent(value));
    });
  }
  
  // Add query parameters
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
}

// ============================================================================
// Hook: useAnalyticsMetadata - Get Available Options (Authenticated)
// ============================================================================

export function useAnalyticsMetadata() {
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchMetadata = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsMetadata);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics metadata: ${response.status}`);
      }

      const data = await response.json();
      const metadataData = data?.data || null;

      if (mountedRef.current) {
        setMetadata(metadataData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching analytics metadata", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchMetadata();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMetadata]);

  return { metadata, loading, error, refetch: fetchMetadata };
}

// ============================================================================
// Hook: useAnalyticsDashboard - Dashboard Summary (Admin Only)
// ============================================================================

export function useAnalyticsDashboard(timeframe: Timeframe = "30d") {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchDashboard = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsDashboard, undefined, { timeframe });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to fetch dashboard: ${response.status}`);
      }

      const data = await response.json();
      const dashboardData = data?.data || null;

      if (mountedRef.current) {
        setDashboard(dashboardData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching analytics dashboard", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [timeframe]);

  useEffect(() => {
    mountedRef.current = true;
    fetchDashboard();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchDashboard]);

  return { dashboard, loading, error, refetch: fetchDashboard };
}

// ============================================================================
// Hook: useAnalyticsRealtime - Real-time Metrics (Admin Only)
// ============================================================================

export function useAnalyticsRealtime(refreshInterval: number = 30000) {
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchRealtime = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsRealtime);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to fetch realtime data: ${response.status}`);
      }

      const data = await response.json();
      const realtimeData = data?.data || null;

      if (mountedRef.current) {
        setRealtime(realtimeData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching realtime analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchRealtime();
    
    // Set up auto-refresh
    const interval = setInterval(fetchRealtime, refreshInterval);
    
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchRealtime, refreshInterval]);

  return { realtime, loading, error, refetch: fetchRealtime };
}

// ============================================================================
// Hook: useAnalyticsTimeSeries - Time Series Data (Admin Only)
// ============================================================================

export function useAnalyticsTimeSeries(params: {
  metric?: MetricType;
  timeframe?: Timeframe;
  granularity?: Granularity;
} = {}) {
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchTimeSeries = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsTimeSeries, undefined, {
        metric: params.metric || "bookings",
        timeframe: params.timeframe || "30d",
        granularity: params.granularity || "daily",
      });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to fetch time series: ${response.status}`);
      }

      const data = await response.json();
      const timeSeriesData = data?.data || null;

      if (mountedRef.current) {
        setTimeSeries(timeSeriesData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching time series", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.metric, params.timeframe, params.granularity]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTimeSeries();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchTimeSeries]);

  return { timeSeries, loading, error, refetch: fetchTimeSeries };
}

// ============================================================================
// Hook: useAnalyticsComparison - Period Comparison (Admin Only)
// ============================================================================

export function useAnalyticsComparison(timeframe: Timeframe = "30d") {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchComparison = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsComparison, undefined, { timeframe });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to fetch comparison: ${response.status}`);
      }

      const data = await response.json();
      const comparisonData = data?.data || null;

      if (mountedRef.current) {
        setComparison(comparisonData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching analytics comparison", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [timeframe]);

  useEffect(() => {
    mountedRef.current = true;
    fetchComparison();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchComparison]);

  return { comparison, loading, error, refetch: fetchComparison };
}

// ============================================================================
// Hook: useAnalyticsFinancial - Financial Analytics (Admin Only)
// ============================================================================

export function useAnalyticsFinancial(timeframe: Timeframe = "30d") {
  const [financial, setFinancial] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchFinancial = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsFinancial, undefined, { timeframe });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to fetch financial analytics: ${response.status}`);
      }

      const data = await response.json();
      const financialData = data?.data || null;

      if (mountedRef.current) {
        setFinancial(financialData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching financial analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [timeframe]);

  useEffect(() => {
    mountedRef.current = true;
    fetchFinancial();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchFinancial]);

  return { financial, loading, error, refetch: fetchFinancial };
}

// ============================================================================
// Hook: useAnalyticsOverview - Platform Overview (Admin Only)
// ============================================================================

export function useAnalyticsOverview(params: { startDate?: string; endDate?: string } = {}) {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchOverview = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsOverview, undefined, {
        startDate: params.startDate,
        endDate: params.endDate,
      });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to fetch overview: ${response.status}`);
      }

      const data = await response.json();
      const overviewData = data?.data || null;

      if (mountedRef.current) {
        setOverview(overviewData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching analytics overview", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.startDate, params.endDate]);

  useEffect(() => {
    mountedRef.current = true;
    fetchOverview();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchOverview]);

  return { overview, loading, error, refetch: fetchOverview };
}

// ============================================================================
// Hook: useAnalyticsUsers - User Analytics (Admin Only)
// ============================================================================

export function useAnalyticsUsers(params: { startDate?: string; endDate?: string } = {}) {
  const [users, setUsers] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchUsers = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsUsers, undefined, {
        startDate: params.startDate,
        endDate: params.endDate,
      });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to fetch user analytics: ${response.status}`);
      }

      const data = await response.json();
      const usersData = data?.data || null;

      if (mountedRef.current) {
        setUsers(usersData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching user analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.startDate, params.endDate]);

  useEffect(() => {
    mountedRef.current = true;
    fetchUsers();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}

// ============================================================================
// Hook: useAnalyticsMarketplace - Marketplace Analytics (Admin Only)
// ============================================================================

export function useAnalyticsMarketplace(params: { startDate?: string; endDate?: string } = {}) {
  const [marketplace, setMarketplace] = useState<MarketplaceAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchMarketplace = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsMarketplace, undefined, {
        startDate: params.startDate,
        endDate: params.endDate,
      });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to fetch marketplace analytics: ${response.status}`);
      }

      const data = await response.json();
      const marketplaceData = data?.data || null;

      if (mountedRef.current) {
        setMarketplace(marketplaceData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching marketplace analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.startDate, params.endDate]);

  useEffect(() => {
    mountedRef.current = true;
    fetchMarketplace();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMarketplace]);

  return { marketplace, loading, error, refetch: fetchMarketplace };
}

// ============================================================================
// Hook: useAnalyticsJobs - Job Analytics (Admin Only)
// ============================================================================

export function useAnalyticsJobs(params: { startDate?: string; endDate?: string } = {}) {
  const [jobs, setJobs] = useState<JobAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchJobs = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsJobs, undefined, {
        startDate: params.startDate,
        endDate: params.endDate,
      });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to fetch job analytics: ${response.status}`);
      }

      const data = await response.json();
      const jobsData = data?.data || null;

      if (mountedRef.current) {
        setJobs(jobsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching job analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.startDate, params.endDate]);

  useEffect(() => {
    mountedRef.current = true;
    fetchJobs();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
}

// ============================================================================
// Hook: useAnalyticsReferrals - Referral Analytics (Admin Only)
// ============================================================================

export function useAnalyticsReferrals(params: { startDate?: string; endDate?: string } = {}) {
  const [referrals, setReferrals] = useState<ReferralAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchReferrals = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsReferrals, undefined, {
        startDate: params.startDate,
        endDate: params.endDate,
      });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to fetch referral analytics: ${response.status}`);
      }

      const data = await response.json();
      const referralsData = data?.data || null;

      if (mountedRef.current) {
        setReferrals(referralsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching referral analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.startDate, params.endDate]);

  useEffect(() => {
    mountedRef.current = true;
    fetchReferrals();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchReferrals]);

  return { referrals, loading, error, refetch: fetchReferrals };
}

// ============================================================================
// Hook: useAnalyticsAgencies - Agency Analytics (Admin Only)
// ============================================================================

export function useAnalyticsAgencies(params: { startDate?: string; endDate?: string } = {}) {
  const [agencies, setAgencies] = useState<AgencyAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAgencies = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsAgencies, undefined, {
        startDate: params.startDate,
        endDate: params.endDate,
      });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to fetch agency analytics: ${response.status}`);
      }

      const data = await response.json();
      const agenciesData = data?.data || null;

      if (mountedRef.current) {
        setAgencies(agenciesData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching agency analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.startDate, params.endDate]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAgencies();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAgencies]);

  return { agencies, loading, error, refetch: fetchAgencies };
}

// ============================================================================
// Hook: useProviderAnalytics - Provider Analytics (Provider/Admin)
// ============================================================================

export function useProviderAnalytics(timeframe: Timeframe = "30d") {
  const [analytics, setAnalytics] = useState<ProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAnalytics = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsProvider, undefined, { timeframe });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Provider or Admin privileges required.");
        }
        throw new Error(`Failed to fetch provider analytics: ${response.status}`);
      }

      const data = await response.json();
      const analyticsData = data?.data || null;

      if (mountedRef.current) {
        setAnalytics(analyticsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching provider analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [timeframe]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAnalytics();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

// ============================================================================
// Hook: useProviderAnalyticsById - Specific Provider Analytics (Admin/Owner)
// ============================================================================

export function useProviderAnalyticsById(providerId: string | null, timeframe: Timeframe = "30d") {
  const [analytics, setAnalytics] = useState<ProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAnalytics = useCallback(async () => {
    if (!getApiToken() || !providerId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsProviderById, { providerId }, { timeframe });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin or provider owner privileges required.");
        }
        throw new Error(`Failed to fetch provider analytics: ${response.status}`);
      }

      const data = await response.json();
      const analyticsData = data?.data || null;

      if (mountedRef.current) {
        setAnalytics(analyticsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching provider analytics by ID", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [providerId, timeframe]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAnalytics();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

// ============================================================================
// Hook: useAnalyticsExport - Export Analytics Data (Admin Only)
// ============================================================================

export function useAnalyticsExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async (options: {
    type?: ExportType;
    timeframe?: Timeframe;
    format?: ExportFormat;
  } = {}): Promise<Blob | object | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsExport, undefined, {
        type: options.type || "overview",
        timeframe: options.timeframe || "30d",
        format: options.format || "json",
      });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error(`Failed to export analytics: ${response.status}`);
      }

      // Handle CSV vs JSON response
      if (options.format === "csv") {
        return await response.blob();
      }
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error exporting analytics", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadExport = useCallback(async (options: {
    type?: ExportType;
    timeframe?: Timeframe;
    format?: ExportFormat;
  } = {}): Promise<boolean> => {
    const format = options.format || "json";
    const data = await exportData({ ...options, format });
    
    if (!data) return false;

    try {
      let blob: Blob;
      let filename: string;
      const dateStr = new Date().toISOString().split("T")[0];
      
      if (format === "csv" && data instanceof Blob) {
        blob = data;
        filename = `analytics_${options.type || "overview"}_${dateStr}.csv`;
      } else {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        filename = `analytics_${options.type || "overview"}_${dateStr}.json`;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    } catch (err) {
      logger.error("Error downloading export", err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, [exportData]);

  return { loading, error, exportData, downloadExport };
}

// ============================================================================
// Hook: useAnalyticsTrack - Track Custom Events (Authenticated)
// ============================================================================

export function useAnalyticsTrack() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackEvent = useCallback(async (payload: TrackEventPayload): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.analyticsTrack);
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        throw new Error(`Failed to track event: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error tracking analytics event", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Convenience methods for common events
  const trackPageView = useCallback((page: string, data?: Record<string, unknown>) => 
    trackEvent({ eventType: "page_view", module: "app", data: { page, ...data } }), [trackEvent]);

  const trackServiceView = useCallback((serviceId: string, data?: Record<string, unknown>) => 
    trackEvent({ eventType: "service_view", module: "marketplace", data: { serviceId, ...data } }), [trackEvent]);

  const trackJobView = useCallback((jobId: string, data?: Record<string, unknown>) => 
    trackEvent({ eventType: "job_view", module: "jobs", data: { jobId, ...data } }), [trackEvent]);

  const trackSearch = useCallback((query: string, filters?: Record<string, unknown>) => 
    trackEvent({ eventType: "search_performed", module: "search", data: { query, filters } }), [trackEvent]);

  return {
    loading,
    error,
    trackEvent,
    trackPageView,
    trackServiceView,
    trackJobView,
    trackSearch,
  };
}

// ============================================================================
// Utility: Analytics API Functions (for direct use without hooks)
// ============================================================================

export const AnalyticsAPI = {
  // Authenticated endpoints
  async getMetadata() {
    const url = buildUrl(API_ENDPOINTS.analyticsMetadata);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch metadata: ${response.status}`);
    return response.json();
  },

  async trackEvent(payload: TrackEventPayload) {
    const url = buildUrl(API_ENDPOINTS.analyticsTrack);
    const response = await fetch(url, createAuthFetchOptions({
      method: "POST",
      body: JSON.stringify(payload),
    }));
    if (!response.ok) throw new Error(`Failed to track event: ${response.status}`);
    return response.json();
  },

  // Admin-only endpoints
  async getDashboard(timeframe: Timeframe = "30d") {
    const url = buildUrl(API_ENDPOINTS.analyticsDashboard, undefined, { timeframe });
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch dashboard: ${response.status}`);
    return response.json();
  },

  async getRealtime() {
    const url = buildUrl(API_ENDPOINTS.analyticsRealtime);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch realtime: ${response.status}`);
    return response.json();
  },

  async getTimeSeries(params: { metric?: MetricType; timeframe?: Timeframe; granularity?: Granularity }) {
    const url = buildUrl(API_ENDPOINTS.analyticsTimeSeries, undefined, {
      metric: params.metric || "bookings",
      timeframe: params.timeframe || "30d",
      granularity: params.granularity || "daily",
    });
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch time series: ${response.status}`);
    return response.json();
  },

  async getComparison(timeframe: Timeframe = "30d") {
    const url = buildUrl(API_ENDPOINTS.analyticsComparison, undefined, { timeframe });
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch comparison: ${response.status}`);
    return response.json();
  },

  async getFinancial(timeframe: Timeframe = "30d") {
    const url = buildUrl(API_ENDPOINTS.analyticsFinancial, undefined, { timeframe });
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch financial: ${response.status}`);
    return response.json();
  },

  async getOverview(params?: { startDate?: string; endDate?: string }) {
    const url = buildUrl(API_ENDPOINTS.analyticsOverview, undefined, params);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch overview: ${response.status}`);
    return response.json();
  },

  async getUsers(params?: { startDate?: string; endDate?: string }) {
    const url = buildUrl(API_ENDPOINTS.analyticsUsers, undefined, params);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
    return response.json();
  },

  async getMarketplace(params?: { startDate?: string; endDate?: string }) {
    const url = buildUrl(API_ENDPOINTS.analyticsMarketplace, undefined, params);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch marketplace: ${response.status}`);
    return response.json();
  },

  async getJobs(params?: { startDate?: string; endDate?: string }) {
    const url = buildUrl(API_ENDPOINTS.analyticsJobs, undefined, params);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch jobs: ${response.status}`);
    return response.json();
  },

  async getReferrals(params?: { startDate?: string; endDate?: string }) {
    const url = buildUrl(API_ENDPOINTS.analyticsReferrals, undefined, params);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch referrals: ${response.status}`);
    return response.json();
  },

  async getAgencies(params?: { startDate?: string; endDate?: string }) {
    const url = buildUrl(API_ENDPOINTS.analyticsAgencies, undefined, params);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch agencies: ${response.status}`);
    return response.json();
  },

  async getCustom(params: { eventType?: string; module?: string; startDate?: string; endDate?: string }) {
    const url = buildUrl(API_ENDPOINTS.analyticsCustom, undefined, params);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch custom analytics: ${response.status}`);
    return response.json();
  },

  // Provider analytics (Provider/Admin)
  async getProviderAnalytics(timeframe: Timeframe = "30d") {
    const url = buildUrl(API_ENDPOINTS.analyticsProvider, undefined, { timeframe });
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch provider analytics: ${response.status}`);
    return response.json();
  },

  async getProviderAnalyticsById(providerId: string, timeframe: Timeframe = "30d") {
    const url = buildUrl(API_ENDPOINTS.analyticsProviderById, { providerId }, { timeframe });
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to fetch provider analytics: ${response.status}`);
    return response.json();
  },

  // Export
  async exportData(options: { type?: ExportType; timeframe?: Timeframe; format?: ExportFormat }) {
    const url = buildUrl(API_ENDPOINTS.analyticsExport, undefined, {
      type: options.type || "overview",
      timeframe: options.timeframe || "30d",
      format: options.format || "json",
    });
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    if (!response.ok) throw new Error(`Failed to export: ${response.status}`);
    return options.format === "csv" ? response.blob() : response.json();
  },
};

export default useAnalyticsDashboard;
