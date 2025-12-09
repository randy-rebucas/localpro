"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  User,
  Activity,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Users,
  Lock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Zap,
  Server,
  Monitor,
  TrendingUp,
  CheckCircle,
  Info,
  Settings,
  Gauge,
  Link2,
  BarChart3,
  Timer,
  Layers,
  RotateCcw,
  Save,
  Plus,
  X
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { Modal } from "@/components/ui/modal";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";

// Log interface matching API response structure
interface SystemLog {
  _id?: string;
  logId: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  category: string;
  source: string;
  correlationId?: string;
  request?: {
    method?: string;
    url?: string;
    ip?: string;
    userAgent?: string;
    userId?: string;
    [key: string]: unknown;
  };
  response?: {
    statusCode?: number;
    responseTime?: number;
    success?: boolean;
    [key: string]: unknown;
  };
  error?: {
    name?: string;
    message?: string;
    stack?: string;
    code?: string;
    [key: string]: unknown;
  };
  environment?: string;
  timestamp: string;
  retentionDate?: string;
  id?: string;
  details?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  stackTrace?: string;
  metadata?: Record<string, unknown>;
}

interface LogStats {
  totalLogs: number;
  todayLogs: number;
  errorCount: number;
  warningCount: number;
  uniqueUsers: number;
  topCategories: { category: string; count: number }[];
  levelBreakdown: { level: string; count: number }[];
  recentErrors: SystemLog[];
  systemHealth: string;
  avgResponseTime: number;
  errorRate: number;
}

interface LogConfig {
  globalLevel: string;
  levels: string[];
  overrides: { context: string; level: string }[];
  retentionDays: number;
  maxFileSize: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableDatabase: boolean;
}

interface LogMetrics {
  totalLogs: number;
  logsPerMinute: number;
  logsPerHour: number;
  byLevel: { level: string; count: number; percentage: number }[];
  byCategory: { category: string; count: number; percentage: number }[];
  avgProcessingTime: number;
  queueSize: number;
  droppedLogs: number;
  lastFlush: string;
}

interface ErrorSummary {
  totalErrors: number;
  uniqueErrors: number;
  groups: {
    message: string;
    count: number;
    lastOccurred: string;
    firstOccurred: string;
    sources: string[];
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
  topSources: { source: string; count: number }[];
  errorsByHour: { hour: string; count: number }[];
}

interface LogStatistics {
  period: string;
  totalLogs: number;
  byLevel: { level: string; count: number; avgPerDay: number }[];
  byCategory: { category: string; count: number; avgPerDay: number }[];
  bySource: { source: string; count: number }[];
  responseTimeStats: {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  };
  storageUsed: string;
  oldestLog: string;
  newestLog: string;
}

interface SlowOperation {
  operationId: string;
  type: string;
  name: string;
  duration: number;
  threshold: number;
  timestamp: string;
  source: string;
  metadata?: Record<string, unknown>;
}

interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  level: string;
  category: string;
  user: string;
  source: string;
  search: string;
  correlationId: string;
}

export default function AdminLogsPage() {
  // Data states
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [logConfig, setLogConfig] = useState<LogConfig | null>(null);
  const [logMetrics, setLogMetrics] = useState<LogMetrics | null>(null);
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null);
  const [logStatistics, setLogStatistics] = useState<LogStatistics | null>(null);
  const [slowOperations, setSlowOperations] = useState<SlowOperation[]>([]);
  const [correlatedLogs, setCorrelatedLogs] = useState<SystemLog[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'timestamp' | 'level' | 'category' | 'source'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [cleaning, setCleaning] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'config' | 'metrics' | 'errors' | 'slow-ops' | 'statistics'>('logs');
  
  // Config modal states
  const [configEditing, setConfigEditing] = useState(false);
  const [newOverrideContext, setNewOverrideContext] = useState('');
  const [newOverrideLevel, setNewOverrideLevel] = useState('info');
  const [selectedLevel, setSelectedLevel] = useState('info');
  
  // Correlation search
  const [correlationSearchId, setCorrelationSearchId] = useState('');
  const [searchingCorrelation, setSearchingCorrelation] = useState(false);
  
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    level: '',
    category: '',
    user: '',
    source: '',
    search: '',
    correlationId: ''
  });

  // Fetch log configuration
  const fetchLogConfig = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.logsConfig}`,
        createAuthFetchOptions({ method: 'GET' })
      );
      if (response.ok) {
        const result = await response.json();
        setLogConfig(result.data || result);
        setSelectedLevel(result.data?.globalLevel || result.globalLevel || 'info');
      }
    } catch (err) {
      logger.warn('Error fetching log config', { error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  // Fetch log metrics
  const fetchLogMetrics = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.logsMetrics}`,
        createAuthFetchOptions({ method: 'GET' })
      );
      if (response.ok) {
        const result = await response.json();
        setLogMetrics(result.data || result);
      }
    } catch (err) {
      logger.warn('Error fetching log metrics', { error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  // Fetch error summary
  const fetchErrorSummary = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.logsErrorsSummary}`,
        createAuthFetchOptions({ method: 'GET' })
      );
      if (response.ok) {
        const result = await response.json();
        setErrorSummary(result.data || result);
      }
    } catch (err) {
      logger.warn('Error fetching error summary', { error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  // Fetch log statistics
  const fetchLogStatistics = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.logsStatistics}`,
        createAuthFetchOptions({ method: 'GET' })
      );
      if (response.ok) {
        const result = await response.json();
        setLogStatistics(result.data || result);
      }
    } catch (err) {
      logger.warn('Error fetching log statistics', { error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  // Fetch slow operations
  const fetchSlowOperations = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.logsSlowOperations}`,
        createAuthFetchOptions({ method: 'GET' })
      );
      if (response.ok) {
        const result = await response.json();
        setSlowOperations(Array.isArray(result.data) ? result.data : result.operations || []);
      }
    } catch (err) {
      logger.warn('Error fetching slow operations', { error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  // Search by correlation ID
  const searchByCorrelationId = async () => {
    if (!correlationSearchId.trim()) {
      toast.error('Please enter a correlation ID');
      return;
    }
    
    try {
      setSearchingCorrelation(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.logsCorrelation.replace('[correlationId]', correlationSearchId)}`,
        createAuthFetchOptions({ method: 'GET' })
      );
      
      if (response.ok) {
        const result = await response.json();
        const logsData = Array.isArray(result.data) ? result.data : result.logs || [];
        setCorrelatedLogs(logsData);
        if (logsData.length === 0) {
          toast.error('No logs found for this correlation ID');
        } else {
          toast.success(`Found ${logsData.length} correlated logs`);
        }
      } else {
        toast.error('Failed to search logs');
      }
    } catch (err) {
      logger.error('Error searching by correlation ID', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to search logs');
    } finally {
      setSearchingCorrelation(false);
    }
  };

  // Update global log level
  const updateGlobalLogLevel = async (level: string) => {
    try {
      setConfigEditing(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.logsConfigLevel}`,
        createAuthFetchOptions({
          method: 'PUT',
          body: JSON.stringify({ level })
        })
      );

      if (response.ok) {
        toast.success(`Global log level set to ${level}`);
        setSelectedLevel(level);
        await fetchLogConfig();
      } else {
        toast.error('Failed to update log level');
      }
    } catch (err) {
      logger.error('Error updating log level', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to update log level');
    } finally {
      setConfigEditing(false);
    }
  };

  // Add log level override
  const addLogLevelOverride = async () => {
    if (!newOverrideContext.trim()) {
      toast.error('Please enter a context/module name');
      return;
    }

    try {
      setConfigEditing(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.logsConfigOverride}`,
        createAuthFetchOptions({
          method: 'PUT',
          body: JSON.stringify({ context: newOverrideContext, level: newOverrideLevel })
        })
      );

      if (response.ok) {
        toast.success(`Override added for ${newOverrideContext}`);
        setNewOverrideContext('');
        await fetchLogConfig();
      } else {
        toast.error('Failed to add override');
      }
    } catch (err) {
      logger.error('Error adding override', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to add override');
    } finally {
      setConfigEditing(false);
    }
  };

  // Remove log level override
  const removeLogLevelOverride = async (context: string) => {
    try {
      setConfigEditing(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.logsConfigOverrideByContext.replace('[context]', context)}`,
        createAuthFetchOptions({ method: 'DELETE' })
      );

      if (response.ok) {
        toast.success(`Override removed for ${context}`);
        await fetchLogConfig();
      } else {
        toast.error('Failed to remove override');
      }
    } catch (err) {
      logger.error('Error removing override', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to remove override');
    } finally {
      setConfigEditing(false);
    }
  };

  // Reset log metrics
  const resetLogMetrics = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.logsMetricsReset}`,
        createAuthFetchOptions({ method: 'POST' })
      );

      if (response.ok) {
        toast.success('Metrics reset successfully');
        await fetchLogMetrics();
      } else {
        toast.error('Failed to reset metrics');
      }
    } catch (err) {
      logger.error('Error resetting metrics', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to reset metrics');
    }
  };

  // Fetch log details
  const fetchLogDetails = useCallback(async (logId: string): Promise<SystemLog | null> => {
    try {
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'logsById' as keyof typeof API_ENDPOINTS,
        [logId],
        {},
        { method: 'GET' }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return result.data as SystemLog;
        }
      }
      return null;
    } catch (err) {
      logger.warn('Error fetching log details', { error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  }, []);

  // Cleanup expired logs
  const cleanupLogs = useCallback(async (fetchAllDataFn: () => Promise<void>) => {
    try {
      setCleaning(true);
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'logsCleanup' as keyof typeof API_ENDPOINTS,
        { method: 'POST' }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await fetchAllDataFn();
          return true;
        }
      }
      return false;
    } catch (err) {
      logger.error('Error cleaning up logs', err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setCleaning(false);
    }
  }, []);

  // Flush logs
  const flushLogs = useCallback(async (type: 'all' | 'database' | 'files' = 'all', fetchAllDataFn: () => Promise<void>) => {
    try {
      setFlushing(true);
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'logsFlush' as keyof typeof API_ENDPOINTS,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type })
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await fetchAllDataFn();
          return true;
        }
      }
      return false;
    } catch (err) {
      logger.error('Error flushing logs', err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setFlushing(false);
    }
  }, []);

  // Query logs with advanced filters
  const queryLogs = useCallback(async () => {
    try {
      const queryParams: Record<string, string> = {
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      };
      
      if (filters.level) queryParams.level = filters.level;
      if (filters.category) queryParams.category = filters.category;
      if (filters.user) queryParams.user = filters.user;
      if (filters.source) queryParams.source = filters.source;
      if (filters.search) queryParams.search = filters.search;
      if (filters.correlationId) queryParams.correlationId = filters.correlationId;

      const queryString = new URLSearchParams(queryParams).toString();
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.logsQuery}?${queryString}`,
        createAuthFetchOptions({ method: 'GET' })
      );

      if (response.ok) {
        const result = await response.json();
        const logsArray = result.data || result.logs || [];
        return logsArray.map((log: SystemLog | Record<string, unknown>) => transformLog(log));
      }
      return [];
    } catch (err) {
      logger.error('Error querying logs', err instanceof Error ? err : new Error(String(err)));
      return [];
    }
  }, [filters, sortBy, sortOrder, currentPage, itemsPerPage]);

  const transformLog = (log: SystemLog | Record<string, unknown>): SystemLog => {
    const systemLog: SystemLog = {
      _id: (log as SystemLog)._id,
      logId: (log as SystemLog).logId || (log as Record<string, unknown>).id as string || `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level: (log as SystemLog).level || (log as Record<string, unknown>).level as SystemLog['level'] || 'info',
      message: (log as SystemLog).message || (log as Record<string, unknown>).message as string || 'No message',
      category: (log as SystemLog).category || (log as Record<string, unknown>).category as string || 'system',
      source: (log as SystemLog).source || (log as Record<string, unknown>).source as string || 'unknown',
      timestamp: (log as SystemLog).timestamp || (log as Record<string, unknown>).timestamp as string || new Date().toISOString(),
      correlationId: (log as SystemLog).correlationId || (log as Record<string, unknown>).correlationId as string,
      request: (log as SystemLog).request,
      response: (log as SystemLog).response,
      error: (log as SystemLog).error,
      environment: (log as SystemLog).environment,
      retentionDate: (log as SystemLog).retentionDate,
      id: (log as SystemLog).logId || (log as Record<string, unknown>).id as string,
      details: (log as SystemLog).message || (log as Record<string, unknown>).details as string,
      userId: (log as SystemLog).request?.userId || (log as Record<string, unknown>).userId as string,
      ipAddress: (log as SystemLog).request?.ip || (log as Record<string, unknown>).ipAddress as string,
      userAgent: (log as SystemLog).request?.userAgent || (log as Record<string, unknown>).userAgent as string,
      duration: (log as SystemLog).response?.responseTime || (log as Record<string, unknown>).duration as number,
      stackTrace: (log as SystemLog).error?.stack || (log as Record<string, unknown>).stackTrace as string,
      metadata: (log as SystemLog).metadata || (log as Record<string, unknown>).metadata as Record<string, unknown>
    };
    return systemLog;
  };

  const fetchLogsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      // Fetch logs using query endpoint
      const logsData = await queryLogs();
      setLogs(logsData);

      // Fetch stats
      try {
        const statsResponse = await makeClientAuthenticatedRequestWithEndpointSafe(
          'logsStats' as keyof typeof API_ENDPOINTS,
          { method: 'GET' }
        );
        if (statsResponse.ok) {
          const result = await statsResponse.json();
          setStats(result.success ? result.data : result);
        }
      } catch {
        logger.warn('Stats API not available');
      }

      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching logs data', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load logs data');
    } finally {
      setLoading(false);
    }
  }, [queryLogs]);

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchLogsData(),
      fetchLogConfig(),
      fetchLogMetrics(),
      fetchErrorSummary(),
      fetchLogStatistics(),
      fetchSlowOperations(),
    ]);
  }, [fetchLogsData, fetchLogConfig, fetchLogMetrics, fetchErrorSummary, fetchLogStatistics, fetchSlowOperations]);

  const handleCleanup = async () => {
    if (confirm('Are you sure you want to cleanup expired logs? This action cannot be undone.')) {
      const success = await cleanupLogs(fetchAllData);
      if (success) {
        toast.success('Logs cleaned up successfully');
      } else {
        toast.error('Failed to cleanup logs');
      }
    }
  };

  const handleFlush = async (type: 'all' | 'database' | 'files' = 'all') => {
    const confirmMessage = type === 'all' 
      ? 'Are you sure you want to flush ALL logs? This action cannot be undone!'
      : `Are you sure you want to flush ${type} logs? This action cannot be undone!`;
    
    if (confirm(confirmMessage)) {
      const success = await flushLogs(type, fetchAllData);
      if (success) {
        toast.success('Logs flushed successfully');
      } else {
        toast.error('Failed to flush logs');
      }
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogsData();
    }
  }, [filters, sortBy, sortOrder, currentPage, activeTab, fetchLogsData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchAllData();
      toast.success('Data refreshed');
    } catch (err) {
      logger.error('Error refreshing data', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewLogDetails = async (log: SystemLog) => {
    setSelectedLog(log);
    const logId = log.logId || log.id || log._id;
    if (logId) {
      const fullDetails = await fetchLogDetails(logId);
      if (fullDetails) {
        setSelectedLog(fullDetails);
      }
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const queryParams: Record<string, string> = {
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        format,
      };
      
      if (filters.level) queryParams.level = filters.level;
      if (filters.category) queryParams.category = filters.category;
      if (filters.user) queryParams.user = filters.user;
      if (filters.source) queryParams.source = filters.source;
      if (filters.search) queryParams.search = filters.search;

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'logsExportData' as keyof typeof API_ENDPOINTS,
        { method: 'GET', query: queryParams }
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast.success('Export started');
    } catch (err) {
      logger.error('Error exporting data', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to export data');
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'fatal': return 'text-rose-600 bg-rose-100';
      case 'error': return 'text-rose-600 bg-rose-100';
      case 'warn': return 'text-amber-600 bg-amber-100';
      case 'info': return 'text-sky-600 bg-sky-100';
      case 'debug': return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Server className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'api': return <Activity className="w-4 h-4" />;
      case 'auth': return <Lock className="w-4 h-4" />;
      case 'security': return <Lock className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'user_activity': return <User className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'fatal': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'info': return <Info className="w-4 h-4 text-sky-500" />;
      case 'debug': return <Activity className="w-4 h-4 text-slate-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleSort = (field: 'timestamp' | 'level' | 'category' | 'source') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      level: '',
      category: '',
      user: '',
      source: '',
      search: '',
      correlationId: ''
    });
    setCurrentPage(1);
  };

  if (loading && !stats) {
    return (
      <Loading 
        size="xl" 
        text="Loading system logs..." 
        fullScreen={true}
        variant="default"
      />
    );
  }

  if (error && !stats) {
    return (
      <AdminErrorState 
        error={error}
        onRetry={fetchAllData}
        retryText="Try Again"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            System Logs
          </h1>
          <p className="text-slate-600 text-sm">Monitor system activity, configure logging, and analyze performance</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-slate-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Tabs">
          {[
            { id: 'logs', label: 'Logs', icon: FileText },
            { id: 'config', label: 'Configuration', icon: Settings },
            { id: 'metrics', label: 'Metrics', icon: Gauge },
            { id: 'errors', label: 'Error Summary', icon: AlertTriangle },
            { id: 'slow-ops', label: 'Slow Operations', icon: Timer },
            { id: 'statistics', label: 'Statistics', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Overview - Always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Logs</p>
              <p className="text-lg font-bold text-slate-900">
                {stats?.totalLogs?.toLocaleString() || logStatistics?.totalLogs?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-slate-500">
                {stats?.todayLogs || 0} today
              </p>
            </div>
            <FileText className="w-5 h-5 text-sky-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Errors</p>
              <p className="text-lg font-bold text-slate-900">
                {stats?.errorCount || errorSummary?.totalErrors || 0}
              </p>
              <p className="text-xs text-slate-500">
                {stats?.warningCount || 0} warnings
              </p>
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Active Users</p>
              <p className="text-lg font-bold text-slate-900">
                {stats?.uniqueUsers || 0}
              </p>
              <p className="text-xs text-slate-500">
                In selected period
              </p>
            </div>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 border-l-4 border-l-violet-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">System Health</p>
              <p className="text-lg font-bold text-slate-900">
                {stats?.systemHealth || 'Unknown'}
              </p>
              <p className="text-xs text-slate-500">
                {stats?.errorRate || 0}% error rate
              </p>
            </div>
            <Monitor className="w-5 h-5 text-violet-600" />
          </div>
        </div>
      </div>

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Correlation Search */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Correlation Search</h3>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={correlationSearchId}
                onChange={(e) => setCorrelationSearchId(e.target.value)}
                placeholder="Enter correlation ID..."
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={searchByCorrelationId}
                disabled={searchingCorrelation}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {searchingCorrelation ? 'Searching...' : 'Search'}
              </button>
            </div>
            {correlatedLogs.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-slate-600 mb-2">Found {correlatedLogs.length} correlated logs:</p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {correlatedLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-50 rounded-lg text-sm cursor-pointer hover:bg-slate-100"
                      onClick={() => handleViewLogDetails(log)}
                    >
                      <div className="flex items-center gap-2">
                        {getLevelIcon(log.level)}
                        <span className="text-slate-600">{new Date(log.timestamp).toLocaleString()}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-900 mt-1 truncate">{log.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Filters & Search</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50"
                  >
                    <Filter className="w-3.5 h-3.5 mr-1" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </button>
                  <button
                    onClick={() => exportData('csv')}
                    className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    CSV
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    JSON
                  </button>
                  <button
                    onClick={handleCleanup}
                    disabled={cleaning}
                    className="inline-flex items-center px-2.5 py-1.5 border border-amber-300 shadow-sm text-xs font-medium rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50"
                  >
                    <Trash2 className={`w-3.5 h-3.5 mr-1 ${cleaning ? 'animate-spin' : ''}`} />
                    Cleanup
                  </button>
                  <button
                    onClick={() => handleFlush('all')}
                    disabled={flushing}
                    className="inline-flex items-center px-2.5 py-1.5 border border-rose-300 shadow-sm text-xs font-medium rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <XCircle className={`w-3.5 h-3.5 mr-1 ${flushing ? 'animate-spin' : ''}`} />
                    Flush
                  </button>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="p-4 border-b border-slate-200">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Level</label>
                    <select
                      value={filters.level}
                      onChange={(e) => handleFilterChange('level', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Levels</option>
                      <option value="fatal">Fatal</option>
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Categories</option>
                      <option value="system">System</option>
                      <option value="database">Database</option>
                      <option value="api">API</option>
                      <option value="auth">Authentication</option>
                      <option value="security">Security</option>
                      <option value="performance">Performance</option>
                      <option value="user_activity">User Activity</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Source</label>
                    <input
                      type="text"
                      value={filters.source}
                      onChange={(e) => handleFilterChange('source', e.target.value)}
                      placeholder="Source..."
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">User</label>
                    <input
                      type="text"
                      value={filters.user}
                      onChange={(e) => handleFilterChange('user', e.target.value)}
                      placeholder="User..."
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Search</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={clearFilters}
                    className="text-xs text-slate-600 hover:text-slate-800"
                  >
                    Clear all filters
                  </button>
                  <span className="text-xs text-slate-500">{logs.length} logs found</span>
                </div>
              </div>
            )}
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">System Logs</h3>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500 mr-2">Sort:</span>
                  {(['timestamp', 'level', 'category', 'source'] as const).map((field) => (
                    <button
                      key={field}
                      onClick={() => handleSort(field)}
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-lg ${
                        sortBy === field ? 'bg-indigo-100 text-indigo-800' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                      {sortBy === field && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Level</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Message</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Source</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {logs.map((log) => (
                    <tr key={log.id || log.logId} className="hover:bg-slate-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-900">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 text-slate-400 mr-1" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          {getLevelIcon(log.level)}
                          <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          {getCategoryIcon(log.category)}
                          <span className="ml-1.5 text-xs text-slate-900 capitalize">{log.category.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-900 max-w-xs truncate">
                        {log.message}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-900">
                        {log.source}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          onClick={() => handleViewLogDetails(log)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {logs.length === 0 && (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-slate-900 mb-1">No logs found</h3>
                <p className="text-xs text-slate-500">Try adjusting your filters or date range.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          {/* Global Log Level */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                Global Log Level
              </h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-4">
                Set the minimum log level for the entire application. Logs below this level will not be recorded.
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="fatal">Fatal</option>
                </select>
                <button
                  onClick={() => updateGlobalLogLevel(selectedLevel)}
                  disabled={configEditing || selectedLevel === logConfig?.globalLevel}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {configEditing ? 'Saving...' : 'Save'}
                </button>
              </div>
              {logConfig && (
                <p className="text-xs text-slate-500 mt-2">
                  Current level: <span className={`font-medium px-1.5 py-0.5 rounded ${getLevelColor(logConfig.globalLevel)}`}>{logConfig.globalLevel.toUpperCase()}</span>
                </p>
              )}
            </div>
          </div>

          {/* Module Overrides */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Module-Specific Overrides
              </h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-4">
                Override log levels for specific modules or contexts. These take precedence over the global setting.
              </p>
              
              {/* Add new override */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={newOverrideContext}
                  onChange={(e) => setNewOverrideContext(e.target.value)}
                  placeholder="Module/Context name..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newOverrideLevel}
                  onChange={(e) => setNewOverrideLevel(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="fatal">Fatal</option>
                </select>
                <button
                  onClick={addLogLevelOverride}
                  disabled={configEditing || !newOverrideContext.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {/* Existing overrides */}
              {logConfig?.overrides && logConfig.overrides.length > 0 ? (
                <div className="space-y-2">
                  {logConfig.overrides.map((override, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-900">{override.context}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(override.level)}`}>
                          {override.level.toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={() => removeLogLevelOverride(override.context)}
                        disabled={configEditing}
                        className="text-rose-600 hover:text-rose-800 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No module overrides configured</p>
                </div>
              )}
            </div>
          </div>

          {/* Configuration Summary */}
          {logConfig && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900">Configuration Summary</h3>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Retention</p>
                  <p className="text-lg font-bold text-slate-900">{logConfig.retentionDays} days</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Max File Size</p>
                  <p className="text-lg font-bold text-slate-900">{logConfig.maxFileSize}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Console</p>
                  <p className={`text-lg font-bold ${logConfig.enableConsole ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {logConfig.enableConsole ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Database</p>
                  <p className={`text-lg font-bold ${logConfig.enableDatabase ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {logConfig.enableDatabase ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Real-time Log Metrics</h3>
            <button
              onClick={resetLogMetrics}
              className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset Metrics
            </button>
          </div>

          {logMetrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs font-medium">Logs/Minute</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{logMetrics.logsPerMinute}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">Logs/Hour</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{logMetrics.logsPerHour}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Avg Processing</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{logMetrics.avgProcessingTime}ms</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-medium">Queue Size</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{logMetrics.queueSize}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <Gauge className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No metrics data available</p>
            </div>
          )}

          {/* Level Distribution */}
          {logMetrics?.byLevel && logMetrics.byLevel.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900">Log Level Distribution</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {logMetrics.byLevel.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className={`font-medium ${getLevelColor(item.level)} px-2 py-0.5 rounded`}>{item.level.toUpperCase()}</span>
                        <span className="text-slate-600">{item.count} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.level === 'error' || item.level === 'fatal' ? 'bg-rose-500' :
                            item.level === 'warn' ? 'bg-amber-500' :
                            item.level === 'info' ? 'bg-sky-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Summary Tab */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          {errorSummary ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Errors</p>
                  <p className="text-2xl font-bold text-rose-600">{errorSummary.totalErrors}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">Unique Errors</p>
                  <p className="text-2xl font-bold text-slate-900">{errorSummary.uniqueErrors}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">Top Source</p>
                  <p className="text-lg font-bold text-slate-900">{errorSummary.topSources?.[0]?.source || 'N/A'}</p>
                </div>
              </div>

              {/* Error Groups */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-semibold text-slate-900">Error Groups</h3>
                </div>
                {errorSummary.groups && errorSummary.groups.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {errorSummary.groups.map((group, idx) => (
                      <div key={idx} className="p-4 hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{group.message}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span>Count: <strong>{group.count}</strong></span>
                              <span>Last: {new Date(group.lastOccurred).toLocaleString()}</span>
                              <span className={`px-1.5 py-0.5 rounded ${
                                group.trend === 'increasing' ? 'bg-rose-100 text-rose-700' :
                                group.trend === 'decreasing' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {group.trend}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {group.sources.slice(0, 3).map((source, sIdx) => (
                                <span key={sIdx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-rose-600">{group.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                    <p className="text-slate-500">No error groups found</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No error summary data available</p>
            </div>
          )}
        </div>
      )}

      {/* Slow Operations Tab */}
      {activeTab === 'slow-ops' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Timer className="w-4 h-4 text-amber-600" />
                Slow Operations ({slowOperations.length})
              </h3>
            </div>
            {slowOperations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {slowOperations.map((op, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                            {op.type}
                          </span>
                          <span className="font-medium text-slate-900">{op.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>Source: {op.source}</span>
                          <span>{new Date(op.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${op.duration > op.threshold * 2 ? 'text-rose-600' : 'text-amber-600'}`}>
                          {op.duration}ms
                        </p>
                        <p className="text-xs text-slate-500">Threshold: {op.threshold}ms</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-slate-500">No slow operations detected</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="space-y-4">
          {logStatistics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">Period</p>
                  <p className="text-lg font-bold text-slate-900">{logStatistics.period}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">Storage Used</p>
                  <p className="text-lg font-bold text-slate-900">{logStatistics.storageUsed}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">Oldest Log</p>
                  <p className="text-sm font-medium text-slate-900">{new Date(logStatistics.oldestLog).toLocaleDateString()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">Newest Log</p>
                  <p className="text-sm font-medium text-slate-900">{new Date(logStatistics.newestLog).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Response Time Stats */}
              {logStatistics.responseTimeStats && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-semibold text-slate-900">Response Time Statistics</h3>
                  </div>
                  <div className="p-4 grid grid-cols-3 md:grid-cols-6 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Min</p>
                      <p className="text-lg font-bold text-emerald-600">{logStatistics.responseTimeStats.min}ms</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Avg</p>
                      <p className="text-lg font-bold text-slate-900">{logStatistics.responseTimeStats.avg}ms</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Max</p>
                      <p className="text-lg font-bold text-rose-600">{logStatistics.responseTimeStats.max}ms</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">P50</p>
                      <p className="text-lg font-bold text-slate-900">{logStatistics.responseTimeStats.p50}ms</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">P95</p>
                      <p className="text-lg font-bold text-amber-600">{logStatistics.responseTimeStats.p95}ms</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">P99</p>
                      <p className="text-lg font-bold text-rose-600">{logStatistics.responseTimeStats.p99}ms</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Logs by Category */}
              {logStatistics.byCategory && logStatistics.byCategory.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-semibold text-slate-900">Logs by Category</h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {logStatistics.byCategory.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(cat.category)}
                            <span className="font-medium text-slate-900 capitalize">{cat.category.replace('_', ' ')}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">{cat.count.toLocaleString()}</span>
                            <span className="text-xs text-slate-500 ml-2">({cat.avgPerDay}/day)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No statistics data available</p>
            </div>
          )}
        </div>
      )}

      {/* Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Log Details"
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Timestamp</label>
                <p className="text-sm text-slate-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Level</label>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(selectedLog.level)}`}>
                  {selectedLog.level.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                <p className="text-sm text-slate-900 capitalize">{selectedLog.category.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Source</label>
                <p className="text-sm text-slate-900">{selectedLog.source}</p>
              </div>
            </div>

            {selectedLog.correlationId && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Correlation ID</label>
                <code className="text-sm bg-slate-100 px-2 py-1 rounded">{selectedLog.correlationId}</code>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Message</label>
              <p className="text-sm text-slate-900">{selectedLog.message}</p>
            </div>

            {selectedLog.request && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Request</label>
                <div className="text-sm bg-slate-50 p-3 rounded-lg">
                  {selectedLog.request.method && selectedLog.request.url && (
                    <p><span className="font-medium">{selectedLog.request.method}</span> {selectedLog.request.url}</p>
                  )}
                  {selectedLog.request.ip && <p className="text-slate-600">IP: {selectedLog.request.ip}</p>}
                  {selectedLog.request.userId && <p className="text-slate-600">User ID: {selectedLog.request.userId}</p>}
                </div>
              </div>
            )}

            {selectedLog.error && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Error</label>
                <div className="text-sm bg-rose-50 p-3 rounded-lg border border-rose-200">
                  {selectedLog.error.name && <p className="font-medium text-rose-800">{selectedLog.error.name}</p>}
                  {selectedLog.error.message && <p className="text-rose-700">{selectedLog.error.message}</p>}
                  {selectedLog.error.stack && (
                    <pre className="mt-2 text-xs bg-rose-100 p-2 rounded overflow-x-auto max-h-48">
                      {selectedLog.error.stack}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Metadata</label>
                <pre className="text-xs bg-slate-100 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
