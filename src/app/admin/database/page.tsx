"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Database, 
  RefreshCw,
  Activity,
  HardDrive,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Server,
  Search,
  Layers,
  TrendingUp,
  Settings,
  Download,
  Trash2,
  Play,
  RotateCcw,
  Archive,
  FileUp,
  ChevronDown,
  ChevronRight,
  Eye
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";

// Type definitions
interface DatabaseStats {
  totalDocuments: number;
  totalSize: string;
  avgObjSize: string;
  collections: number;
  indexes: number;
  dataSize: string;
  storageSize: string;
  indexSize: string;
}

interface CollectionStats {
  name: string;
  count: number;
  size: string;
  avgObjSize: string;
  storageSize: string;
  indexes: number;
  indexSize: string;
  capped: boolean;
}

interface ConnectionStats {
  current: number;
  available: number;
  totalCreated: number;
  active: number;
  awaiting: number;
  exhausted: number;
}

interface QueryStats {
  totalQueries: number;
  avgExecutionTime: string;
  slowQueries: number;
  failedQueries: number;
  queriesPerSecond: number;
  cacheHitRate: number;
}

interface SlowQuery {
  query: string;
  collection: string;
  executionTime: string;
  timestamp: string;
  documentsExamined: number;
  documentsReturned: number;
}

interface IndexRecommendation {
  collection: string;
  suggestedIndex: string;
  reason: string;
  expectedImprovement: string;
  priority: 'high' | 'medium' | 'low';
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  latency: string;
  replicaSet: string;
  uptime: string;
  connections: {
    status: string;
    percentage: number;
  };
  storage: {
    status: string;
    percentage: number;
  };
}

interface OptimizationReport {
  score: number;
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  recommendations: IndexRecommendation[];
  unusedIndexes: string[];
  fragmentedCollections: string[];
  missingIndexes: string[];
}

export default function AdminDatabasePage() {
  // State for monitoring data
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [collections, setCollections] = useState<CollectionStats[]>([]);
  const [connections, setConnections] = useState<ConnectionStats | null>(null);
  const [queryStats, setQueryStats] = useState<QueryStats | null>(null);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [recommendations, setRecommendations] = useState<IndexRecommendation[]>([]);
  const [optimizationReport, setOptimizationReport] = useState<OptimizationReport | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'collections' | 'queries' | 'optimization'>('overview');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  
  // Modal states
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<IndexRecommendation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);

  // Fetch all monitoring data
  const fetchMonitoringData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const endpoints = [
        { key: 'stats', endpoint: API_ENDPOINTS.databaseMonitoringStats },
        { key: 'collections', endpoint: API_ENDPOINTS.databaseMonitoringCollections },
        { key: 'connections', endpoint: API_ENDPOINTS.databaseMonitoringConnections },
        { key: 'queries', endpoint: API_ENDPOINTS.databaseMonitoringQueries },
        { key: 'slowQueries', endpoint: API_ENDPOINTS.databaseMonitoringSlowQueries },
        { key: 'health', endpoint: API_ENDPOINTS.databaseMonitoringHealth },
      ];

      const results = await Promise.allSettled(
        endpoints.map(async ({ key, endpoint }) => {
          const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            createAuthFetchOptions({ method: 'GET' })
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch ${key}`);
          }
          const result = await response.json();
          return { key, data: result.data || result };
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { key, data } = result.value;
          switch (key) {
            case 'stats':
              setStats(data);
              break;
            case 'collections':
              // Handle various response structures
              const collectionsData = Array.isArray(data) 
                ? data 
                : data?.collections 
                  ? data.collections 
                  : data?.data 
                    ? (Array.isArray(data.data) ? data.data : [])
                    : [];
              setCollections(collectionsData);
              logger.debug('Collections data received', { count: collectionsData.length, raw: data });
              break;
            case 'connections':
              setConnections(data);
              break;
            case 'queries':
              setQueryStats(data);
              break;
            case 'slowQueries':
              const slowQueriesData = Array.isArray(data) 
                ? data 
                : data?.slowQueries || data?.queries || [];
              setSlowQueries(slowQueriesData);
              break;
            case 'health':
              setHealth(data);
              break;
          }
        } else {
          logger.warn(`Failed to fetch ${(result as PromiseRejectedResult).reason}`);
        }
      });

      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching monitoring data', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch optimization data
  const fetchOptimizationData = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      const [reportRes, recommendationsRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}${API_ENDPOINTS.databaseOptimizationReport}`, createAuthFetchOptions({ method: 'GET' })),
        fetch(`${API_BASE_URL}${API_ENDPOINTS.databaseOptimizationRecommendations}`, createAuthFetchOptions({ method: 'GET' })),
      ]);

      if (reportRes.status === 'fulfilled' && reportRes.value.ok) {
        const result = await reportRes.value.json();
        setOptimizationReport(result.data || result);
      }

      if (recommendationsRes.status === 'fulfilled' && recommendationsRes.value.ok) {
        const result = await recommendationsRes.value.json();
        setRecommendations(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      logger.error('Error fetching optimization data', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();
    fetchOptimizationData();
  }, [fetchMonitoringData, fetchOptimizationData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchMonitoringData(), fetchOptimizationData()]);
      toast.success('Data refreshed successfully');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Action handlers
  const handleResetStats = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.databaseMonitoringReset}`,
        createAuthFetchOptions({ method: 'POST' })
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Endpoint not available');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reset statistics');
      }

      toast.success('Statistics reset successfully');
      setShowResetModal(false);
      await fetchMonitoringData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset statistics';
      logger.warn('Reset stats not available', { error: message });
      if (message === 'Endpoint not available') {
        toast.error('This feature is not yet available on the server');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.databaseOptimizationClearCache}`,
        createAuthFetchOptions({ method: 'POST' })
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Endpoint not available');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to clear cache');
      }

      toast.success('Cache cleared successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear cache';
      logger.warn('Clear cache not available', { error: message });
      if (message === 'Endpoint not available') {
        toast.error('This feature is not yet available on the server');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateIndex = async () => {
    if (!selectedRecommendation) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.databaseOptimizationCreateIndexes}`,
        createAuthFetchOptions({
          method: 'POST',
          body: JSON.stringify({
            collection: selectedRecommendation.collection,
            index: selectedRecommendation.suggestedIndex,
          }),
        })
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Endpoint not available');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create index');
      }

      toast.success('Index created successfully');
      setShowIndexModal(false);
      setSelectedRecommendation(null);
      await fetchOptimizationData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create index';
      logger.warn('Create index not available', { error: message });
      if (message === 'Endpoint not available') {
        toast.error('This feature is not yet available on the server');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackup = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.databaseOptimizationBackup}`,
        createAuthFetchOptions({ method: 'POST' })
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Endpoint not available');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to initiate backup');
      }

      toast.success('Backup initiated successfully');
      setShowBackupModal(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate backup';
      logger.warn('Backup not available', { error: message });
      if (message === 'Endpoint not available') {
        toast.error('This feature is not yet available on the server');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!backupFile) {
      toast.error('Please select a backup file');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('backup', backupFile);

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.databaseOptimizationRestore}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getApiToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Endpoint not available');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to restore database');
      }

      toast.success('Database restore initiated');
      setShowRestoreModal(false);
      setBackupFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore database';
      logger.warn('Restore not available', { error: message });
      if (message === 'Endpoint not available') {
        toast.error('This feature is not yet available on the server');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'healthy': return 'text-emerald-600 bg-emerald-100';
      case 'good': return 'text-sky-600 bg-sky-100';
      case 'warning':
      case 'needs_attention': return 'text-amber-600 bg-amber-100';
      case 'critical': return 'text-rose-600 bg-rose-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'healthy': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'good': return <Activity className="w-4 h-4 text-sky-500" />;
      case 'warning':
      case 'needs_attention': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'critical': return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-rose-700 bg-rose-100 border-rose-200';
      case 'medium': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'low': return 'text-sky-700 bg-sky-100 border-sky-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const toggleCollection = (name: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading database monitoring..." />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Data</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={fetchMonitoringData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-7 h-7 text-indigo-600" />
            Database Management
          </h1>
          <p className="text-slate-600 text-sm mt-1">Monitor performance, optimize queries, and manage database operations</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
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

      {/* Health Status Banner */}
      {health && (
        <div className={`rounded-xl p-4 border ${
          health.status === 'healthy' ? 'bg-emerald-50 border-emerald-200' :
          health.status === 'warning' ? 'bg-amber-50 border-amber-200' :
          'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(health.status)}
              <div>
                <p className="font-semibold text-slate-900">Database Status: {health.status.toUpperCase()}</p>
                <p className="text-sm text-slate-600">
                  Latency: {health.latency} • Uptime: {health.uptime} • Replica Set: {health.replicaSet || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-500">Connections</p>
                <p className={`text-sm font-semibold ${health.connections.percentage > 80 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {health.connections.percentage}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Storage</p>
                <p className={`text-sm font-semibold ${health.storage.percentage > 80 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {health.storage.percentage}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'collections', label: 'Collections', icon: Layers },
            { id: 'queries', label: 'Queries', icon: Search },
            { id: 'optimization', label: 'Optimization', icon: Zap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <HardDrive className="w-4 h-4" />
                <span className="text-xs font-medium">Total Size</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{stats?.totalSize || '—'}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-medium">Collections</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{stats?.collections ?? collections.length ?? '—'}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Database className="w-4 h-4" />
                <span className="text-xs font-medium">Documents</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{stats?.totalDocuments?.toLocaleString() || '—'}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Indexes</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{stats?.indexes ?? '—'}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Archive className="w-4 h-4" />
                <span className="text-xs font-medium">Storage Size</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{stats?.storageSize || '—'}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Settings className="w-4 h-4" />
                <span className="text-xs font-medium">Index Size</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{stats?.indexSize || '—'}</p>
            </div>
          </div>

          {/* Connections & Query Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Connection Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-600" />
                  Connection Pool
                </h3>
              </div>
              {connections ? (
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-indigo-600">{connections.current}</p>
                      <p className="text-xs text-slate-500">Current</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-600">{connections.available}</p>
                      <p className="text-xs text-slate-500">Available</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-sky-600">{connections.active}</p>
                      <p className="text-xs text-slate-500">Active</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-600">{connections.totalCreated}</p>
                      <p className="text-xs text-slate-500">Total Created</p>
                    </div>
                  </div>
                  {/* Connection usage bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Connection Usage</span>
                      <span>{connections.available > 0 ? Math.round((connections.current / (connections.current + connections.available)) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${connections.available > 0 ? (connections.current / (connections.current + connections.available)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <Server className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Connection data unavailable</p>
                </div>
              )}
            </div>

            {/* Query Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Query Performance
                </h3>
              </div>
              {queryStats ? (
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900">{queryStats.totalQueries.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Total Queries</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-indigo-600">{queryStats.avgExecutionTime}</p>
                      <p className="text-xs text-slate-500">Avg Execution</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className={`text-2xl font-bold ${queryStats.slowQueries > 10 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {queryStats.slowQueries}
                      </p>
                      <p className="text-xs text-slate-500">Slow Queries</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-600">{queryStats.cacheHitRate}%</p>
                      <p className="text-xs text-slate-500">Cache Hit Rate</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Queries/second:</span>
                    <span className="font-semibold text-slate-900">{queryStats.queriesPerSecond}</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Query stats unavailable</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900">Quick Actions</h3>
            </div>
            <div className="p-4 flex flex-wrap gap-3">
              <button
                onClick={handleClearCache}
                disabled={submitting}
                className="inline-flex items-center px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Clear Cache
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="inline-flex items-center px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset Stats
              </button>
              <button
                onClick={() => setShowBackupModal(true)}
                className="inline-flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Backup
              </button>
              <button
                onClick={() => setShowRestoreModal(true)}
                className="inline-flex items-center px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
              >
                <FileUp className="w-4 h-4 mr-1.5" />
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Collections ({collections.length})</h3>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {collections.length === 0 ? (
              <div className="p-8 text-center">
                <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-900 font-medium mb-1">No collections data available</p>
                <p className="text-slate-500 text-sm mb-4">
                  The database collections endpoint may not be returning data yet.
                </p>
                <p className="text-xs text-slate-400 bg-slate-50 p-2 rounded font-mono">
                  GET /api/database/monitoring/collections
                </p>
              </div>
            ) : (
              collections.map((collection) => (
                <div key={collection.name} className="hover:bg-slate-50 transition-colors">
                  <button
                    onClick={() => toggleCollection(collection.name)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      {expandedCollections.has(collection.name) ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{collection.name}</p>
                        <p className="text-xs text-slate-500">{collection.count.toLocaleString()} documents</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500">{collection.size}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                        {collection.indexes} indexes
                      </span>
                    </div>
                  </button>
                  {expandedCollections.has(collection.name) && (
                    <div className="px-4 pb-3 pl-11">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-xs text-slate-500">Avg Object Size</p>
                          <p className="font-medium text-slate-900">{collection.avgObjSize}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-xs text-slate-500">Storage Size</p>
                          <p className="font-medium text-slate-900">{collection.storageSize}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-xs text-slate-500">Index Size</p>
                          <p className="font-medium text-slate-900">{collection.indexSize}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-xs text-slate-500">Capped</p>
                          <p className="font-medium text-slate-900">{collection.capped ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Queries Tab */}
      {activeTab === 'queries' && (
        <div className="space-y-6">
          {/* Slow Queries */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Slow Queries ({slowQueries.length})
              </h3>
            </div>
            {slowQueries.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-slate-500">No slow queries detected</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {slowQueries.map((query, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                            {query.collection}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            parseFloat(query.executionTime) > 1000 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {query.executionTime}
                          </span>
                        </div>
                        <pre className="text-xs text-slate-600 bg-slate-50 p-2 rounded overflow-x-auto">
                          {query.query}
                        </pre>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <span>Examined: {query.documentsExamined.toLocaleString()}</span>
                          <span>Returned: {query.documentsReturned.toLocaleString()}</span>
                          <span>{new Date(query.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optimization Tab */}
      {activeTab === 'optimization' && (
        <div className="space-y-6">
          {/* Optimization Score */}
          {optimizationReport && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900">Optimization Score</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-200"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * (optimizationReport.score ?? 0)) / 100}
                        className={
                          (optimizationReport.score ?? 0) >= 80 ? 'text-emerald-500' :
                          (optimizationReport.score ?? 0) >= 60 ? 'text-amber-500' : 'text-rose-500'
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900">{optimizationReport.score ?? '—'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(optimizationReport.status || 'unknown')}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(optimizationReport.status || 'unknown')}`}>
                        {(optimizationReport.status || 'unknown').replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Missing indexes: <span className="font-medium text-slate-900">{optimizationReport.missingIndexes?.length ?? 0}</span></p>
                      <p>Unused indexes: <span className="font-medium text-slate-900">{optimizationReport.unusedIndexes?.length ?? 0}</span></p>
                      <p>Fragmented collections: <span className="font-medium text-slate-900">{optimizationReport.fragmentedCollections?.length ?? 0}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Index Recommendations */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                Index Recommendations ({recommendations.length})
              </h3>
            </div>
            {recommendations.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-slate-500">No recommendations at this time</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-slate-900">{rec.collection}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{rec.reason}</p>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                          {rec.suggestedIndex}
                        </code>
                        <p className="text-xs text-emerald-600 mt-2">
                          Expected improvement: {rec.expectedImprovement}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRecommendation(rec);
                          setShowIndexModal(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />
                        Create
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reset Stats Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Performance Statistics"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowResetModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleResetStats}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Resetting...' : 'Reset Statistics'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              This will reset all performance statistics and metrics. This action cannot be undone.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Resetting statistics will clear all query performance data, connection metrics, and monitoring history.
          </p>
        </div>
      </Modal>

      {/* Backup Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Create Database Backup"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowBackupModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBackup}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Backup'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will create a full backup of the database. The backup process may take several minutes depending on database size.
          </p>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Estimated size</p>
            <p className="font-semibold text-slate-900">{stats?.totalSize || 'Unknown'}</p>
          </div>
        </div>
      </Modal>

      {/* Restore Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setBackupFile(null);
        }}
        title="Restore Database"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowRestoreModal(false);
                setBackupFile(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRestore}
              disabled={submitting || !backupFile}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg border border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-sm text-rose-800">
              Warning: This will overwrite the current database with the backup data. This action cannot be undone.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select backup file
            </label>
            <input
              type="file"
              accept=".bson,.gz,.zip"
              onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          {backupFile && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Selected file</p>
              <p className="font-medium text-slate-900 text-sm">{backupFile.name}</p>
              <p className="text-xs text-slate-500">{(backupFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Create Index Modal */}
      <Modal
        isOpen={showIndexModal}
        onClose={() => {
          setShowIndexModal(false);
          setSelectedRecommendation(null);
        }}
        title="Create Index"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowIndexModal(false);
                setSelectedRecommendation(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateIndex}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Index'}
            </button>
          </div>
        }
      >
        {selectedRecommendation && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Collection</p>
              <p className="text-slate-900">{selectedRecommendation.collection}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Index Definition</p>
              <code className="block text-sm bg-slate-100 p-3 rounded-lg text-slate-700 mt-1">
                {selectedRecommendation.suggestedIndex}
              </code>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Reason</p>
              <p className="text-sm text-slate-600">{selectedRecommendation.reason}</p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <Eye className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                Expected improvement: {selectedRecommendation.expectedImprovement}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

