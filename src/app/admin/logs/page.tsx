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
  Info
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { API_ENDPOINTS } from "@/lib/api";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { logger } from "@/lib/logger";

// Log interface matching API response structure
interface SystemLog {
  _id?: string;
  logId: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  category: string;
  source: string;
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
  // Legacy/compatibility fields
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

interface ErrorTrends {
  period: string;
  trends: {
    date: string;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  }[];
  topErrors: {
    message: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

interface PerformanceMetrics {
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
}

interface DashboardSummary {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  systemHealth: string;
  uptime: number;
  lastUpdated: string;
  criticalIssues: number;
  performanceScore: number;
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
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [errorTrends, setErrorTrends] = useState<ErrorTrends | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
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
  
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    level: '',
    category: '',
    user: '',
    source: '',
    search: ''
  });

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

  const fetchLogsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string> = {
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      };
      
      // Add other filters
      if (filters.level) queryParams.level = filters.level;
      if (filters.category) queryParams.category = filters.category;
      if (filters.user) queryParams.user = filters.user;
      if (filters.source) queryParams.source = filters.source;
      if (filters.search) queryParams.search = filters.search;

      let logsData, statsData, errorTrendsData, performanceData, dashboardData;

      try {
        const [
          logsResponse, 
          statsResponse, 
          errorTrendsResponse, 
          performanceResponse, 
          dashboardResponse
        ] = await Promise.all([
          makeClientAuthenticatedRequestWithEndpointSafe(
            'logs' as keyof typeof API_ENDPOINTS,
            { method: 'GET', query: queryParams }
          ),
          makeClientAuthenticatedRequestWithEndpointSafe(
            'logsStats' as keyof typeof API_ENDPOINTS,
            { method: 'GET' }
          ),
          makeClientAuthenticatedRequestWithEndpointSafe(
            'logsAnalyticsErrorTrends' as keyof typeof API_ENDPOINTS,
            { method: 'GET' }
          ),
          makeClientAuthenticatedRequestWithEndpointSafe(
            'logsAnalyticsPerformance' as keyof typeof API_ENDPOINTS,
            { method: 'GET' }
          ),
          makeClientAuthenticatedRequestWithEndpointSafe(
            'logsDashboardSummary' as keyof typeof API_ENDPOINTS,
            { method: 'GET' }
          )
        ]);

        // Handle logs response
        if (!logsResponse.ok) {
          logger.warn('Logs API not available');
          logsData = { data: [] };
        } else {
          const result = await logsResponse.json();
          logsData = result.success ? result : { data: result.data || result.logs || [] };
        }

        // Handle stats response
        if (!statsResponse.ok) {
          logger.warn('Stats API not available');
          statsData = {
            totalLogs: 0,
            todayLogs: 0,
            errorCount: 0,
            warningCount: 0,
            uniqueUsers: 0,
            topCategories: [],
            levelBreakdown: [],
            recentErrors: [],
            systemHealth: 'Unknown',
            avgResponseTime: 0,
            errorRate: 0
          };
        } else {
          const result = await statsResponse.json();
          statsData = result.success ? result.data : result;
        }

        // Handle error trends response
        if (!errorTrendsResponse.ok) {
          logger.warn('Error trends API not available');
          errorTrendsData = {
            period: '7d',
            trends: [],
            topErrors: []
          };
        } else {
          const result = await errorTrendsResponse.json();
          errorTrendsData = result.success ? result.data : result;
        }

        // Handle performance response
        if (!performanceResponse.ok) {
          logger.warn('Performance API not available');
          performanceData = {
            avgResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: 0,
            throughput: 0,
            errorRate: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            activeConnections: 0,
            requestsPerSecond: 0
          };
        } else {
          const result = await performanceResponse.json();
          performanceData = result.success ? result.data : result;
        }

        // Handle dashboard response
        if (!dashboardResponse.ok) {
          logger.warn('Dashboard API not available');
          dashboardData = {
            totalLogs: 0,
            errorCount: 0,
            warningCount: 0,
            systemHealth: 'Unknown',
            uptime: 0,
            lastUpdated: new Date().toISOString(),
            criticalIssues: 0,
            performanceScore: 0
          };
        } else {
          const result = await dashboardResponse.json();
          dashboardData = result.success ? result.data : result;
        }
      } catch (apiError) {
        logger.error('API calls failed', apiError instanceof Error ? apiError : new Error(String(apiError)));
        // Return empty data - external API integration needed
        logsData = { data: [] };
        statsData = {
          totalLogs: 0,
          todayLogs: 0,
          errorCount: 0,
          warningCount: 0,
          uniqueUsers: 0,
          topCategories: [],
          levelBreakdown: [],
          recentErrors: [],
          systemHealth: 'Unknown',
          avgResponseTime: 0,
          errorRate: 0
        };
        errorTrendsData = { period: '7d', trends: [], topErrors: [] };
        performanceData = {
          avgResponseTime: 0,
          maxResponseTime: 0,
          minResponseTime: 0,
          throughput: 0,
          errorRate: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          activeConnections: 0,
          requestsPerSecond: 0
        };
        dashboardData = {
          totalLogs: 0,
          errorCount: 0,
          warningCount: 0,
          systemHealth: 'Unknown',
          uptime: 0,
          lastUpdated: new Date().toISOString(),
          criticalIssues: 0,
          performanceScore: 0
        };
      }

      // Transform the data to match our interface
      const logsArray = logsData.data || logsData.logs || [];
      const transformedLogs = logsArray.map((log: SystemLog | Record<string, unknown>) => {
        const systemLog: SystemLog = {
          _id: (log as SystemLog)._id,
          logId: (log as SystemLog).logId || (log as Record<string, unknown>).id as string || `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          level: (log as SystemLog).level || (log as Record<string, unknown>).level as SystemLog['level'] || 'info',
          message: (log as SystemLog).message || (log as Record<string, unknown>).message as string || 'No message',
          category: (log as SystemLog).category || (log as Record<string, unknown>).category as string || 'system',
          source: (log as SystemLog).source || (log as Record<string, unknown>).source as string || 'unknown',
          timestamp: (log as SystemLog).timestamp || (log as Record<string, unknown>).timestamp as string || new Date().toISOString(),
          request: (log as SystemLog).request,
          response: (log as SystemLog).response,
          error: (log as SystemLog).error,
          environment: (log as SystemLog).environment,
          retentionDate: (log as SystemLog).retentionDate,
          // Legacy compatibility
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
      });

      setLogs(transformedLogs);
      setStats(statsData);
      setErrorTrends(errorTrendsData);
      setPerformanceMetrics(performanceData);
      setDashboardSummary(dashboardData);
      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching logs data', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load logs data');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, currentPage, itemsPerPage]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await fetchLogsData();
  }, [fetchLogsData]);

  const handleCleanup = async () => {
    if (confirm('Are you sure you want to cleanup expired logs? This action cannot be undone.')) {
      const success = await cleanupLogs(fetchAllData);
      if (success) {
        alert('Logs cleaned up successfully');
      } else {
        alert('Failed to cleanup logs');
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
        alert('Logs flushed successfully');
      } else {
        alert('Failed to flush logs');
      }
    }
  };

  useEffect(() => {
    fetchLogsData();
  }, [fetchLogsData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchLogsData();
    } catch (err) {
      logger.error('Error refreshing data', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to refresh logs data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewLogDetails = async (log: SystemLog) => {
    setSelectedLog(log);
    // Fetch full details
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
      
      // Add other filters
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
    } catch (err) {
      logger.error('Error exporting data', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'fatal': return 'text-red-600 bg-red-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'warn': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'debug': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
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
      case 'fatal': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug': return <Activity className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
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
      search: ''
    });
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Loading 
        size="xl" 
        text="Loading system logs..." 
        fullScreen={true}
        variant="default"
      />
    );
  }

  if (error) {
    return (
      <AdminErrorState 
        error={error}
        onRetry={fetchLogsData}
        retryText="Try Again"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            System Logs
          </h1>
          <p className="text-gray-600 text-sm">Monitor system activity and performance</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Logs</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.totalLogs?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500">
                {stats?.todayLogs || 0} today
              </p>
            </div>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Errors</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.errorCount || 0}
              </p>
              <p className="text-xs text-gray-500">
                {stats?.warningCount || 0} warnings
              </p>
            </div>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Active Users</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.uniqueUsers || 0}
              </p>
              <p className="text-xs text-gray-500">
                In selected period
              </p>
            </div>
            <Users className="w-5 h-5 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">System Health</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.systemHealth || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500">
                {stats?.errorRate || 0}% error rate
              </p>
            </div>
            <Monitor className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded shadow p-3 border-l-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Avg Response Time</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.avgResponseTime || 0}ms
              </p>
              <p className="text-xs text-gray-500">
                {stats?.avgResponseTime && stats.avgResponseTime < 500 ? 'Good' : 'Slow'}
              </p>
            </div>
            <Zap className="w-4 h-4 text-cyan-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Error Rate</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.errorRate || 0}%
              </p>
              <p className="text-xs text-gray-500">
                {stats?.errorRate && stats.errorRate < 5 ? 'Low' : 'High'}
              </p>
            </div>
            <Activity className="w-4 h-4 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Top Category</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.topCategories?.[0]?.category || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {stats?.topCategories?.[0]?.count || 0} logs
              </p>
            </div>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button
                onClick={() => exportData('csv')}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-3 h-3 mr-1" />
                CSV
              </button>
              <button
                onClick={() => exportData('json')}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-3 h-3 mr-1" />
                JSON
              </button>
              <button
                onClick={handleCleanup}
                disabled={cleaning}
                className="inline-flex items-center px-2 py-1 border border-yellow-300 shadow-sm text-xs font-medium rounded text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                title="Cleanup expired logs"
              >
                <Trash2 className={`w-3 h-3 mr-1 ${cleaning ? 'animate-spin' : ''}`} />
                {cleaning ? 'Cleaning...' : 'Cleanup'}
              </button>
              <button
                onClick={() => handleFlush('all')}
                disabled={flushing}
                className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                title="Flush all logs"
              >
                <XCircle className={`w-3 h-3 mr-1 ${flushing ? 'animate-spin' : ''}`} />
                {flushing ? 'Flushing...' : 'Flush'}
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                <div className="space-y-1">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label className="block text-xs font-medium text-gray-700 mb-1">User</label>
                <input
                  type="text"
                  value={filters.user}
                  onChange={(e) => handleFilterChange('user', e.target.value)}
                  placeholder="Search by user..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
                <input
                  type="text"
                  value={filters.source}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  placeholder="Search by source..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search across all fields..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={clearFilters}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {logs.length} logs found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Logs Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">System Logs</h3>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Sort:</span>
              <button
                onClick={() => handleSort('timestamp')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'timestamp' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Time
                {sortBy === 'timestamp' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('level')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'level' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Level
                {sortBy === 'level' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('category')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'category' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Category
                {sortBy === 'category' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('source')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'source' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Source
                {sortBy === 'source' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 text-gray-400 mr-1" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      {getLevelIcon(log.level)}
                      <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      {getCategoryIcon(log.category)}
                      <span className="ml-1 text-xs text-gray-900 capitalize">{log.category.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate">
                    {log.message}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {log.source}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {log.userName ? (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6">
                          <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-2">
                          <div className="text-xs font-medium text-gray-900">{log.userName}</div>
                          <div className="text-xs text-gray-500">{log.userRole}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">System</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <button
                      onClick={() => handleViewLogDetails(log)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-8">
            <Database className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No system logs found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or date range.</p>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-4 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded bg-white">
            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Log Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Timestamp</label>
                    <p className="text-xs text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Level</label>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(selectedLog.level)}`}>
                      {selectedLog.level.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Category</label>
                    <p className="text-xs text-gray-900 capitalize">{selectedLog.category.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Source</label>
                    <p className="text-xs text-gray-900">{selectedLog.source}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Message</label>
                  <p className="text-xs text-gray-900">{selectedLog.message}</p>
                </div>

                {selectedLog.request && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Request</label>
                    <div className="mt-1 text-xs text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedLog.request.method && selectedLog.request.url && (
                        <p><span className="font-medium">{selectedLog.request.method}</span> {selectedLog.request.url}</p>
                      )}
                      {selectedLog.request.ip && (
                        <p>IP: {selectedLog.request.ip}</p>
                      )}
                      {selectedLog.request.userId && (
                        <p>User ID: {selectedLog.request.userId}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedLog.response && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Response</label>
                    <div className="mt-1 text-xs text-gray-900 bg-gray-50 p-2 rounded">
                      <p>Status: {selectedLog.response.statusCode || 'N/A'}</p>
                      {selectedLog.response.responseTime && (
                        <p>Response Time: {selectedLog.response.responseTime}ms</p>
                      )}
                      {selectedLog.response.success !== undefined && (
                        <p>Success: {selectedLog.response.success ? 'Yes' : 'No'}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedLog.error && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Error</label>
                    <div className="mt-1 text-xs text-gray-900 bg-red-50 p-2 rounded">
                      {selectedLog.error.name && (
                        <p className="font-medium text-red-800">Name: {selectedLog.error.name}</p>
                      )}
                      {selectedLog.error.message && (
                        <p className="text-red-700">Message: {selectedLog.error.message}</p>
                      )}
                      {selectedLog.error.code && (
                        <p className="text-red-600">Code: {selectedLog.error.code}</p>
                      )}
                      {selectedLog.error.stack && (
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto max-h-48">
                          {selectedLog.error.stack}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {selectedLog.request?.userId && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">User ID</label>
                    <p className="text-xs text-gray-900">{selectedLog.request.userId}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">IP Address</label>
                    <p className="text-xs text-gray-900">{selectedLog.request?.ip || selectedLog.ipAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">User Agent</label>
                    <p className="text-xs text-gray-900 break-all">{selectedLog.request?.userAgent || selectedLog.userAgent || 'N/A'}</p>
                  </div>
                </div>

                {selectedLog.response?.responseTime && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Response Time</label>
                    <p className="text-xs text-gray-900">{selectedLog.response.responseTime}ms</p>
                  </div>
                )}

                {selectedLog.environment && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Environment</label>
                    <p className="text-xs text-gray-900">{selectedLog.environment}</p>
                  </div>
                )}

                {selectedLog.retentionDate && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Retention Date</label>
                    <p className="text-xs text-gray-900">{new Date(selectedLog.retentionDate).toLocaleString()}</p>
                  </div>
                )}

                {selectedLog.memoryUsage && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Memory Usage</label>
                      <p className="text-xs text-gray-900">{selectedLog.memoryUsage}%</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">CPU Usage</label>
                      <p className="text-xs text-gray-900">{selectedLog.cpuUsage || 0}%</p>
                    </div>
                  </div>
                )}


                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Metadata</label>
                    <pre className="text-xs text-gray-900 bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      <div className="space-y-4">
        <div className="bg-white rounded shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Error Trends</h3>
            {errorTrends ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Period: {errorTrends.period}</h4>
                    <div className="space-y-2">
                      {(errorTrends.trends || []).slice(0, 5).map((trend, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{trend.date}</span>
                          <div className="flex space-x-2">
                            <span className="text-xs text-red-600">Errors: {trend.errorCount}</span>
                            <span className="text-xs text-yellow-600">Warnings: {trend.warningCount}</span>
                            <span className="text-xs text-blue-600">Info: {trend.infoCount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Top Errors</h4>
                    <div className="space-y-2">
                      {(errorTrends.topErrors || []).slice(0, 5).map((error, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600 truncate">{error.message}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">{error.count}</span>
                            <span className={`text-xs px-1 py-0.5 rounded ${
                              error.trend === 'up' ? 'bg-red-100 text-red-600' :
                              error.trend === 'down' ? 'bg-green-100 text-green-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {error.trend}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No analytics data available</p>
            )}
          </div>
      </div>

      {/* Performance Section */}
      <div className="space-y-4">
        <div className="bg-white rounded shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
            {performanceMetrics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Response Time</p>
                      <p className="text-2xl font-bold text-blue-900">{performanceMetrics.avgResponseTime}ms</p>
                      <p className="text-xs text-blue-600">
                        Max: {performanceMetrics.maxResponseTime}ms | Min: {performanceMetrics.minResponseTime}ms
                      </p>
                    </div>
                    <Zap className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Throughput</p>
                      <p className="text-2xl font-bold text-green-900">{performanceMetrics.throughput}</p>
                      <p className="text-xs text-green-600">
                        {performanceMetrics.requestsPerSecond} req/s
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Error Rate</p>
                      <p className="text-2xl font-bold text-red-900">{performanceMetrics.errorRate}%</p>
                      <p className="text-xs text-red-600">
                        Active connections: {performanceMetrics.activeConnections}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Resource Usage</p>
                      <p className="text-2xl font-bold text-purple-900">{performanceMetrics.memoryUsage}%</p>
                      <p className="text-xs text-purple-600">
                        CPU: {performanceMetrics.cpuUsage}%
                      </p>
                    </div>
                    <Monitor className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No performance data available</p>
            )}
          </div>
      </div>

      {/* Dashboard Section */}
      <div className="space-y-4">
        <div className="bg-white rounded shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dashboard Summary</h3>
            {dashboardSummary ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-600 p-4 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-100">System Health</p>
                      <p className="text-2xl font-bold">{dashboardSummary.systemHealth ?? 'Unknown'}</p>
                      <p className="text-xs text-blue-100">
                        Uptime: {dashboardSummary.uptime ?? 0}%
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-blue-100" />
                  </div>
                </div>
                
                <div className="bg-green-600 p-4 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-100">Performance Score</p>
                      <p className="text-2xl font-bold">{dashboardSummary.performanceScore ?? 0}/100</p>
                      <p className="text-xs text-green-100">
                        Critical Issues: {dashboardSummary.criticalIssues ?? 0}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-100" />
                  </div>
                </div>
                
                <div className="bg-purple-600 p-4 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-100">Logs Summary</p>
                      <p className="text-2xl font-bold">{(dashboardSummary.totalLogs ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-purple-100">
                        Errors: {dashboardSummary.errorCount ?? 0} | Warnings: {dashboardSummary.warningCount ?? 0}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-purple-100" />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No dashboard data available</p>
            )}
          </div>
      </div>
    </>
    </div>
  );
}
