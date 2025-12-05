"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogCategory = "system" | "auth" | "api" | "database" | "security" | "performance" | "user_action" | "cron" | "webhook" | "integration";

export interface LogEntry {
  _id?: string;
  id?: string;
  level: LogLevel;
  category?: LogCategory;
  message: string;
  timestamp: string | Date;
  source?: string;
  userId?: string;
  userEmail?: string;
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  stack?: string;
  errorCode?: string;
  tags?: string[];
  createdAt?: string | Date;
}

export interface LogStats {
  totalLogs: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<string, number>;
  recentErrors: number;
  averageResponseTime?: number;
  errorRate?: number;
  last24Hours?: {
    total: number;
    errors: number;
    warnings: number;
  };
}

export interface ErrorTrend {
  date: string;
  count: number;
  category?: string;
  errorCode?: string;
}

export interface PerformanceMetric {
  endpoint?: string;
  path?: string;
  method?: string;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  requestCount: number;
  errorRate: number;
  p50?: number;
  p95?: number;
  p99?: number;
}

export interface DashboardSummary {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  avgResponseTime: number;
  errorRate: number;
  topErrors: Array<{ message: string; count: number }>;
  topEndpoints: Array<{ path: string; count: number; avgDuration: number }>;
  recentActivity: LogEntry[];
  trends: {
    errors: ErrorTrend[];
    requests: Array<{ date: string; count: number }>;
  };
}

export interface UserActivityLog {
  _id?: string;
  id?: string;
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: string | Date;
  success?: boolean;
}

export interface LogsParams {
  page?: number;
  limit?: number;
  level?: LogLevel | LogLevel[];
  category?: LogCategory | LogCategory[];
  startDate?: string;
  endDate?: string;
  search?: string;
  userId?: string;
  source?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tags?: string[];
}

export interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

export interface ExportOptions {
  format: "json" | "csv";
  startDate?: string;
  endDate?: string;
  level?: LogLevel[];
  category?: LogCategory[];
  limit?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildUrl(endpoint: string, pathParams?: Record<string, string>, queryParams?: Record<string, string | string[] | undefined>): string {
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
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, value);
        }
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
// Main Hook: useLogs
// ============================================================================

export function useLogs(params: LogsParams = {}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const mountedRef = useRef(true);

  // Fetch logs with filtering
  const fetchLogs = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | string[] | undefined> = {};
      if (params.page) queryParams.page = params.page.toString();
      if (params.limit) queryParams.limit = params.limit.toString();
      if (params.level) queryParams.level = Array.isArray(params.level) ? params.level : [params.level];
      if (params.category) queryParams.category = Array.isArray(params.category) ? params.category : [params.category];
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.search) queryParams.search = params.search;
      if (params.userId) queryParams.userId = params.userId;
      if (params.source) queryParams.source = params.source;
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
      if (params.tags) queryParams.tags = params.tags;

      const url = buildUrl(API_ENDPOINTS.logs, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }

      const data = await response.json();
      const logsData = data?.data?.logs || data?.logs || data?.data || [];
      const paginationData = data?.data?.pagination || data?.pagination || null;

      if (mountedRef.current) {
        setLogs(logsData);
        setPagination(paginationData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching logs", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLogs([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.page, params.limit, params.level, params.category, params.startDate, params.endDate, params.search, params.userId, params.source, params.sortBy, params.sortOrder, params.tags]);

  useEffect(() => {
    mountedRef.current = true;
    fetchLogs();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    pagination,
    refetch: fetchLogs,
  };
}

// ============================================================================
// Hook: useLogStats - Get Log Statistics
// ============================================================================

export function useLogStats() {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsStats);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch log stats: ${response.status}`);
      }

      const data = await response.json();
      const statsData = data?.data?.stats || data?.stats || data?.data || null;

      if (mountedRef.current) {
        setStats(statsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching log stats", err instanceof Error ? err : new Error(errorMessage));
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
    fetchStats();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// ============================================================================
// Hook: useLogDetails - Get Single Log Details
// ============================================================================

export function useLogDetails(logId: string | null) {
  const [log, setLog] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchLog = useCallback(async () => {
    if (!getApiToken() || !logId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsById, { logId });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch log details: ${response.status}`);
      }

      const data = await response.json();
      const logData = data?.data?.log || data?.log || data?.data || null;

      if (mountedRef.current) {
        setLog(logData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching log details", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [logId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchLog();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchLog]);

  return {
    log,
    loading,
    error,
    refetch: fetchLog,
  };
}

// ============================================================================
// Hook: useErrorTrends - Get Error Analytics Trends
// ============================================================================

export function useErrorTrends(params: { startDate?: string; endDate?: string; groupBy?: "day" | "hour" | "week" } = {}) {
  const [trends, setTrends] = useState<ErrorTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchTrends = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | undefined> = {};
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.groupBy) queryParams.groupBy = params.groupBy;

      const url = buildUrl(API_ENDPOINTS.logsAnalyticsErrorTrends, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch error trends: ${response.status}`);
      }

      const data = await response.json();
      const trendsData = data?.data?.trends || data?.trends || data?.data || [];

      if (mountedRef.current) {
        setTrends(trendsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching error trends", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setTrends([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.startDate, params.endDate, params.groupBy]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTrends();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchTrends]);

  return {
    trends,
    loading,
    error,
    refetch: fetchTrends,
  };
}

// ============================================================================
// Hook: usePerformanceMetrics - Get Performance Analytics
// ============================================================================

export function usePerformanceMetrics(params: { startDate?: string; endDate?: string; endpoint?: string } = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchMetrics = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | undefined> = {};
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.endpoint) queryParams.endpoint = params.endpoint;

      const url = buildUrl(API_ENDPOINTS.logsAnalyticsPerformance, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch performance metrics: ${response.status}`);
      }

      const data = await response.json();
      const metricsData = data?.data?.metrics || data?.metrics || data?.data || [];

      if (mountedRef.current) {
        setMetrics(metricsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching performance metrics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setMetrics([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.startDate, params.endDate, params.endpoint]);

  useEffect(() => {
    mountedRef.current = true;
    fetchMetrics();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}

// ============================================================================
// Hook: useUserActivityLogs - Get User Activity Logs
// ============================================================================

export function useUserActivityLogs(userId: string | null, params: { page?: number; limit?: number } = {}) {
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const mountedRef = useRef(true);

  const fetchActivities = useCallback(async () => {
    if (!getApiToken() || !userId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | undefined> = {};
      if (params.page) queryParams.page = params.page.toString();
      if (params.limit) queryParams.limit = params.limit.toString();

      const url = buildUrl(API_ENDPOINTS.logsUserActivity, { userId }, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch user activity logs: ${response.status}`);
      }

      const data = await response.json();
      const activitiesData = data?.data?.activities || data?.activities || data?.data || [];
      const paginationData = data?.data?.pagination || data?.pagination || null;

      if (mountedRef.current) {
        setActivities(activitiesData);
        setPagination(paginationData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching user activity logs", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setActivities([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId, params.page, params.limit]);

  useEffect(() => {
    mountedRef.current = true;
    fetchActivities();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    pagination,
    refetch: fetchActivities,
  };
}

// ============================================================================
// Hook: useDashboardSummary - Get Dashboard Summary
// ============================================================================

export function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchSummary = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsDashboardSummary);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard summary: ${response.status}`);
      }

      const data = await response.json();
      const summaryData = data?.data?.summary || data?.summary || data?.data || null;

      if (mountedRef.current) {
        setSummary(summaryData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching dashboard summary", err instanceof Error ? err : new Error(errorMessage));
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
    fetchSummary();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}

// ============================================================================
// Hook: useLogSearch - Global Log Search
// ============================================================================

export function useLogSearch() {
  const [results, setResults] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const mountedRef = useRef(true);

  const search = useCallback(async (query: string, options: {
    page?: number;
    limit?: number;
    level?: LogLevel[];
    category?: LogCategory[];
    startDate?: string;
    endDate?: string;
  } = {}): Promise<LogEntry[]> => {
    if (!getApiToken() || !query.trim()) {
      setResults([]);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | string[] | undefined> = {
        q: query,
      };
      if (options.page) queryParams.page = options.page.toString();
      if (options.limit) queryParams.limit = options.limit.toString();
      if (options.level) queryParams.level = options.level;
      if (options.category) queryParams.category = options.category;
      if (options.startDate) queryParams.startDate = options.startDate;
      if (options.endDate) queryParams.endDate = options.endDate;

      const url = buildUrl(API_ENDPOINTS.logsSearchGlobal, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to search logs: ${response.status}`);
      }

      const data = await response.json();
      const logsData = data?.data?.logs || data?.logs || data?.data || [];
      const paginationData = data?.data?.pagination || data?.pagination || null;

      if (mountedRef.current) {
        setResults(logsData);
        setPagination(paginationData);
      }
      
      return logsData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error searching logs", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setResults([]);
      }
      return [];
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setPagination(null);
    setError(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    results,
    loading,
    error,
    pagination,
    search,
    clearResults,
  };
}

// ============================================================================
// Hook: useLogAdmin - Admin Functions for Log Management
// ============================================================================

export function useLogAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Export logs as JSON or CSV
  const exportLogs = useCallback(async (options: ExportOptions): Promise<Blob | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | string[] | undefined> = {
        format: options.format,
      };
      if (options.startDate) queryParams.startDate = options.startDate;
      if (options.endDate) queryParams.endDate = options.endDate;
      if (options.level) queryParams.level = options.level;
      if (options.category) queryParams.category = options.category;
      if (options.limit) queryParams.limit = options.limit.toString();

      const url = buildUrl(API_ENDPOINTS.logsExportData, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to export logs: ${response.status}`);
      }

      return await response.blob();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error exporting logs", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Download exported logs
  const downloadLogs = useCallback(async (options: ExportOptions): Promise<boolean> => {
    const blob = await exportLogs(options);
    if (!blob) return false;

    try {
      const filename = `logs_export_${new Date().toISOString().split('T')[0]}.${options.format}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    } catch (err) {
      logger.error("Error downloading logs", err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, [exportLogs]);

  // Cleanup expired logs (admin only)
  const cleanupLogs = useCallback(async (options?: { 
    olderThan?: string; 
    level?: LogLevel[];
    dryRun?: boolean;
  }): Promise<{ deleted: number; errors: number } | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsCleanup);
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(options || {}),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to cleanup logs: ${response.status}`);
      }

      const data = await response.json();
      return data?.data || { deleted: 0, errors: 0 };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error cleaning up logs", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Flush all logs (admin only - use with caution!)
  const flushLogs = useCallback(async (confirm: boolean = false): Promise<boolean> => {
    if (!getApiToken()) return false;
    if (!confirm) {
      setError("Confirmation required to flush all logs");
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsFlush);
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify({ confirm: true }),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to flush logs: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error flushing logs", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    exportLogs,
    downloadLogs,
    cleanupLogs,
    flushLogs,
  };
}

// ============================================================================
// Utility: Logs API Functions (for direct use without hooks)
// ============================================================================

export const LogsAPI = {
  // Get logs with filtering
  async getLogs(params?: LogsParams) {
    const queryParams: Record<string, string | string[] | undefined> = {};
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.level) queryParams.level = Array.isArray(params.level) ? params.level : [params.level];
    if (params?.category) queryParams.category = Array.isArray(params.category) ? params.category : [params.category];
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.search) queryParams.search = params.search;
    if (params?.userId) queryParams.userId = params.userId;

    const url = buildUrl(API_ENDPOINTS.logs, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status}`);
    }
    
    return response.json();
  },

  // Get log statistics
  async getStats() {
    const url = buildUrl(API_ENDPOINTS.logsStats);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch log stats: ${response.status}`);
    }
    
    return response.json();
  },

  // Get single log details
  async getLogById(logId: string) {
    const url = buildUrl(API_ENDPOINTS.logsById, { logId });
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch log: ${response.status}`);
    }
    
    return response.json();
  },

  // Get error trends
  async getErrorTrends(params?: { startDate?: string; endDate?: string; groupBy?: string }) {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.groupBy) queryParams.groupBy = params.groupBy;

    const url = buildUrl(API_ENDPOINTS.logsAnalyticsErrorTrends, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch error trends: ${response.status}`);
    }
    
    return response.json();
  },

  // Get performance metrics
  async getPerformanceMetrics(params?: { startDate?: string; endDate?: string; endpoint?: string }) {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.endpoint) queryParams.endpoint = params.endpoint;

    const url = buildUrl(API_ENDPOINTS.logsAnalyticsPerformance, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch performance metrics: ${response.status}`);
    }
    
    return response.json();
  },

  // Get user activity logs
  async getUserActivity(userId: string, params?: { page?: number; limit?: number }) {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();

    const url = buildUrl(API_ENDPOINTS.logsUserActivity, { userId }, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user activity: ${response.status}`);
    }
    
    return response.json();
  },

  // Get dashboard summary
  async getDashboardSummary() {
    const url = buildUrl(API_ENDPOINTS.logsDashboardSummary);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard summary: ${response.status}`);
    }
    
    return response.json();
  },

  // Global search
  async search(query: string, options?: { page?: number; limit?: number; level?: string[]; category?: string[] }) {
    const queryParams: Record<string, string | string[] | undefined> = { q: query };
    if (options?.page) queryParams.page = options.page.toString();
    if (options?.limit) queryParams.limit = options.limit.toString();
    if (options?.level) queryParams.level = options.level;
    if (options?.category) queryParams.category = options.category;

    const url = buildUrl(API_ENDPOINTS.logsSearchGlobal, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to search logs: ${response.status}`);
    }
    
    return response.json();
  },

  // Export logs
  async exportData(options: ExportOptions) {
    const queryParams: Record<string, string | string[] | undefined> = {
      format: options.format,
    };
    if (options.startDate) queryParams.startDate = options.startDate;
    if (options.endDate) queryParams.endDate = options.endDate;
    if (options.level) queryParams.level = options.level;
    if (options.category) queryParams.category = options.category;
    if (options.limit) queryParams.limit = options.limit.toString();

    const url = buildUrl(API_ENDPOINTS.logsExportData, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to export logs: ${response.status}`);
    }
    
    return response.blob();
  },

  // Cleanup expired logs
  async cleanup(options?: { olderThan?: string; level?: string[]; dryRun?: boolean }) {
    const url = buildUrl(API_ENDPOINTS.logsCleanup);
    const response = await fetch(url, createAuthFetchOptions({
      method: "POST",
      body: JSON.stringify(options || {}),
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to cleanup logs: ${response.status}`);
    }
    
    return response.json();
  },

  // Flush all logs
  async flush(confirm: boolean = false) {
    const url = buildUrl(API_ENDPOINTS.logsFlush);
    const response = await fetch(url, createAuthFetchOptions({
      method: "POST",
      body: JSON.stringify({ confirm }),
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to flush logs: ${response.status}`);
    }
    
    return response.json();
  },
};

export default useLogs;

