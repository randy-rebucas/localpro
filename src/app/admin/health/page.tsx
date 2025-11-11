"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Activity,
  AlertCircle,
  TrendingUp,
  Gauge
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { makeClientPublicRequest } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";

// Types based on the provided JSON responses
interface MetricsData {
  timestamp: string;
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    totalErrors: number;
    memoryUsage: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
    };
  };
  metrics: Array<{
    help: string;
    name: string;
    type: string;
    values: Array<{
      value: number;
      labels?: Record<string, string>;
      metricName?: string;
    }>;
    aggregator: string;
  }>;
}

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  database: {
    status: string;
    state: number;
  };
  metrics: {
    httpRequests: number;
    activeConnections: number;
    memoryUsage: Array<{
      value: number;
      labels: {
        type: string;
        app: string;
        version: string;
        environment: string;
      };
    }>;
    cpuUsage: number;
  };
}

interface SystemData {
  timestamp: string;
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    speed: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    available: number;
  };
  disk: Array<{
    fs: string;
    type: string;
    size: number;
    used: number;
    available: number;
    use: number;
  }>;
  network: Array<{
    iface: string;
    type: string;
    ip4: string;
    ip6: string;
  }>;
}

interface AnalysisResult {
  performance: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    insights: string[];
  };
  health: {
    overallStatus: string;
    databaseStatus: string;
    uptime: number;
    status: 'healthy' | 'warning' | 'critical';
    insights: string[];
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    insights: string[];
  };
  metrics: {
    memoryPressure: number;
    eventLoopLag: number;
    gcDuration: number;
    activeConnections: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    insights: string[];
  };
}

// Analysis functions
function analyzePerformance(metricsData: MetricsData): AnalysisResult['performance'] {
  const insights: string[] = [];
  let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
  
  const avgResponseTime = metricsData.summary.averageResponseTime;
  const totalRequests = metricsData.summary.totalRequests;
  const totalErrors = metricsData.summary.totalErrors;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  // Analyze response times
  if (avgResponseTime < 0.1) {
    insights.push("Response times are excellent (< 100ms)");
  } else if (avgResponseTime < 0.3) {
    insights.push("Response times are good (< 300ms)");
    status = 'good';
  } else if (avgResponseTime < 0.5) {
    insights.push("Response times are acceptable but could be improved (< 500ms)");
    status = 'warning';
  } else {
    insights.push("Response times are slow (> 500ms) - performance optimization needed");
    status = 'critical';
  }

  // Analyze error rate
  if (errorRate === 0) {
    insights.push("No errors detected - system is stable");
  } else if (errorRate < 1) {
    insights.push(`Low error rate (${errorRate.toFixed(2)}%) - within acceptable range`);
    if (status === 'excellent') status = 'good';
  } else if (errorRate < 5) {
    insights.push(`Moderate error rate (${errorRate.toFixed(2)}%) - monitoring recommended`);
    status = status === 'excellent' ? 'warning' : status;
  } else {
    insights.push(`High error rate (${errorRate.toFixed(2)}%) - immediate attention required`);
    status = 'critical';
  }

  // Analyze request volume
  if (totalRequests > 1000) {
    insights.push(`High request volume (${totalRequests}) - system handling load well`);
  } else if (totalRequests < 10) {
    insights.push(`Low request volume (${totalRequests}) - may indicate low traffic`);
  }

  return {
    averageResponseTime: avgResponseTime,
    totalRequests,
    errorRate,
    status,
    insights
  };
}

function analyzeHealth(healthData: HealthData): AnalysisResult['health'] {
  const insights: string[] = [];
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';

  // Check overall status
  if (healthData.status === 'OK') {
    insights.push("System health status is OK");
  } else {
    insights.push(`System health status: ${healthData.status}`);
    status = 'critical';
  }

  // Check database
  if (healthData.database.status === 'connected' && healthData.database.state === 1) {
    insights.push("Database connection is healthy");
  } else {
    insights.push(`Database status: ${healthData.database.status} (state: ${healthData.database.state})`);
    status = 'critical';
  }

  // Check uptime
  const uptimeHours = healthData.uptime / 3600;
  if (uptimeHours > 24) {
    insights.push(`System uptime: ${uptimeHours.toFixed(1)} hours - stable operation`);
  } else if (uptimeHours > 1) {
    insights.push(`System uptime: ${uptimeHours.toFixed(1)} hours - recently restarted`);
    if (status === 'healthy') status = 'warning';
  } else {
    insights.push(`System uptime: ${uptimeHours.toFixed(1)} hours - very recent restart`);
    status = 'warning';
  }

  // Check memory usage
  const memoryUsage = healthData.metrics.memoryUsage;
  const heapUsed = memoryUsage.find(m => m.labels.type === 'heapUsed')?.value || 0;
  const heapTotal = memoryUsage.find(m => m.labels.type === 'heapTotal')?.value || 0;
  if (heapTotal > 0) {
    const memoryPercent = (heapUsed / heapTotal) * 100;
    if (memoryPercent > 90) {
      insights.push(`Memory usage is critical (${memoryPercent.toFixed(1)}%)`);
      status = 'critical';
    } else if (memoryPercent > 80) {
      insights.push(`Memory usage is high (${memoryPercent.toFixed(1)}%)`);
      if (status === 'healthy') status = 'warning';
    } else {
      insights.push(`Memory usage is healthy (${memoryPercent.toFixed(1)}%)`);
    }
  }

  // Check CPU usage
  if (healthData.metrics.cpuUsage > 90) {
    insights.push(`CPU usage is critical (${healthData.metrics.cpuUsage}%)`);
    status = 'critical';
  } else if (healthData.metrics.cpuUsage > 70) {
    insights.push(`CPU usage is high (${healthData.metrics.cpuUsage}%)`);
    if (status === 'healthy') status = 'warning';
  } else {
    insights.push(`CPU usage is normal (${healthData.metrics.cpuUsage}%)`);
  }

  return {
    overallStatus: healthData.status,
    databaseStatus: healthData.database.status,
    uptime: healthData.uptime,
    status,
    insights
  };
}

function analyzeSystem(systemData: SystemData): AnalysisResult['system'] {
  const insights: string[] = [];
  let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';

  // Calculate CPU usage (approximate)
  const cpuUsage = 0; // CPU usage not directly available, would need to calculate from process metrics
  insights.push(`CPU: ${systemData.cpu.brand} (${systemData.cpu.cores} cores @ ${systemData.cpu.speed}GHz)`);

  // Analyze memory
  const memoryUsage = (systemData.memory.used / systemData.memory.total) * 100;
  if (memoryUsage > 90) {
    insights.push(`Memory usage is critical (${memoryUsage.toFixed(1)}%)`);
    status = 'critical';
  } else if (memoryUsage > 80) {
    insights.push(`Memory usage is high (${memoryUsage.toFixed(1)}%)`);
    status = 'warning';
  } else {
    insights.push(`Memory usage is healthy (${memoryUsage.toFixed(1)}%)`);
  }
  insights.push(`Memory: ${(systemData.memory.used / 1024 / 1024 / 1024).toFixed(2)}GB used / ${(systemData.memory.total / 1024 / 1024 / 1024).toFixed(2)}GB total`);

  // Analyze disk
  if (systemData.disk.length > 0) {
    const disk = systemData.disk[0];
    if (disk.use > 90) {
      insights.push(`Disk usage is critical (${disk.use.toFixed(1)}%) on ${disk.fs}`);
      status = 'critical';
    } else if (disk.use > 80) {
      insights.push(`Disk usage is high (${disk.use.toFixed(1)}%) on ${disk.fs}`);
      if (status === 'excellent') status = 'warning';
    } else {
      insights.push(`Disk usage is healthy (${disk.use.toFixed(1)}%) on ${disk.fs}`);
    }
    insights.push(`Disk: ${(disk.used / 1024 / 1024 / 1024).toFixed(2)}GB used / ${(disk.size / 1024 / 1024 / 1024).toFixed(2)}GB total`);
  }

  // Network info
  const networkInterfaces = systemData.network.filter(n => n.type === 'wired' || n.ip4 !== '127.0.0.1');
  if (networkInterfaces.length > 0) {
    insights.push(`Network: ${networkInterfaces.length} active interface(s)`);
  }

  return {
    cpuUsage,
    memoryUsage,
    diskUsage: systemData.disk.length > 0 ? systemData.disk[0].use : 0,
    status,
    insights
  };
}

function analyzeMetrics(metricsData: MetricsData): AnalysisResult['metrics'] {
  const insights: string[] = [];
  let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';

  // Analyze memory pressure
  const memoryUsage = metricsData.summary.memoryUsage;
  const memoryPressure = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  if (memoryPressure > 90) {
    insights.push(`Memory pressure is critical (${memoryPressure.toFixed(1)}%)`);
    status = 'critical';
  } else if (memoryPressure > 80) {
    insights.push(`Memory pressure is high (${memoryPressure.toFixed(1)}%)`);
    status = 'warning';
  } else {
    insights.push(`Memory pressure is healthy (${memoryPressure.toFixed(1)}%)`);
  }

  // Analyze event loop lag
  const eventLoopLagMetric = metricsData.metrics.find(m => m.name === 'nodejs_eventloop_lag_seconds');
  if (eventLoopLagMetric && eventLoopLagMetric.values.length > 0) {
    const eventLoopLag = eventLoopLagMetric.values[0].value;
    if (eventLoopLag > 0.1) {
      insights.push(`Event loop lag is high (${(eventLoopLag * 1000).toFixed(2)}ms) - performance degradation`);
      status = 'critical';
    } else if (eventLoopLag > 0.05) {
      insights.push(`Event loop lag is moderate (${(eventLoopLag * 1000).toFixed(2)}ms)`);
      if (status === 'excellent') status = 'warning';
    } else {
      insights.push(`Event loop lag is normal (${(eventLoopLag * 1000).toFixed(2)}ms)`);
    }
  }

  // Analyze GC duration
  const gcMetric = metricsData.metrics.find(m => m.name === 'nodejs_gc_duration_seconds');
  if (gcMetric) {
    const gcSum = gcMetric.values.find(v => v.metricName === 'nodejs_gc_duration_seconds_sum');
    const gcCount = gcMetric.values.find(v => v.metricName === 'nodejs_gc_duration_seconds_count');
    if (gcSum && gcCount && gcCount.value > 0) {
      const avgGcDuration = gcSum.value / gcCount.value;
      if (avgGcDuration > 0.1) {
        insights.push(`Average GC duration is high (${(avgGcDuration * 1000).toFixed(2)}ms)`);
        if (status === 'excellent') status = 'warning';
      } else {
        insights.push(`GC performance is good (avg ${(avgGcDuration * 1000).toFixed(2)}ms)`);
      }
    }
  }

  // Active connections
  const activeConnectionsMetric = metricsData.metrics.find(m => m.name === 'active_connections');
  const activeConnections = activeConnectionsMetric?.values[0]?.value || 0;
  insights.push(`Active connections: ${activeConnections}`);

  // HTTP requests
  const httpRequestsMetric = metricsData.metrics.find(m => m.name === 'http_requests_total');
  if (httpRequestsMetric) {
    const totalRequests = httpRequestsMetric.values.reduce((sum, v) => sum + v.value, 0);
    insights.push(`Total HTTP requests: ${totalRequests}`);
  }

  return {
    memoryPressure,
    eventLoopLag: eventLoopLagMetric?.values[0]?.value || 0,
    gcDuration: 0, // Will be calculated if available
    activeConnections,
    status,
    insights
  };
}

export default function AdminHealthPage() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAllMonitoringData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all monitoring endpoints in parallel
      const [metricsRes, healthRes, systemRes] = await Promise.allSettled([
        makeClientPublicRequest('monitoringMetricsJson' as keyof typeof API_ENDPOINTS, { method: 'GET' }),
        makeClientPublicRequest('monitoringHealth' as keyof typeof API_ENDPOINTS, { method: 'GET' }),
        makeClientPublicRequest('monitoringSystem' as keyof typeof API_ENDPOINTS, { method: 'GET' }),
      ]);

      let metrics: MetricsData | null = null;
      let health: HealthData | null = null;
      let system: SystemData | null = null;

      // Process metrics
      if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        const metricsResult = await metricsRes.value.json();
        metrics = metricsResult.data || metricsResult;
        setMetricsData(metrics);
      }

      // Process health
      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const healthResult = await healthRes.value.json();
        health = healthResult.data || healthResult;
        setHealthData(health);
      }

      // Process system
      if (systemRes.status === 'fulfilled' && systemRes.value.ok) {
        const systemResult = await systemRes.value.json();
        system = systemResult.data || systemResult;
        setSystemData(system);
      }

      // Analyze the data if we have all required data
      if (metrics && health && system) {
        const analysisResult: AnalysisResult = {
          performance: analyzePerformance(metrics),
          health: analyzeHealth(health),
          system: analyzeSystem(system),
          metrics: analyzeMetrics(metrics),
        };
        setAnalysis(analysisResult);
      }

      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching monitoring data', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllMonitoringData();
  }, [fetchAllMonitoringData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchAllMonitoringData();
    } catch (err) {
      logger.error('Error refreshing monitoring data', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good': return <Activity className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading system health..." />
      </div>
    );
  }

  if (error) {
    return (
      <AdminErrorState 
        error={error}
        onRetry={refreshData}
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
            System Health & Performance
          </h1>
          <p className="text-gray-600 text-sm">Comprehensive monitoring and analysis</p>
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

      {/* Overall Status Summary */}
      {analysis && (
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Overall Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Performance</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{analysis.performance.status}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Health</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{analysis.health.status}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">System</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{analysis.system.status}</p>
                </div>
                <Server className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded shadow p-3 border-l-4 border-cyan-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Metrics</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{analysis.metrics.status}</p>
                </div>
                <Gauge className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Analysis */}
      {analysis && (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-900">Performance Analysis</h3>
              </div>
              {getStatusIcon(analysis.performance.status)}
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Avg Response Time</p>
                <p className="text-lg font-bold text-gray-900">{(analysis.performance.averageResponseTime * 1000).toFixed(2)}ms</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Total Requests</p>
                <p className="text-lg font-bold text-gray-900">{analysis.performance.totalRequests}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Error Rate</p>
                <p className="text-lg font-bold text-gray-900">{analysis.performance.errorRate.toFixed(2)}%</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Insights:</p>
              {analysis.performance.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Health Analysis */}
      {analysis && healthData && (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-medium text-gray-900">Health Status</h3>
              </div>
              {getStatusIcon(analysis.health.status)}
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <p className="text-lg font-bold text-gray-900">{analysis.health.overallStatus}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Database</p>
                <p className="text-lg font-bold text-gray-900">{analysis.health.databaseStatus}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Uptime</p>
                <p className="text-lg font-bold text-gray-900">{(analysis.health.uptime / 3600).toFixed(1)}h</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Active Connections</p>
                <p className="text-lg font-bold text-gray-900">{healthData.metrics.activeConnections}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Insights:</p>
              {analysis.health.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Analysis */}
      {analysis && systemData && (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Server className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-medium text-gray-900">System Resources</h3>
              </div>
              {getStatusIcon(analysis.system.status)}
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">CPU</p>
                <p className="text-sm font-bold text-gray-900">{systemData.cpu.brand}</p>
                <p className="text-xs text-gray-500">{systemData.cpu.cores} cores</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Memory Usage</p>
                <p className="text-lg font-bold text-gray-900">{analysis.system.memoryUsage.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      analysis.system.memoryUsage > 90 ? 'bg-red-500' : 
                      analysis.system.memoryUsage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${analysis.system.memoryUsage}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Disk Usage</p>
                <p className="text-lg font-bold text-gray-900">{analysis.system.diskUsage.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      analysis.system.diskUsage > 90 ? 'bg-red-500' : 
                      analysis.system.diskUsage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${analysis.system.diskUsage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Insights:</p>
              {analysis.system.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Analysis */}
      {analysis && metricsData && (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Gauge className="w-5 h-5 text-cyan-600" />
                <h3 className="text-sm font-medium text-gray-900">Detailed Metrics</h3>
              </div>
              {getStatusIcon(analysis.metrics.status)}
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Memory Pressure</p>
                <p className="text-lg font-bold text-gray-900">{analysis.metrics.memoryPressure.toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Event Loop Lag</p>
                <p className="text-lg font-bold text-gray-900">{(analysis.metrics.eventLoopLag * 1000).toFixed(2)}ms</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Active Connections</p>
                <p className="text-lg font-bold text-gray-900">{analysis.metrics.activeConnections}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Heap Used</p>
                <p className="text-lg font-bold text-gray-900">
                  {metricsData.summary.memoryUsage ? Math.round(metricsData.summary.memoryUsage.heapUsed / 1024 / 1024) : 0}MB
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Insights:</p>
              {analysis.metrics.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
