"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Globe,
  BarChart3,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";

// ErrorTracking entity interface matching the docs
interface ErrorTracking {
  _id?: string;
  errorId: string;
  errorType: "application" | "database" | "external_api" | "validation" | "authentication" | "authorization" | "rate_limit" | "payment" | "other";
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  stack?: string;
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, unknown>;
    body?: Record<string, unknown>;
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  };
  user?: {
    userId?: string;
    email?: string;
    role?: string;
  };
  environment?: string;
  metadata?: Record<string, unknown>;
  resolved: boolean;
  resolvedAt?: string | Date;
  resolvedBy?: string;
  resolution?: string;
  occurrences: number;
  firstOccurred: string | Date;
  lastOccurred: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface ErrorStats {
  total?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
  resolved?: number;
  unresolved?: number;
  todayCount?: number;
  weekCount?: number;
  byType?: Array<{ type: string; count: number }>;
  bySeverity?: Array<{ severity: string; count: number }>;
}

interface DashboardSummary {
  totalErrors?: number;
  unresolvedErrors?: number;
  criticalErrors?: number;
  recentErrors?: ErrorTracking[];
  errorTrends?: Array<{ date: string; count: number }>;
  topErrors?: ErrorTracking[];
}

interface ErrorMonitoringInfo {
  service?: string;
  status?: string;
  enabled?: boolean;
  version?: string;
  features?: string[];
  [key: string]: unknown;
}

export default function ErrorMonitoringPage() {
  const [errors, setErrors] = useState<ErrorTracking[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<ErrorTracking[]>([]);
  const [stats, setStats] = useState<ErrorStats>({});
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary>({});
  const [monitoringInfo, setMonitoringInfo] = useState<ErrorMonitoringInfo>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<ErrorTracking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolving, setResolving] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch error monitoring info (public endpoint)
  const fetchMonitoringInfo = useCallback(async () => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.errorMonitoring}`;
      const response = await fetch(url, { method: "GET" });

      if (!response.ok) {
        // Handle 404 gracefully - endpoint might not be implemented
        if (response.status === 404) {
          logger.warn("Error monitoring info endpoint not found");
          return;
        }
        logger.warn("Error monitoring info endpoint not available", { status: response.status });
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        setMonitoringInfo(result.data);
      } else if (result.enabled !== undefined || result.status) {
        // Handle case where data is at root level
        setMonitoringInfo(result);
      }
    } catch (err) {
      // Silently handle errors for monitoring info - it's not critical
      logger.warn("Error fetching monitoring info", { error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  // Fetch dashboard summary
  const fetchDashboardSummary = useCallback(async () => {
    try {
      if (!getApiToken()) {
        return; // Silently fail if no auth
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.errorMonitoringDashboardSummary}`;
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        // Handle 404 gracefully
        if (response.status === 404) {
          logger.warn("Dashboard summary endpoint not found");
          return;
        }
        logger.warn("Dashboard summary endpoint not available", { status: response.status });
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        setDashboardSummary(result.data);
      }
    } catch (err) {
      // Silently handle errors for dashboard summary - it's not critical
        logger.warn("Error fetching dashboard summary", { error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  // Fetch error statistics
  const fetchStats = useCallback(async () => {
    try {
      if (!getApiToken()) {
        return; // Silently fail if no auth
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.errorMonitoringStats}`;
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        // Handle 404 gracefully
        if (response.status === 404) {
          logger.warn("Error monitoring stats endpoint not found");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        logger.warn("Error fetching stats", { status: response.status, error: errorData.message });
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      // Silently handle errors for stats - it's not critical
      logger.warn("Error fetching stats", { error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  // Fetch unresolved errors
  const fetchUnresolvedErrors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        throw new Error("Authentication required");
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.errorMonitoringUnresolved}`;
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn("Error monitoring endpoint not found - backend route may not be implemented yet");
          setErrors([]);
          setFilteredErrors([]);
          setError("Error monitoring API endpoint not available. The backend route may not be implemented yet.");
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch errors: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        const errorsData = Array.isArray(result.data) ? result.data : (result.data?.errors || []);
        setErrors(errorsData);
        setFilteredErrors(errorsData);
      } else {
        throw new Error(result.message || "Failed to fetch errors");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (!errorMessage.includes("404") && !errorMessage.includes("not found")) {
        logger.error("Error fetching unresolved errors", err instanceof Error ? err : new Error(errorMessage));
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch error details
  const fetchErrorDetails = useCallback(async (errorId: string) => {
    try {
      if (!getApiToken()) {
        throw new Error("Authentication required");
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.errorMonitoringById}/${errorId}`;
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch error details: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || "Failed to fetch error details");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching error details", err instanceof Error ? err : new Error(errorMessage));
      throw err;
    }
  }, []);

  // Resolve error
  const resolveError = useCallback(async (errorId: string, resolution: string) => {
    try {
      setResolving(true);
      if (!getApiToken()) {
        throw new Error("Authentication required");
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.errorMonitoringResolve}/${errorId}/resolve`;
      const response = await fetch(url, {
        ...createAuthFetchOptions({ method: "PATCH" }),
        headers: {
          ...createAuthFetchOptions().headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolution }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to resolve error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        toast.success("Error resolved successfully");
        setShowResolveModal(false);
        setResolutionNote("");
        setSelectedError(null);
        await Promise.all([fetchUnresolvedErrors(), fetchStats(), fetchDashboardSummary(), fetchMonitoringInfo()]);
      } else {
        throw new Error(result.message || "Failed to resolve error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error resolving error", err instanceof Error ? err : new Error(errorMessage));
      toast.error(errorMessage);
    } finally {
      setResolving(false);
    }
  }, [fetchUnresolvedErrors, fetchStats, fetchDashboardSummary, fetchMonitoringInfo]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchUnresolvedErrors(),
      fetchStats(),
      fetchDashboardSummary(),
      fetchMonitoringInfo(),
    ]);
  }, [fetchUnresolvedErrors, fetchStats, fetchDashboardSummary, fetchMonitoringInfo]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Filter errors
  useEffect(() => {
    let filtered = errors;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (err) =>
          err.message?.toLowerCase().includes(searchLower) ||
          err.errorId?.toLowerCase().includes(searchLower) ||
          err.user?.email?.toLowerCase().includes(searchLower) ||
          err.request?.url?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedSeverity !== "all") {
      filtered = filtered.filter((err) => err.severity === selectedSeverity);
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((err) => err.errorType === selectedType);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((err) =>
        selectedStatus === "resolved" ? err.resolved : !err.resolved
      );
    }

    if (selectedEnvironment !== "all") {
      filtered = filtered.filter((err) => err.environment === selectedEnvironment);
    }

    setFilteredErrors(filtered);
  }, [errors, searchTerm, selectedSeverity, selectedType, selectedStatus, selectedEnvironment]);

  const handleViewDetails = async (error: ErrorTracking) => {
    try {
      setSelectedError(error);
      // Fetch full details if needed
      const fullDetails = await fetchErrorDetails(error.errorId);
      setSelectedError(fullDetails);
      setShowDetailModal(true);
    } catch {
      // If fetch fails, still show the error we have
      setSelectedError(error);
      setShowDetailModal(true);
    }
  };

  const handleResolve = (error: ErrorTracking) => {
    setSelectedError(error);
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async () => {
    if (!selectedError) return;
    await resolveError(selectedError.errorId, resolutionNote);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "database":
        return "bg-purple-100 text-purple-800";
      case "validation":
        return "bg-yellow-100 text-yellow-800";
      case "authentication":
        return "bg-red-100 text-red-800";
      case "payment":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: string | Date | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const exportErrors = () => {
    const csvContent = [
      ["Error ID", "Type", "Severity", "Message", "Occurrences", "First Occurred", "Last Occurred", "Status", "Environment"].join(","),
      ...filteredErrors.map((err) =>
        [
          err.errorId,
          err.errorType,
          err.severity,
          `"${err.message?.replace(/"/g, '""') || ""}"`,
          err.occurrences,
          formatTimestamp(err.firstOccurred),
          formatTimestamp(err.lastOccurred),
          err.resolved ? "Resolved" : "Unresolved",
          err.environment || "N/A",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `errors-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Errors exported successfully");
  };

  if (loading && errors.length === 0) {
    return <Loading size="xl" text="Loading error monitoring data..." fullScreen={true} variant="default" />;
  }

  if (error && errors.length === 0) {
    return <AdminErrorState error={error} onRetry={fetchAllData} retryText="Try Again" />;
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Error Monitoring</h1>
          <p className="text-gray-600 text-sm">Monitor and manage application errors</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {monitoringInfo.status && (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              monitoringInfo.status === 'active' || monitoringInfo.status === 'enabled' 
                ? 'bg-green-100 text-green-800' 
                : monitoringInfo.status === 'inactive' || monitoringInfo.status === 'disabled'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {monitoringInfo.status.charAt(0).toUpperCase() + monitoringInfo.status.slice(1)}
            </span>
          )}
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Monitoring Info Banner */}
      {(monitoringInfo.service || monitoringInfo.status || monitoringInfo.enabled !== undefined || monitoringInfo.version || Object.keys(monitoringInfo).length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xs font-medium text-blue-900 mb-1">
                {monitoringInfo.service || "Error Monitoring System"}
              </h3>
              <div className="flex flex-wrap gap-3 text-xs text-blue-700">
                {monitoringInfo.status && (
                  <span className="flex items-center">
                    Status: <span className={`ml-1 font-medium ${
                      monitoringInfo.status === 'active' || monitoringInfo.status === 'enabled' 
                        ? 'text-green-700' 
                        : monitoringInfo.status === 'inactive' || monitoringInfo.status === 'disabled'
                        ? 'text-red-700'
                        : 'text-blue-700'
                    }`}>
                      {monitoringInfo.status.charAt(0).toUpperCase() + monitoringInfo.status.slice(1)}
                    </span>
                  </span>
                )}
                {monitoringInfo.enabled !== undefined && !monitoringInfo.status && (
                  <span className="flex items-center">
                    Status: <span className={`ml-1 font-medium ${monitoringInfo.enabled ? 'text-green-700' : 'text-red-700'}`}>
                      {monitoringInfo.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </span>
                )}
                {monitoringInfo.version && (
                  <span>Version: {monitoringInfo.version}</span>
                )}
              </div>
              {monitoringInfo.features && monitoringInfo.features.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {monitoringInfo.features.map((feature, idx) => (
                    <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Errors</p>
              <p className="text-lg font-bold text-gray-900">
                {dashboardSummary.totalErrors?.toLocaleString() || stats.total?.toLocaleString() || "0"}
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
                {dashboardSummary.criticalErrors || stats.critical || 0}
              </p>
              <p className="text-xs text-gray-500">Requires attention</p>
            </div>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Unresolved</p>
              <p className="text-lg font-bold text-gray-900">
                {dashboardSummary.unresolvedErrors || stats.unresolved || 0}
              </p>
              <p className="text-xs text-gray-500">Active issues</p>
            </div>
            <AlertCircle className="w-5 h-5 text-orange-600" />
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
                {stats.weekCount || 0} this week
              </p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      {/* Recent Errors & Top Errors from Dashboard Summary */}
      {((dashboardSummary.recentErrors && dashboardSummary.recentErrors.length > 0) || 
        (dashboardSummary.topErrors && dashboardSummary.topErrors.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardSummary.recentErrors && dashboardSummary.recentErrors.length > 0 && (
            <div className="bg-white rounded shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Recent Errors</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {dashboardSummary.recentErrors.slice(0, 5).map((error) => (
                  <div
                    key={error.errorId}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDetails(error)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900 truncate">{error.message}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(error.severity)}`}>
                            {error.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">{formatTimestamp(error.lastOccurred)}</span>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboardSummary.topErrors && dashboardSummary.topErrors.length > 0 && (
            <div className="bg-white rounded shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Top Errors by Occurrences</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {dashboardSummary.topErrors.slice(0, 5).map((error) => (
                  <div
                    key={error.errorId}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDetails(error)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900 truncate">{error.message}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(error.severity)}`}>
                            {error.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-700 font-medium">
                            <BarChart3 className="w-3 h-3 inline mr-1" />
                            {error.occurrences} occurrences
                          </span>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                {showFilters ? "Hide" : "Show"} Filters
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search errors..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="application">Application</option>
                  <option value="database">Database</option>
                  <option value="validation">Validation</option>
                  <option value="authentication">Authentication</option>
                  <option value="authorization">Authorization</option>
                  <option value="payment">Payment</option>
                  <option value="external_api">External API</option>
                  <option value="rate_limit">Rate Limit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="resolved">Resolved</option>
                  <option value="unresolved">Unresolved</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSeverity("all");
                  setSelectedType("all");
                  setSelectedStatus("all");
                  setSelectedEnvironment("all");
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occurrences</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredErrors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500 text-xs">
                    <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No errors found</h3>
                    <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredErrors.map((error) => (
                  <tr key={error.errorId} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                        {formatTimestamp(error.lastOccurred)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(error.severity)}`}>
                        {error.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(error.errorType)}`}>
                        {error.errorType.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate" title={error.message}>
                      {error.message}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                      <div className="flex items-center">
                        <BarChart3 className="w-3 h-3 mr-1 text-gray-500" />
                        {error.occurrences}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {error.user?.email ? (
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1 text-gray-400" />
                          {error.user.email}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          error.resolved
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {error.resolved ? "RESOLVED" : "UNRESOLVED"}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(error)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        {!error.resolved && (
                          <button
                            onClick={() => handleResolve(error)}
                            className="text-green-600 hover:text-green-900"
                            title="Resolve"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Detail Modal */}
      {showDetailModal && selectedError && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedError(null);
          }}
          title="Error Details"
          size="xl"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Error ID</label>
                <p className="text-xs text-gray-900 font-mono">{selectedError.errorId}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(selectedError.severity)}`}>
                  {selectedError.severity.toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
              <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded">{selectedError.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedError.errorType)}`}>
                  {selectedError.errorType.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Environment</label>
                <p className="text-xs text-gray-900">{selectedError.environment || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Occurrences</label>
                <p className="text-xs text-gray-900">{selectedError.occurrences}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedError.resolved
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedError.resolved ? "RESOLVED" : "UNRESOLVED"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Occurred</label>
                <p className="text-xs text-gray-900">{formatTimestamp(selectedError.firstOccurred)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Occurred</label>
                <p className="text-xs text-gray-900">{formatTimestamp(selectedError.lastOccurred)}</p>
              </div>
            </div>

            {selectedError.user && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">User</label>
                <div className="text-xs text-gray-900">
                  {selectedError.user.email && (
                    <div className="flex items-center mb-1">
                      <User className="w-3 h-3 mr-1" />
                      {selectedError.user.email}
                    </div>
                  )}
                  {selectedError.user.role && (
                    <span className="text-gray-600">Role: {selectedError.user.role}</span>
                  )}
                </div>
              </div>
            )}

            {selectedError.request && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Request</label>
                <div className="text-xs text-gray-900 bg-gray-50 p-2 rounded space-y-1">
                  {selectedError.request.method && selectedError.request.url && (
                    <div>
                      <span className="font-medium">{selectedError.request.method}</span> {selectedError.request.url}
                    </div>
                  )}
                  {selectedError.request.ip && (
                    <div>
                      <Globe className="w-3 h-3 inline mr-1" />
                      IP: {selectedError.request.ip}
                    </div>
                  )}
                  {selectedError.request.userAgent && (
                    <div className="truncate" title={selectedError.request.userAgent}>
                      User Agent: {selectedError.request.userAgent}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedError.stack && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Stack Trace</label>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-48">
                  {selectedError.stack}
                </pre>
              </div>
            )}

            {selectedError.resolution && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Resolution</label>
                <p className="text-xs text-gray-900 bg-green-50 p-2 rounded">{selectedError.resolution}</p>
                {selectedError.resolvedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Resolved at: {formatTimestamp(selectedError.resolvedAt)}
                  </p>
                )}
              </div>
            )}

            {selectedError.metadata && Object.keys(selectedError.metadata).length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Metadata</label>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32">
                  {JSON.stringify(selectedError.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t">
              {!selectedError.resolved && (
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleResolve(selectedError);
                  }}
                  className="text-xs"
                  variant="default"
                >
                  Resolve Error
                </Button>
              )}
              <Button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedError(null);
                }}
                className="text-xs"
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Resolve Error Modal */}
      {showResolveModal && selectedError && (
        <Modal
          isOpen={showResolveModal}
          onClose={() => {
            setShowResolveModal(false);
            setSelectedError(null);
            setResolutionNote("");
          }}
          title="Resolve Error"
          size="lg"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Error</label>
              <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded">{selectedError.message}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Resolution Notes <span className="text-gray-500">(optional)</span>
              </label>
              <Textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe how this error was resolved..."
                className="text-xs"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedError(null);
                  setResolutionNote("");
                }}
                className="text-xs"
                variant="secondary"
                disabled={resolving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolveSubmit}
                className="text-xs"
                variant="default"
                disabled={resolving}
              >
                {resolving ? "Resolving..." : "Resolve Error"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
