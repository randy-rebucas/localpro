"use client";

import { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'critical';
  message: string;
  stack?: string;
  userId?: string;
  userEmail?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  tags: string[];
  environment: 'development' | 'staging' | 'production';
}

interface ErrorStats {
  total: number;
  critical: number;
  errors: number;
  warnings: number;
  resolved: number;
  unresolved: number;
  todayCount: number;
  weekCount: number;
}

export default function ErrorMonitoringPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats>({
    total: 0,
    critical: 0,
    errors: 0,
    warnings: 0,
    resolved: 0,
    unresolved: 0,
    todayCount: 0,
    weekCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("all");
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchErrorData();
  }, []);

  const fetchErrorData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch error statistics
      const statsResponse = await fetch('/api/admin/error-monitoring/stats');
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch error statistics');
      }
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch unresolved errors
      const errorsResponse = await fetch('/api/admin/error-monitoring/unresolved');
      if (!errorsResponse.ok) {
        throw new Error('Failed to fetch errors');
      }
      const errorsData = await errorsResponse.json();
      if (errorsData.success) {
        setErrors(errorsData.data.errors);
        setFilteredErrors(errorsData.data.errors);
      }
    } catch (err) {
      console.error('Error fetching error data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load error data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = errors;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(error => 
        error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.endpoint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Level filter
    if (selectedLevel !== "all") {
      filtered = filtered.filter(error => error.level === selectedLevel);
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(error => 
        selectedStatus === "resolved" ? error.resolved : !error.resolved
      );
    }

    // Environment filter
    if (selectedEnvironment !== "all") {
      filtered = filtered.filter(error => error.environment === selectedEnvironment);
    }

    setFilteredErrors(filtered);
  }, [errors, searchTerm, selectedLevel, selectedStatus, selectedEnvironment]);


  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportErrors = () => {
    const csvContent = [
      ['ID', 'Timestamp', 'Level', 'Message', 'User', 'Endpoint', 'Status', 'Environment'].join(','),
      ...filteredErrors.map(error => [
        error.id,
        error.timestamp,
        error.level,
        `"${error.message}"`,
        error.userEmail || 'N/A',
        error.endpoint || 'N/A',
        error.resolved ? 'Resolved' : 'Unresolved',
        error.environment
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resolveError = async (errorId: string) => {
    try {
      const response = await fetch(`/api/admin/error-monitoring/${errorId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'resolve' })
      });

      if (!response.ok) {
        throw new Error('Failed to resolve error');
      }

      const result = await response.json();
      if (result.success) {
        // Refresh the error data
        await fetchErrorData();
        setSelectedError(null);
      } else {
        throw new Error(result.error || 'Failed to resolve error');
      }
    } catch (err) {
      console.error('Error resolving error:', err);
      alert(err instanceof Error ? err.message : 'Failed to resolve error');
    }
  };

  const unresolveError = async (errorId: string) => {
    try {
      const response = await fetch(`/api/admin/error-monitoring/${errorId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'unresolve' })
      });

      if (!response.ok) {
        throw new Error('Failed to unresolve error');
      }

      const result = await response.json();
      if (result.success) {
        // Refresh the error data
        await fetchErrorData();
        setSelectedError(null);
      } else {
        throw new Error(result.error || 'Failed to unresolve error');
      }
    } catch (err) {
      console.error('Error unresolving error:', err);
      alert(err instanceof Error ? err.message : 'Failed to unresolve error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading error logs...</p>
        </div>
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
            onClick={fetchErrorData}
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
            Error Monitoring
          </h1>
          <p className="text-gray-600 text-sm">Monitor and manage application errors</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={fetchErrorData}
            disabled={loading}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Errors</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.total?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500">
                {stats.todayCount || 0} today
              </p>
            </div>
            <AlertTriangle className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Critical</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.critical || 0}
              </p>
              <p className="text-xs text-gray-500">
                Requires attention
              </p>
            </div>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Warnings</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.warnings || 0}
              </p>
              <p className="text-xs text-gray-500">
                Non-critical issues
              </p>
            </div>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Resolved</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.resolved || 0}
              </p>
              <p className="text-xs text-gray-500">
                {stats.unresolved || 0} unresolved
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
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
                onClick={exportErrors}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-3 h-3 mr-1" />
                CSV
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search errors..."
                    className="w-full pl-10 pr-3 py-2 text-sm font-medium text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="critical">Critical</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="resolved">Resolved</option>
                  <option value="unresolved">Unresolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Environment</label>
                <select
                  value={selectedEnvironment}
                  onChange={(e) => setSelectedEnvironment(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Environments</option>
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLevel('all');
                  setSelectedStatus('all');
                  setSelectedEnvironment('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {filteredErrors.length} errors found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Logs Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Error Logs</h3>
            <div className="text-xs text-gray-500">
              {filteredErrors.length} errors found
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Environment</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredErrors.map((error) => (
                <tr key={error.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-1">🕐</span>
                      {formatTimestamp(error.timestamp)}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(error.level)}`}>
                      {error.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate">
                    {error.message}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {error.userEmail || 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 capitalize">
                    {error.environment}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      error.resolved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {error.resolved ? 'RESOLVED' : 'UNRESOLVED'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <button
                      onClick={() => setSelectedError(error)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredErrors.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No errors found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-4 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded bg-white">
            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Error Details</h3>
                <div className="flex items-center space-x-2">
                  {selectedError && (
                    <button
                      onClick={() => selectedError.resolved ? unresolveError(selectedError.id) : resolveError(selectedError.id)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        selectedError.resolved 
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {selectedError.resolved ? 'Unresolve' : 'Resolve'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedError(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Timestamp</label>
                    <p className="text-xs text-gray-900">{formatTimestamp(selectedError.timestamp)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Level</label>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(selectedError.level)}`}>
                      {selectedError.level.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Message</label>
                  <p className="text-xs text-gray-900">{selectedError.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedError.resolved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedError.resolved ? 'RESOLVED' : 'UNRESOLVED'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Environment</label>
                    <p className="text-xs text-gray-900 capitalize">{selectedError.environment}</p>
                  </div>
                </div>

                {selectedError.userEmail && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">User</label>
                    <p className="text-xs text-gray-900">{selectedError.userEmail}</p>
                  </div>
                )}

                {selectedError.endpoint && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Endpoint</label>
                    <p className="text-xs text-gray-900">{selectedError.method} {selectedError.endpoint}</p>
                  </div>
                )}

                {selectedError.stack && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Stack Trace</label>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                      {selectedError.stack}
                    </pre>
                  </div>
                )}

                {selectedError.tags.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedError.tags.map((tag, index) => (
                        <span key={index} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedError(null)}
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
