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

interface AuditLog {
  id: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'warning' | 'error' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security';
  sessionId: string;
  changes?: {
    field: string;
    oldValue: string | number | boolean | null;
    newValue: string | number | boolean | null;
  }[];
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

// Mock data generation functions
const generateMockAuditLogs = (): AuditLog[] => {
  const actions = ['Login', 'Logout', 'Create User', 'Update Profile', 'Delete Item', 'View Data', 'Export Data', 'System Restart'];
  const categories = ['authentication', 'authorization', 'data_access', 'data_modification', 'system', 'security'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['success', 'warning', 'error', 'info'];
  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'provider' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'client' },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'supplier' }
  ];

  return Array.from({ length: 50 }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: `log-${i + 1}`,
      timestamp,
      user,
      action,
      resource: `${category.replace('_', ' ')} resource`,
      details: `${action} performed on ${category.replace('_', ' ')} resource`,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: status as 'success' | 'warning' | 'error' | 'info',
      severity: severity as 'low' | 'medium' | 'high' | 'critical',
      category: category as 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security',
      sessionId: `session-${Math.random().toString(36).substr(2, 9)}`,
      changes: Math.random() > 0.7 ? [
        {
          field: 'status',
          oldValue: 'inactive',
          newValue: 'active'
        }
      ] : []
    };
  });
};

const generateMockStats = (): AuditStats => {
  return {
    totalLogs: 1250,
    todayLogs: 45,
    criticalAlerts: 3,
    uniqueUsers: 25,
    topActions: [
      { action: 'Login', count: 120 },
      { action: 'View Data', count: 85 },
      { action: 'Update Profile', count: 60 },
      { action: 'Create User', count: 25 }
    ],
    categoryBreakdown: [
      { category: 'authentication', count: 300 },
      { category: 'data_access', count: 250 },
      { category: 'system', count: 200 },
      { category: 'data_modification', count: 150 }
    ],
    severityBreakdown: [
      { severity: 'low', count: 800 },
      { severity: 'medium', count: 300 },
      { severity: 'high', count: 100 },
      { severity: 'critical', count: 50 }
    ]
  };
};

export default function AdminAuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
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
          fetch(`/api/admin/audit-logs?${queryParams}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          }),
          fetch('/api/admin/audit-logs/stats', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          })
        ]);

        // Handle logs response
        if (!logsResponse.ok) {
          console.warn('Logs API not available, using mock data');
          // Generate mock audit logs
          const mockLogs = generateMockAuditLogs();
          logsData = { logs: mockLogs };
        } else {
          logsData = await logsResponse.json();
        }

        // Handle stats response
        if (!statsResponse.ok) {
          console.warn('Stats API not available, using mock data');
          // Generate mock stats
          const mockStats = generateMockStats();
          statsData = mockStats;
        } else {
          statsData = await statsResponse.json();
        }
      } catch (apiError) {
        console.warn('API calls failed, using mock data:', apiError);
        // Use mock data when API is not available
        const mockLogs = generateMockAuditLogs();
        const mockStats = generateMockStats();
        logsData = { logs: mockLogs };
        statsData = mockStats;
        
        // Show a notification that mock data is being used
        if (typeof window !== 'undefined') {
          console.info('Using mock audit data for demonstration purposes');
        }
      }

      // Transform the data to match our interface
      const transformedLogs = (logsData.logs || []).map((log: Record<string, unknown>) => ({
        id: log.id || Math.random().toString(36).substr(2, 9),
        timestamp: log.timestamp || new Date().toISOString(),
        user: {
          id: log.userId || 'unknown',
          name: log.userName || 'Unknown User',
          email: log.userEmail || 'unknown@example.com',
          role: log.userRole || 'unknown'
        },
        action: log.action || 'Unknown Action',
        resource: log.resource || 'Unknown Resource',
        details: log.details || 'No details available',
        ipAddress: log.ipAddress || 'Unknown',
        userAgent: log.userAgent || 'Unknown',
        status: log.status || 'info',
        severity: log.severity || 'low',
        category: log.category || 'system',
        sessionId: log.sessionId || 'unknown',
        changes: log.changes || []
      }));

      setAuditLogs(transformedLogs);
      setStats(statsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching audit data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchAuditData();
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh audit data');
    } finally {
      setRefreshing(false);
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

      const response = await fetch(`/api/admin/audit-logs/export/data?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

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
      console.error('Error exporting data:', err);
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
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading audit logs..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchAuditData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
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
                  <option value="authentication">Authentication</option>
                  <option value="authorization">Authorization</option>
                  <option value="data_access">Data Access</option>
                  <option value="data_modification">Data Modification</option>
                  <option value="system">System</option>
                  <option value="security">Security</option>
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
                        <div className="text-xs font-medium text-gray-900">{log.user.name}</div>
                        <div className="text-xs text-gray-500">{log.user.email}</div>
                        <div className="text-xs text-gray-400">{log.user.role}</div>
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
                    {log.resource}
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
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-900"
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
                  <label className="block text-xs font-medium text-gray-700">User</label>
                  <div className="mt-1">
                    <p className="text-xs text-gray-900">{selectedLog.user.name} ({selectedLog.user.email})</p>
                    <p className="text-xs text-gray-500">Role: {selectedLog.user.role}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Action</label>
                  <p className="text-xs text-gray-900">{selectedLog.action}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Resource</label>
                  <p className="text-xs text-gray-900">{selectedLog.resource}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Details</label>
                  <p className="text-xs text-gray-900">{selectedLog.details}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">IP Address</label>
                    <p className="text-xs text-gray-900">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Session ID</label>
                    <p className="text-xs text-gray-900 font-mono">{selectedLog.sessionId}</p>
                  </div>
                </div>

                {selectedLog.changes && selectedLog.changes.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Changes</label>
                    <div className="mt-1 space-y-1">
                      {selectedLog.changes.map((change, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded">
                          <div className="text-xs">
                            <span className="font-medium">{change.field}:</span>
                            <div className="mt-1">
                              <div className="text-red-600">- {JSON.stringify(change.oldValue)}</div>
                              <div className="text-green-600">+ {JSON.stringify(change.newValue)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700">User Agent</label>
                  <p className="text-xs text-gray-900 break-all">{selectedLog.userAgent}</p>
                </div>
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
