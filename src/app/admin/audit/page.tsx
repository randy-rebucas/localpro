"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Shield, 
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
  Settings,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";

interface AuditLog {
  _id?: string;
  auditId: string;
  action: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  actor: {
    userId: string;
    email: string;
    role: string;
    ip?: string;
    userAgent?: string;
    sessionId?: string;
  };
  target?: {
    type: string;
    id: string;
    name?: string;
    description?: string;
  };
  changes?: {
    fields?: string[];
    [key: string]: unknown;
  };
  metadata?: {
    source?: string;
    reason?: string;
    [key: string]: unknown;
  };
  request?: {
    method?: string;
    url?: string;
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
  };
  response?: {
    statusCode?: number;
    message?: string;
    success?: boolean;
  };
  environment?: string;
  timestamp: string;
  retentionDate?: string;
  // Legacy fields for backward compatibility
  id?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  resource?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  sessionId?: string;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  criticalAlerts: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  severityBreakdown: { severity: string; count: number }[];
}

interface DashboardSummary {
  totalLogs?: number;
  todayLogs?: number;
  criticalAlerts?: number;
  uniqueUsers?: number;
  recentLogs?: AuditLog[];
  topActions?: { action: string; count: number }[];
  categoryBreakdown?: { category: string; count: number }[];
  severityBreakdown?: { severity: string; count: number }[];
  trends?: Array<{ date: string; count: number }>;
}

interface MetadataCategories {
  categories?: string[];
  actions?: string[];
  resources?: string[];
  severities?: string[];
  statuses?: string[];
}

interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  user: string;
  action: string;
  category: string;
  severity: string;
  status: string;
  search: string;
}



export default function AdminAuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary>({});
  const [metadataCategories, setMetadataCategories] = useState<MetadataCategories>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'timestamp' | 'user' | 'action' | 'severity'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    user: '',
    action: '',
    category: '',
    severity: '',
    status: '',
    search: ''
  });


  // Fetch metadata categories
  const fetchMetadataCategories = useCallback(async () => {
    try {
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'auditLogsMetadataCategories' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setMetadataCategories(result.data);
        } else if (result.categories) {
          setMetadataCategories(result);
        }
      }
    } catch (err) {
      logger.warn('Error fetching metadata categories', { error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  // Fetch dashboard summary
  const fetchDashboardSummary = useCallback(async () => {
    try {
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'auditLogsDashboardSummary' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setDashboardSummary(result.data);
        } else if (result.totalLogs !== undefined) {
          setDashboardSummary(result);
        }
      }
    } catch (err) {
      logger.warn('Error fetching dashboard summary', { error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  // Fetch audit log details
  const fetchLogDetails = useCallback(async (auditId: string): Promise<AuditLog | null> => {
    try {
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'auditLogsById' as keyof typeof API_ENDPOINTS,
        [auditId],
        {},
        { method: 'GET' }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return result.data as AuditLog;
        }
      }
      return null;
    } catch (err) {
      logger.warn('Error fetching log details', { error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  }, []);



  const fetchAuditData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.set('startDate', filters.dateRange.start);
      queryParams.set('endDate', filters.dateRange.end);
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', itemsPerPage.toString());
      
      // Add other filters
      if (filters.user) queryParams.set('user', filters.user);
      if (filters.action) queryParams.set('action', filters.action);
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.severity) queryParams.set('severity', filters.severity);
      if (filters.status) queryParams.set('status', filters.status);
      if (filters.search) queryParams.set('search', filters.search);


      let logsData, statsData;

      try {
        const [logsResponse, statsResponse] = await Promise.all([
          makeClientAuthenticatedRequestWithEndpointSafe(
            'auditLogs' as keyof typeof API_ENDPOINTS,
            { method: 'GET', query: Object.fromEntries(queryParams) }
          ),
          makeClientAuthenticatedRequestWithEndpointSafe(
            'auditLogsStats' as keyof typeof API_ENDPOINTS,
            { method: 'GET' }
          )
        ]);

        // Handle logs response
        if (!logsResponse.ok) {
          logger.warn('Logs API not available');
          logsData = { logs: [] };
        } else {
          logsData = await logsResponse.json();
        }

        // Handle stats response
        if (!statsResponse.ok) {
          logger.warn('Stats API not available');
          statsData = {
            totalLogs: 0,
            todayLogs: 0,
            criticalAlerts: 0,
            userActivity: [],
            actionBreakdown: [],
            categoryBreakdown: [],
            severityBreakdown: [],
            statusBreakdown: [],
            recentActivity: [],
            systemHealth: 'Unknown',
            complianceScore: 0,
            lastUpdated: new Date().toISOString()
          };
        } else {
          statsData = await statsResponse.json();
        }
      } catch (apiError) {
        logger.error('API calls failed', apiError instanceof Error ? apiError : new Error(String(apiError)));
        // Return empty data - external API integration needed
        logsData = { logs: [] };
        statsData = {
          totalLogs: 0,
          todayLogs: 0,
          criticalAlerts: 0,
          userActivity: [],
          actionBreakdown: [],
          categoryBreakdown: [],
          severityBreakdown: [],
          statusBreakdown: [],
          recentActivity: [],
          systemHealth: 'Unknown',
          complianceScore: 0,
          lastUpdated: new Date().toISOString()
        };
      }

      try {
        // Transform the data to match our interface
        const transformedLogs = (logsData.data || logsData.logs || []).map((log: AuditLog) => {
          // Use new structure if available, otherwise fall back to legacy
          const auditLog: AuditLog = {
            _id: log._id,
            auditId: log.auditId || log.id || `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            action: log.action || 'Unknown Action',
            category: log.category || 'system',
            severity: log.severity || 'low',
            description: log.description || log.details || 'No details available',
            timestamp: log.timestamp || new Date().toISOString(),
            actor: log.actor || {
              userId: (log.user?.id || 'unknown') as string,
              email: (log.user?.email || 'unknown@example.com') as string,
              role: (log.user?.role || 'unknown') as string,
              ip: log.ipAddress || 'Unknown',
              userAgent: log.userAgent || 'Unknown',
              sessionId: log.sessionId || 'unknown'
            },
            target: log.target,
            changes: log.changes,
            metadata: log.metadata,
            request: log.request,
            response: log.response,
            environment: log.environment,
            retentionDate: log.retentionDate,
            // Legacy compatibility
            id: log.auditId || log.id,
            resource: log.target?.name || log.resource || log.target?.type || 'Unknown Resource',
            details: log.description || log.details,
            ipAddress: log.actor?.ip || log.ipAddress,
            userAgent: log.actor?.userAgent || log.userAgent,
            status: log.response?.success ? 'success' : (log.response?.statusCode && log.response.statusCode >= 400 ? 'error' : log.status || 'info'),
            sessionId: log.actor?.sessionId || log.sessionId,
            user: log.user || {
              id: log.actor?.userId || 'unknown',
              name: log.target?.name || log.actor?.email?.split('@')[0] || 'Unknown User',
              email: log.actor?.email || 'unknown@example.com',
              role: log.actor?.role || 'unknown'
            }
          };
          return auditLog;
        });

        setAuditLogs(transformedLogs);
        setStats(statsData);
        setLastUpdated(new Date());
      } catch (err) {
        logger.error('Error fetching audit data', err instanceof Error ? err : new Error(String(err)));
        setError(err instanceof Error ? err.message : 'Failed to load audit data');
      } finally {
        setLoading(false);
      }
    } catch (err) {
      logger.error('Error fetching audit data', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, currentPage, itemsPerPage]);

  // Fetch all data including metadata and dashboard summary
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchAuditData(),
      fetchMetadataCategories(),
      fetchDashboardSummary(),
    ]);
  }, [fetchAuditData, fetchMetadataCategories, fetchDashboardSummary]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchAllData();
    } catch (err) {
      logger.error('Error refreshing data', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to refresh audit data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewLogDetails = async (log: AuditLog) => {
    setSelectedLog(log);
    // Fetch full details
    const logId = log.auditId || log.id || log._id;
    if (logId) {
      const fullDetails = await fetchLogDetails(logId);
      if (fullDetails) {
        setSelectedLog(fullDetails);
      }
    }
  };



  const exportData = async (format: 'csv' | 'json') => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('startDate', filters.dateRange.start);
      queryParams.set('endDate', filters.dateRange.end);
      queryParams.set('format', format);
      
      // Add other filters
      if (filters.user) queryParams.set('user', filters.user);
      if (filters.action) queryParams.set('action', filters.action);
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.severity) queryParams.set('severity', filters.severity);
      if (filters.status) queryParams.set('status', filters.status);
      if (filters.search) queryParams.set('search', filters.search);

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'auditLogsExportData' as keyof typeof API_ENDPOINTS,
        { method: 'GET', query: Object.fromEntries(queryParams) }
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      logger.error('Error exporting data', err instanceof Error ? err : new Error(String(err)), { format });
      setError(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Lock className="w-4 h-4" />;
      case 'authorization': return <Shield className="w-4 h-4" />;
      case 'data_access': return <Eye className="w-4 h-4" />;
      case 'data_modification': return <Edit className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes('login')) return <Lock className="w-4 h-4" />;
    if (action.toLowerCase().includes('logout')) return <Unlock className="w-4 h-4" />;
    if (action.toLowerCase().includes('create')) return <Plus className="w-4 h-4" />;
    if (action.toLowerCase().includes('delete')) return <Trash2 className="w-4 h-4" />;
    if (action.toLowerCase().includes('update')) return <Edit className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const handleSort = (field: 'timestamp' | 'user' | 'action' | 'severity') => {
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
      user: '',
      action: '',
      category: '',
      severity: '',
      status: '',
      search: ''
    });
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Loading 
        size="xl" 
        text="Loading audit logs..." 
        fullScreen={true}
        variant="default"
      />
    );
  }

  if (error) {
    return (
      <AdminErrorState 
        error={error}
        onRetry={fetchAuditData}
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
            Audit Logs
          </h1>
          <p className="text-gray-600 text-sm">Monitor system activity and security events</p>
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

      {/* Dashboard Summary - Recent Logs */}
      {dashboardSummary.recentLogs && dashboardSummary.recentLogs.length > 0 && (
        <div className="bg-white rounded shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardSummary.recentLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewLogDetails(log)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 truncate">{log.action} - {log.resource}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Logs</p>
              <p className="text-lg font-bold text-gray-900">
                {dashboardSummary.totalLogs?.toLocaleString() || stats?.totalLogs?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500">
                {dashboardSummary.todayLogs || stats?.todayLogs || 0} today
              </p>
            </div>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Critical Alerts</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.criticalAlerts || 0}
              </p>
              <p className="text-xs text-gray-500">
                Requires attention
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
                {(stats?.criticalAlerts || 0) === 0 ? 'Good' : 'Alert'}
              </p>
              <p className="text-xs text-gray-500">
                {(stats?.criticalAlerts || 0) === 0 ? 'All systems normal' : 'Issues detected'}
              </p>
            </div>
            <Shield className="w-5 h-5 text-purple-600" />
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
                <input
                  type="text"
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  placeholder="Search by action..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {(metadataCategories.categories && metadataCategories.categories.length > 0
                    ? metadataCategories.categories
                    : ['authentication', 'authorization', 'data_access', 'data_modification', 'system', 'security']
                  ).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="info">Info</option>
                </select>
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
                {auditLogs.length} logs found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Audit Logs</h3>
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
                onClick={() => handleSort('user')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'user' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                User
                {sortBy === 'user' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('action')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'action' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Action
                {sortBy === 'action' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('severity')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'severity' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Severity
                {sortBy === 'severity' && (
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 text-gray-400 mr-1" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6">
                        <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-2">
                        <div className="text-xs font-medium text-gray-900">
                          {log.user?.name || log.target?.name || log.actor?.email?.split('@')[0] || 'Unknown User'}
                        </div>
                        <div className="text-xs text-gray-500">{log.user?.email || log.actor?.email || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{log.user?.role || log.actor?.role || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      {getActionIcon(log.action)}
                      <span className="ml-1 text-xs text-gray-900">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {log.target?.name || log.target?.type || log.resource || 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      {getCategoryIcon(log.category)}
                      <span className="ml-1 text-xs text-gray-900 capitalize">{log.category.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      log.status || (log.response?.success ? 'success' : (log.response?.statusCode && log.response.statusCode >= 400 ? 'error' : 'info'))
                    )}`}>
                      {log.status || (log.response?.success ? 'success' : (log.response?.statusCode && log.response.statusCode >= 400 ? 'error' : 'info'))}
                    </span>
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

        {auditLogs.length === 0 && (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No audit logs found</h3>
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
                    <label className="block text-xs font-medium text-gray-700">Severity</label>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedLog.severity)}`}>
                      {selectedLog.severity}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Actor</label>
                  <div className="mt-1">
                    <p className="text-xs text-gray-900">
                      {selectedLog.user?.name || selectedLog.target?.name || selectedLog.actor?.email?.split('@')[0] || 'Unknown'} 
                      ({selectedLog.user?.email || selectedLog.actor?.email || 'N/A'})
                    </p>
                    <p className="text-xs text-gray-500">Role: {selectedLog.user?.role || selectedLog.actor?.role || 'N/A'}</p>
                    {selectedLog.actor?.ip && (
                      <p className="text-xs text-gray-500">IP: {selectedLog.actor.ip}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Action</label>
                  <p className="text-xs text-gray-900">{selectedLog.action}</p>
                </div>

                {selectedLog.target && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Target</label>
                    <div className="mt-1">
                      <p className="text-xs text-gray-900">
                        {selectedLog.target.type} - {selectedLog.target.name || selectedLog.target.id}
                      </p>
                      {selectedLog.target.description && (
                        <p className="text-xs text-gray-500">{selectedLog.target.description}</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700">Description</label>
                  <p className="text-xs text-gray-900">{selectedLog.description || selectedLog.details || 'No description'}</p>
                </div>

                {selectedLog.request && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Request</label>
                    <div className="mt-1 text-xs text-gray-900 bg-gray-50 p-2 rounded">
                      <p><span className="font-medium">{selectedLog.request.method || 'N/A'}</span> {selectedLog.request.url || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {selectedLog.response && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Response</label>
                    <div className="mt-1 text-xs text-gray-900 bg-gray-50 p-2 rounded">
                      <p>Status: {selectedLog.response.statusCode || 'N/A'}</p>
                      {selectedLog.response.message && (
                        <p>Message: {selectedLog.response.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Metadata</label>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">IP Address</label>
                    <p className="text-xs text-gray-900">{selectedLog.actor?.ip || selectedLog.ipAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Session ID</label>
                    <p className="text-xs text-gray-900 font-mono">{selectedLog.actor?.sessionId || selectedLog.sessionId || 'N/A'}</p>
                  </div>
                </div>

                {selectedLog.changes && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Changes</label>
                    <div className="mt-1">
                      {selectedLog.changes.fields && Array.isArray(selectedLog.changes.fields) && (
                        <div className="text-xs text-gray-900 bg-gray-50 p-2 rounded">
                          <p className="font-medium">Modified Fields:</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedLog.changes.fields.map((field: string, index: number) => (
                              <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {Object.keys(selectedLog.changes).filter(key => key !== 'fields').length > 0 && (
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 mt-2">
                          {JSON.stringify(selectedLog.changes, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700">User Agent</label>
                  <p className="text-xs text-gray-900 break-all">{selectedLog.actor?.userAgent || selectedLog.userAgent || 'N/A'}</p>
                </div>

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
    </div>
  );
}
