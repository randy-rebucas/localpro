"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Database, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Activity,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { Modal } from "@/components/ui/modal";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";

interface OptimizationRecommendation {
  type: 'index' | 'query' | 'collection';
  collection: string;
  field?: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  estimatedImprovement?: number;
}

interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  averageResponseTime: number;
  queriesByCollection: Record<string, number>;
}

interface CollectionStats {
  name: string;
  documentCount: number;
  size: number;
  indexes: number;
  averageQueryTime: number;
}

interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'critical';
  connections: number | { totalConnections?: number; activeConnections?: number; queuedConnections?: number };
  maxConnections: number;
  activeQueries: number;
  slowQueries: number;
  cacheHitRate: number;
}

interface SlowQuery {
  query?: string;
  collection: string;
  executionTime?: number;
  duration?: number; // API might return 'duration' instead of 'executionTime'
  count?: number;
  lastExecuted?: string;
  timestamp?: string; // API might return 'timestamp' instead of 'lastExecuted'
  operation?: string; // API might include operation field
}

export default function DatabaseOptimizationPage() {
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [queryStats, setQueryStats] = useState<QueryStats | null>(null);
  const [collectionStats, setCollectionStats] = useState<CollectionStats[]>([]);
  const [databaseHealth, setDatabaseHealth] = useState<DatabaseHealth | null>(null);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);

  // Helper function to ensure a query object is properly normalized
  const normalizeQuery = useCallback((q: unknown): SlowQuery | null => {
    if (!q || typeof q !== 'object' || Array.isArray(q)) {
      return null;
    }
    
    const queryObj = q as Record<string, unknown>;
    
    // Helper to safely extract string value, handling nested objects
    const getStringValue = (value: unknown, fallback: string = ''): string => {
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
      if (typeof value === 'boolean') return String(value);
      if (value && typeof value === 'object') {
        // If it's an object, try to stringify it or use fallback
        try {
          return JSON.stringify(value).substring(0, 200); // Limit length
        } catch {
          return fallback;
        }
      }
      return fallback;
    };
    
    // Ensure all values are primitives, not objects
    // Handle case where query field itself might be an object
    let queryString = '';
    if (typeof queryObj.query === 'string') {
      queryString = queryObj.query;
    } else if (typeof queryObj.operation === 'string') {
      queryString = queryObj.operation;
    } else if (queryObj.query && typeof queryObj.query === 'object') {
      queryString = getStringValue(queryObj.query, '');
    }
    
    return {
      query: queryString,
      collection: getStringValue(queryObj.collection, ''),
      executionTime: typeof queryObj.executionTime === 'number' ? queryObj.executionTime : (typeof queryObj.duration === 'number' ? queryObj.duration : 0),
      count: typeof queryObj.count === 'number' ? queryObj.count : 1,
      lastExecuted: getStringValue(queryObj.lastExecuted || queryObj.timestamp, new Date().toISOString())
    };
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'queries' | 'collections'>('overview');
  const [showCreateIndexModal, setShowCreateIndexModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<OptimizationRecommendation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'databaseOptimizationRecommendations' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setRecommendations(Array.isArray(data.data) ? data.data : (data.data.recommendations || []));
        }
      }
    } catch (err) {
      logger.warn('Error fetching recommendations', {
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  const fetchQueryStats = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'databaseOptimizationQueryStats' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setQueryStats(data.data);
        }
      }
    } catch (err) {
      logger.warn('Error fetching query stats', {
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  const fetchCollectionStats = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'databaseOptimizationCollections' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const collections = Array.isArray(data.data) ? data.data : (data.data.collections || []);
          setCollectionStats(collections);
        }
      }
    } catch (err) {
      logger.warn('Error fetching collection stats', {
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  const fetchDatabaseHealth = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'databaseOptimizationHealth' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setDatabaseHealth(data.data);
        }
      }
    } catch (err) {
      logger.warn('Error fetching database health', {
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  const fetchSlowQueries = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'databaseOptimizationSlowQueries' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const queries: unknown[] = Array.isArray(data.data) ? data.data : (data.data.queries || []);
          // Normalize the query data to handle different API response structures
          // Filter out any invalid entries and ensure all values are properly converted
          const normalizedQueries: SlowQuery[] = queries
            .map((q: unknown) => {
              // Double-check: if q is already a SlowQuery but might have object values, re-normalize
              if (q && typeof q === 'object' && !Array.isArray(q)) {
                const qObj = q as Record<string, unknown>;
                // Check if any property is an object (not a primitive)
                const hasObjectValues = Object.values(qObj).some(v => 
                  v !== null && typeof v === 'object' && !Array.isArray(v) && 
                  !(v instanceof Date) && typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean'
                );
                if (hasObjectValues) {
                  // Re-normalize to ensure all values are primitives
                  return normalizeQuery(q);
                }
              }
              return normalizeQuery(q);
            })
            .filter((q: SlowQuery | null): q is SlowQuery => q !== null);
          setSlowQueries(normalizedQueries);
        } else {
          setSlowQueries([]);
        }
      } else {
        setSlowQueries([]);
      }
    } catch (err) {
      logger.warn('Error fetching slow queries', {
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [normalizeQuery]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchRecommendations(),
        fetchQueryStats(),
        fetchCollectionStats(),
        fetchDatabaseHealth(),
        fetchSlowQueries()
      ]);
    } catch (err) {
      logger.error('Error fetching database optimization data', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load database optimization data');
    } finally {
      setLoading(false);
    }
  }, [fetchRecommendations, fetchQueryStats, fetchCollectionStats, fetchDatabaseHealth, fetchSlowQueries]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  const handleCreateIndexes = async () => {
    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'databaseOptimizationCreateIndexes' as keyof typeof API_ENDPOINTS,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommendations: selectedRecommendation ? [selectedRecommendation] : recommendations.filter(r => r.type === 'index')
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to create indexes');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Indexes created successfully');
        setShowCreateIndexModal(false);
        setSelectedRecommendation(null);
        await fetchAllData();
      } else {
        throw new Error(data.message || 'Failed to create indexes');
      }
    } catch (err) {
      logger.error('Error creating indexes', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to create indexes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearCache = async () => {
    try {
      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'databaseOptimizationClearCache' as keyof typeof API_ENDPOINTS,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Cache cleared successfully');
          await fetchAllData();
        }
      }
    } catch (err) {
      logger.error('Error clearing cache', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to clear cache');
    }
  };

  const handleResetStats = async () => {
    if (!confirm('Are you sure you want to reset performance statistics? This action cannot be undone.')) {
      return;
    }

    try {
      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'databaseOptimizationResetStats' as keyof typeof API_ENDPOINTS,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Statistics reset successfully');
          await fetchAllData();
        }
      }
    } catch (err) {
      logger.error('Error resetting stats', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to reset statistics');
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <Loading text="Loading database optimization data..." />;
  }

  if (error) {
    return <AdminErrorState error={error} onRetry={fetchAllData} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Database Optimization</h1>
          <p className="text-xs text-gray-500 mt-0.5">Monitor and optimize database performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearCache}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            <Zap className="w-3 h-3 mr-1" />
            Clear Cache
          </button>
          <button
            onClick={handleResetStats}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset Stats
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Database Health */}
      {databaseHealth && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Database Health</h2>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(databaseHealth.status)}`}>
              {databaseHealth.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-gray-500">Connections</p>
              <p className="text-sm font-semibold text-gray-900">
                {typeof databaseHealth.connections === 'object' && databaseHealth.connections !== null
                  ? (databaseHealth.connections as any).activeConnections ?? 0
                  : databaseHealth.connections ?? 0} / {databaseHealth.maxConnections ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Queries</p>
              <p className="text-sm font-semibold text-gray-900">{databaseHealth.activeQueries ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Slow Queries</p>
              <p className="text-sm font-semibold text-red-600">{databaseHealth.slowQueries ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Cache Hit Rate</p>
              <p className="text-sm font-semibold text-gray-900">{((databaseHealth.cacheHitRate ?? 0) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'recommendations', label: 'Recommendations', icon: AlertTriangle },
            { id: 'queries', label: 'Query Stats', icon: Activity },
            { id: 'collections', label: 'Collections', icon: Database }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center px-3 py-2 border-b-2 text-xs font-medium ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-3 h-3 mr-1" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Query Stats Summary */}
          {queryStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Queries</p>
                    <p className="text-lg font-bold text-gray-900">{(queryStats.totalQueries ?? 0).toLocaleString()}</p>
                  </div>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Slow Queries</p>
                    <p className="text-lg font-bold text-red-600">{queryStats.slowQueries ?? 0}</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Avg Response</p>
                    <p className="text-lg font-bold text-gray-900">{((queryStats.averageResponseTime ?? 0).toFixed(2))}ms</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Recommendations</p>
                    <p className="text-lg font-bold text-yellow-600">{recommendations.length}</p>
                  </div>
                  <Settings className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </div>
          )}

          {/* Top Collections */}
          {collectionStats.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Collections</h3>
              <div className="space-y-2">
                {collectionStats.slice(0, 5).map((collection) => (
                  <div key={collection.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-gray-900">{collection.name}</p>
                      <p className="text-xs text-gray-500">
                        {(collection.documentCount ?? 0).toLocaleString()} documents • {collection.indexes ?? 0} indexes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-900">{((collection.averageQueryTime ?? 0).toFixed(2))}ms</p>
                      <p className="text-xs text-gray-500">avg query time</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-3">
          {recommendations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">No recommendations</p>
              <p className="text-xs text-gray-500 mt-1">Database is optimized</p>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedRecommendation(null);
                    setShowCreateIndexModal(true);
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Create All Indexes
                </button>
              </div>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getImpactColor(rec.impact)}`}>
                            {rec.impact} impact
                          </span>
                          <span className="text-xs text-gray-500">{rec.collection}</span>
                        </div>
                        <p className="text-xs text-gray-700 mb-1">{rec.recommendation}</p>
                        {rec.estimatedImprovement && (
                          <p className="text-xs text-green-600">
                            Estimated improvement: {rec.estimatedImprovement}%
                          </p>
                        )}
                      </div>
                      {rec.type === 'index' && (
                        <button
                          onClick={() => {
                            setSelectedRecommendation(rec);
                            setShowCreateIndexModal(true);
                          }}
                          className="ml-3 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          Create Index
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Query Stats Tab */}
      {activeTab === 'queries' && (
        <div className="space-y-4">
          {queryStats && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Query Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Total Queries</p>
                  <p className="text-lg font-bold text-gray-900">{(queryStats.totalQueries ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Slow Queries</p>
                  <p className="text-lg font-bold text-red-600">{queryStats.slowQueries ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Average Response Time</p>
                  <p className="text-lg font-bold text-gray-900">{((queryStats.averageResponseTime ?? 0).toFixed(2))}ms</p>
                </div>
              </div>
              {queryStats.queriesByCollection && Object.keys(queryStats.queriesByCollection).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Queries by Collection</p>
                  <div className="space-y-1">
                    {Object.entries(queryStats.queriesByCollection)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 10)
                      .map(([collection, count]) => (
                        <div key={collection} className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-600">{collection}</span>
                          <span className="text-xs font-semibold text-gray-900">{count as number}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Slow Queries */}
          {slowQueries.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Slow Queries</h3>
              <div className="space-y-2">
                {slowQueries.slice(0, 10).map((queryItem, index) => {
                  // Safety function to ensure value is always renderable (string/number)
                  const safeString = (val: unknown, fallback: string = ''): string => {
                    if (typeof val === 'string') return val;
                    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
                    if (val && typeof val === 'object') {
                      try {
                        return JSON.stringify(val).substring(0, 200);
                      } catch {
                        return fallback;
                      }
                    }
                    return fallback;
                  };
                  
                  // Re-normalize to ensure we never render objects
                  const normalized = normalizeQuery(queryItem);
                  if (!normalized) {
                    return null; // Skip invalid entries
                  }
                  
                  // Extract all values as primitives with fallbacks - use safeString for extra safety
                  const queryText = safeString(normalized.query, 'N/A');
                  const collectionText = safeString(normalized.collection, 'Unknown');
                  const executionTimeNum = typeof normalized.executionTime === 'number' ? normalized.executionTime : 0;
                  const countNum = typeof normalized.count === 'number' ? normalized.count : 1;
                  const lastExecutedText = safeString(normalized.lastExecuted, '');
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-900">{collectionText}</span>
                        <span className="text-xs font-semibold text-red-600">{executionTimeNum}ms</span>
                      </div>
                      <p className="text-xs text-gray-600 font-mono break-all">{queryText}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">Executed {countNum} times</span>
                        <span className="text-xs text-gray-500">
                          Last: {lastExecutedText ? new Date(lastExecutedText).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Collection</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Indexes</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Query Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {collectionStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-xs text-gray-500">
                      No collection data available
                    </td>
                  </tr>
                ) : (
                  collectionStats.map((collection) => (
                    <tr key={collection.name} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {collection.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                        {(collection.documentCount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                        {((collection.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                        {collection.indexes ?? 0}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                        {((collection.averageQueryTime ?? 0).toFixed(2))}ms
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Index Modal */}
      {showCreateIndexModal && (
        <Modal
          isOpen={showCreateIndexModal}
          onClose={() => {
            setShowCreateIndexModal(false);
            setSelectedRecommendation(null);
          }}
          title={selectedRecommendation ? "Create Index" : "Create All Recommended Indexes"}
          size="md"
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateIndexModal(false);
                  setSelectedRecommendation(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIndexes}
                disabled={submitting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Index(es)'}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            {selectedRecommendation ? (
              <div>
                <p className="text-xs text-gray-700 mb-2">
                  Create index for <strong>{selectedRecommendation.collection}</strong>?
                </p>
                <p className="text-xs text-gray-600">{selectedRecommendation.recommendation}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-700 mb-2">
                  Create all {recommendations.filter(r => r.type === 'index').length} recommended indexes?
                </p>
                <p className="text-xs text-gray-500">
                  This will create indexes for all collections with index recommendations.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

