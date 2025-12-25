/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/admin/hooks/useLogs' instead.
 */
export * from '@/features/admin/hooks/useLogs';
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
// New Types for Log Configuration & Metrics
// ============================================================================

export interface LogConfig {
  globalLevel: LogLevel;
  moduleOverrides: Record<string, LogLevel>;
  retentionDays: number;
  enabledCategories: LogCategory[];
  outputFormats: string[];
  sampleRate?: number;
  bufferSize?: number;
  flushInterval?: number;
}

export interface LogLevelOverride {
  context: string;
  level: LogLevel;
  expiresAt?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface LogMetrics {
  totalLogs: number;
  logsPerSecond: number;
  logsPerMinute: number;
  errorRate: number;
  warningRate: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<string, number>;
  bufferUsage: number;
  memoryUsage: number;
  diskUsage?: number;
  lastFlush?: string;
  uptime: number;
  timestamp: string;
}

export interface LogStatistics {
  period: string;
  totalLogs: number;
  uniqueUsers: number;
  uniqueSessions: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  byHour: Array<{ hour: number; count: number }>;
  byDay: Array<{ date: string; count: number }>;
  topEndpoints: Array<{ endpoint: string; count: number; avgDuration: number }>;
  topErrors: Array<{ message: string; count: number; lastOccurrence: string }>;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorTrend: Array<{ date: string; count: number }>;
}

export interface SlowOperation {
  id: string;
  endpoint: string;
  method: string;
  duration: number;
  timestamp: string;
  userId?: string;
  requestId?: string;
  statusCode: number;
  query?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ErrorSummary {
  totalErrors: number;
  uniqueErrors: number;
  byType: Array<{ type: string; count: number; lastOccurrence: string }>;
  byEndpoint: Array<{ endpoint: string; count: number }>;
  byStatusCode: Array<{ statusCode: number; count: number }>;
  recentErrors: Array<{
    id: string;
    message: string;
    type: string;
    count: number;
    firstOccurrence: string;
    lastOccurrence: string;
    stack?: string;
  }>;
  trend: Array<{ date: string; count: number }>;
}

export interface CorrelatedLog {
  id: string;
  correlationId: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  source?: string;
  category?: LogCategory;
  metadata?: Record<string, unknown>;
  sequence: number;
}

export interface AdvancedQueryParams {
  // Basic filters
  level?: LogLevel | LogLevel[];
  category?: LogCategory | LogCategory[];
  source?: string | string[];
  
  // Time range
  startDate?: string;
  endDate?: string;
  
  // Text search
  search?: string;
  searchFields?: string[];
  regex?: string;
  
  // User/Session filters
  userId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  
  // Request filters
  method?: string | string[];
  endpoint?: string;
  statusCode?: number | number[];
  minDuration?: number;
  maxDuration?: number;
  
  // Error filters
  errorType?: string;
  hasError?: boolean;
  
  // Metadata filters
  metadataKey?: string;
  metadataValue?: string;
  
  // Pagination & sorting
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  
  // Aggregation
  groupBy?: string;
  aggregate?: "count" | "avg" | "sum" | "min" | "max";
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
// Hook: useLogConfig - Logger Configuration Management
// ============================================================================

export function useLogConfig() {
  const [config, setConfig] = useState<LogConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Fetch current logger configuration
  const fetchConfig = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsConfig);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch log config: ${response.status}`);
      }

      const data = await response.json();
      const configData = data?.data?.config || data?.config || data?.data || null;

      if (mountedRef.current) {
        setConfig(configData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching log config", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Set global log level
  const setGlobalLevel = useCallback(async (level: LogLevel): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsConfigLevel);
      const response = await fetch(url, createAuthFetchOptions({
        method: "PUT",
        body: JSON.stringify({ level }),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to set log level: ${response.status}`);
      }

      await fetchConfig(); // Refresh config
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error setting global log level", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchConfig]);

  // Set module-specific log level override
  const setLevelOverride = useCallback(async (context: string, level: LogLevel, expiresAt?: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsConfigOverride);
      const response = await fetch(url, createAuthFetchOptions({
        method: "PUT",
        body: JSON.stringify({ context, level, expiresAt }),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to set log level override: ${response.status}`);
      }

      await fetchConfig(); // Refresh config
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error setting log level override", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchConfig]);

  // Remove module-specific log level override
  const removeLevelOverride = useCallback(async (context: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsConfigOverrideByContext, { context });
      const response = await fetch(url, createAuthFetchOptions({
        method: "DELETE",
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to remove log level override: ${response.status}`);
      }

      await fetchConfig(); // Refresh config
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error removing log level override", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchConfig]);

  useEffect(() => {
    mountedRef.current = true;
    fetchConfig();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
    setGlobalLevel,
    setLevelOverride,
    removeLevelOverride,
  };
}

// ============================================================================
// Hook: useLogMetrics - Real-time Log Metrics
// ============================================================================

export function useLogMetrics(refreshInterval?: number) {
  const [metrics, setMetrics] = useState<LogMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Fetch real-time log metrics
  const fetchMetrics = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsMetrics);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch log metrics: ${response.status}`);
      }

      const data = await response.json();
      const metricsData = data?.data?.metrics || data?.metrics || data?.data || null;

      if (mountedRef.current) {
        setMetrics(metricsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching log metrics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Reset log metrics
  const resetMetrics = useCallback(async (): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsMetricsReset);
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to reset log metrics: ${response.status}`);
      }

      await fetchMetrics(); // Refresh metrics
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error resetting log metrics", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics]);

  useEffect(() => {
    mountedRef.current = true;
    fetchMetrics();

    // Auto-refresh if interval is provided
    let intervalId: NodeJS.Timeout | undefined;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(fetchMetrics, refreshInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchMetrics, refreshInterval]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
    resetMetrics,
  };
}

// ============================================================================
// Hook: useLogCorrelation - Get Logs by Correlation ID
// ============================================================================

export function useLogCorrelation(correlationId: string | null) {
  const [logs, setLogs] = useState<CorrelatedLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchCorrelatedLogs = useCallback(async () => {
    if (!getApiToken() || !correlationId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.logsCorrelation, { correlationId });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch correlated logs: ${response.status}`);
      }

      const data = await response.json();
      const logsData = data?.data?.logs || data?.logs || data?.data || [];

      if (mountedRef.current) {
        setLogs(logsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching correlated logs", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLogs([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [correlationId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchCorrelatedLogs();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchCorrelatedLogs]);

  return {
    logs,
    loading,
    error,
    refetch: fetchCorrelatedLogs,
  };
}

// ============================================================================
// Hook: useErrorSummary - Get Error Summary with Grouping
// ============================================================================

export function useErrorSummary(params: { startDate?: string; endDate?: string; groupBy?: string } = {}) {
  const [summary, setSummary] = useState<ErrorSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchSummary = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | undefined> = {};
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.groupBy) queryParams.groupBy = params.groupBy;

      const url = buildUrl(API_ENDPOINTS.logsErrorsSummary, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch error summary: ${response.status}`);
      }

      const data = await response.json();
      const summaryData = data?.data?.summary || data?.summary || data?.data || null;

      if (mountedRef.current) {
        setSummary(summaryData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching error summary", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.startDate, params.endDate, params.groupBy]);

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
// Hook: useLogStatistics - Comprehensive Log Statistics
// ============================================================================

export function useLogStatistics(params: { period?: string; startDate?: string; endDate?: string } = {}) {
  const [statistics, setStatistics] = useState<LogStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchStatistics = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | undefined> = {};
      if (params.period) queryParams.period = params.period;
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;

      const url = buildUrl(API_ENDPOINTS.logsStatistics, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch log statistics: ${response.status}`);
      }

      const data = await response.json();
      const statsData = data?.data?.statistics || data?.statistics || data?.data || null;

      if (mountedRef.current) {
        setStatistics(statsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching log statistics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.period, params.startDate, params.endDate]);

  useEffect(() => {
    mountedRef.current = true;
    fetchStatistics();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
}

// ============================================================================
// Hook: useSlowOperations - Get Slow Operations
// ============================================================================

export function useSlowOperations(params: { 
  threshold?: number; 
  limit?: number; 
  startDate?: string; 
  endDate?: string;
  endpoint?: string;
} = {}) {
  const [operations, setOperations] = useState<SlowOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchOperations = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | undefined> = {};
      if (params.threshold) queryParams.threshold = params.threshold.toString();
      if (params.limit) queryParams.limit = params.limit.toString();
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.endpoint) queryParams.endpoint = params.endpoint;

      const url = buildUrl(API_ENDPOINTS.logsSlowOperations, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch slow operations: ${response.status}`);
      }

      const data = await response.json();
      const opsData = data?.data?.operations || data?.operations || data?.data || [];

      if (mountedRef.current) {
        setOperations(opsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching slow operations", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setOperations([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.threshold, params.limit, params.startDate, params.endDate, params.endpoint]);

  useEffect(() => {
    mountedRef.current = true;
    fetchOperations();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchOperations]);

  return {
    operations,
    loading,
    error,
    refetch: fetchOperations,
  };
}

// ============================================================================
// Hook: useAdvancedLogQuery - Query Logs with Advanced Filters
// ============================================================================

export function useAdvancedLogQuery() {
  const [results, setResults] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [aggregation, setAggregation] = useState<Record<string, unknown> | null>(null);
  const mountedRef = useRef(true);

  const query = useCallback(async (params: AdvancedQueryParams): Promise<LogEntry[]> => {
    if (!getApiToken()) {
      setResults([]);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | string[] | undefined> = {};
      
      // Basic filters
      if (params.level) queryParams.level = Array.isArray(params.level) ? params.level : [params.level];
      if (params.category) queryParams.category = Array.isArray(params.category) ? params.category : [params.category];
      if (params.source) queryParams.source = Array.isArray(params.source) ? params.source : [params.source];
      
      // Time range
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      
      // Text search
      if (params.search) queryParams.search = params.search;
      if (params.searchFields) queryParams.searchFields = params.searchFields;
      if (params.regex) queryParams.regex = params.regex;
      
      // User/Session filters
      if (params.userId) queryParams.userId = params.userId;
      if (params.sessionId) queryParams.sessionId = params.sessionId;
      if (params.requestId) queryParams.requestId = params.requestId;
      if (params.correlationId) queryParams.correlationId = params.correlationId;
      
      // Request filters
      if (params.method) queryParams.method = Array.isArray(params.method) ? params.method : [params.method];
      if (params.endpoint) queryParams.endpoint = params.endpoint;
      if (params.statusCode) queryParams.statusCode = Array.isArray(params.statusCode) 
        ? params.statusCode.map(String) 
        : [String(params.statusCode)];
      if (params.minDuration) queryParams.minDuration = params.minDuration.toString();
      if (params.maxDuration) queryParams.maxDuration = params.maxDuration.toString();
      
      // Error filters
      if (params.errorType) queryParams.errorType = params.errorType;
      if (params.hasError !== undefined) queryParams.hasError = params.hasError.toString();
      
      // Metadata filters
      if (params.metadataKey) queryParams.metadataKey = params.metadataKey;
      if (params.metadataValue) queryParams.metadataValue = params.metadataValue;
      
      // Pagination & sorting
      if (params.page) queryParams.page = params.page.toString();
      if (params.limit) queryParams.limit = params.limit.toString();
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
      
      // Aggregation
      if (params.groupBy) queryParams.groupBy = params.groupBy;
      if (params.aggregate) queryParams.aggregate = params.aggregate;

      const url = buildUrl(API_ENDPOINTS.logsQuery, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to query logs: ${response.status}`);
      }

      const data = await response.json();
      const logsData = data?.data?.logs || data?.logs || data?.data || [];
      const paginationData = data?.data?.pagination || data?.pagination || null;
      const aggregationData = data?.data?.aggregation || data?.aggregation || null;

      if (mountedRef.current) {
        setResults(logsData);
        setPagination(paginationData);
        setAggregation(aggregationData);
      }

      return logsData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error querying logs", err instanceof Error ? err : new Error(errorMessage));
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
    setAggregation(null);
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
    aggregation,
    query,
    clearResults,
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

  // ============================================================================
  // New API Methods for Log Configuration & Metrics
  // ============================================================================

  // Get logger configuration
  async getConfig() {
    const url = buildUrl(API_ENDPOINTS.logsConfig);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch log config: ${response.status}`);
    }
    
    return response.json();
  },

  // Set global log level
  async setGlobalLevel(level: LogLevel) {
    const url = buildUrl(API_ENDPOINTS.logsConfigLevel);
    const response = await fetch(url, createAuthFetchOptions({
      method: "PUT",
      body: JSON.stringify({ level }),
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to set log level: ${response.status}`);
    }
    
    return response.json();
  },

  // Set module-specific log level override
  async setLevelOverride(context: string, level: LogLevel, expiresAt?: string) {
    const url = buildUrl(API_ENDPOINTS.logsConfigOverride);
    const response = await fetch(url, createAuthFetchOptions({
      method: "PUT",
      body: JSON.stringify({ context, level, expiresAt }),
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to set log level override: ${response.status}`);
    }
    
    return response.json();
  },

  // Remove module-specific log level override
  async removeLevelOverride(context: string) {
    const url = buildUrl(API_ENDPOINTS.logsConfigOverrideByContext, { context });
    const response = await fetch(url, createAuthFetchOptions({
      method: "DELETE",
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to remove log level override: ${response.status}`);
    }
    
    return response.json();
  },

  // Get real-time log metrics
  async getMetrics() {
    const url = buildUrl(API_ENDPOINTS.logsMetrics);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch log metrics: ${response.status}`);
    }
    
    return response.json();
  },

  // Reset log metrics
  async resetMetrics() {
    const url = buildUrl(API_ENDPOINTS.logsMetricsReset);
    const response = await fetch(url, createAuthFetchOptions({
      method: "POST",
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to reset log metrics: ${response.status}`);
    }
    
    return response.json();
  },

  // Get logs by correlation ID
  async getByCorrelationId(correlationId: string) {
    const url = buildUrl(API_ENDPOINTS.logsCorrelation, { correlationId });
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch correlated logs: ${response.status}`);
    }
    
    return response.json();
  },

  // Get error summary with grouping
  async getErrorsSummary(params?: { startDate?: string; endDate?: string; groupBy?: string }) {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.groupBy) queryParams.groupBy = params.groupBy;

    const url = buildUrl(API_ENDPOINTS.logsErrorsSummary, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch error summary: ${response.status}`);
    }
    
    return response.json();
  },

  // Get comprehensive log statistics
  async getStatistics(params?: { period?: string; startDate?: string; endDate?: string }) {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.period) queryParams.period = params.period;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;

    const url = buildUrl(API_ENDPOINTS.logsStatistics, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch log statistics: ${response.status}`);
    }
    
    return response.json();
  },

  // Get slow operations
  async getSlowOperations(params?: { 
    threshold?: number; 
    limit?: number; 
    startDate?: string; 
    endDate?: string;
    endpoint?: string;
  }) {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.threshold) queryParams.threshold = params.threshold.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.endpoint) queryParams.endpoint = params.endpoint;

    const url = buildUrl(API_ENDPOINTS.logsSlowOperations, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch slow operations: ${response.status}`);
    }
    
    return response.json();
  },

  // Query logs with advanced filters
  async advancedQuery(params: AdvancedQueryParams) {
    const queryParams: Record<string, string | string[] | undefined> = {};
    
    // Basic filters
    if (params.level) queryParams.level = Array.isArray(params.level) ? params.level : [params.level];
    if (params.category) queryParams.category = Array.isArray(params.category) ? params.category : [params.category];
    if (params.source) queryParams.source = Array.isArray(params.source) ? params.source : [params.source];
    
    // Time range
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    
    // Text search
    if (params.search) queryParams.search = params.search;
    if (params.searchFields) queryParams.searchFields = params.searchFields;
    if (params.regex) queryParams.regex = params.regex;
    
    // User/Session filters
    if (params.userId) queryParams.userId = params.userId;
    if (params.sessionId) queryParams.sessionId = params.sessionId;
    if (params.requestId) queryParams.requestId = params.requestId;
    if (params.correlationId) queryParams.correlationId = params.correlationId;
    
    // Request filters
    if (params.method) queryParams.method = Array.isArray(params.method) ? params.method : [params.method];
    if (params.endpoint) queryParams.endpoint = params.endpoint;
    if (params.statusCode) queryParams.statusCode = Array.isArray(params.statusCode) 
      ? params.statusCode.map(String) 
      : [String(params.statusCode)];
    if (params.minDuration) queryParams.minDuration = params.minDuration.toString();
    if (params.maxDuration) queryParams.maxDuration = params.maxDuration.toString();
    
    // Error filters
    if (params.errorType) queryParams.errorType = params.errorType;
    if (params.hasError !== undefined) queryParams.hasError = params.hasError.toString();
    
    // Metadata filters
    if (params.metadataKey) queryParams.metadataKey = params.metadataKey;
    if (params.metadataValue) queryParams.metadataValue = params.metadataValue;
    
    // Pagination & sorting
    if (params.page) queryParams.page = params.page.toString();
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
    
    // Aggregation
    if (params.groupBy) queryParams.groupBy = params.groupBy;
    if (params.aggregate) queryParams.aggregate = params.aggregate;

    const url = buildUrl(API_ENDPOINTS.logsQuery, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to query logs: ${response.status}`);
    }
    
    return response.json();
  },
};

export default useLogs;

