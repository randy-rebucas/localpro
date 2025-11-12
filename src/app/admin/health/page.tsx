"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Server, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Activity,
  AlertCircle,
  TrendingUp,
  Package
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { makeClientPublicRequest } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";

// Types based on the system-health endpoint response
interface SystemHealthData {
  status: string;
  timestamp: string;
  uptime: number;
  uptimeFormatted: string;
  version: string;
  environment: string;
  services: {
    database: {
      status: string;
      state: string;
      host: string;
      port: number;
      name: string;
      queryTest: boolean;
      collections: number;
    };
    external_apis: {
      [key: string]: {
        status: string;
        response_time: number | null;
      };
    };
    app: {
      status: string;
      version: string;
      environment: string;
      maintenanceMode: boolean;
      features: {
        marketplace: boolean;
        academy: boolean;
        jobBoard: boolean;
        referrals: boolean;
        analytics: boolean;
      };
    };
  };
  system: {
    memory: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
      unit: string;
    };
    cpu: {
      user: number;
      system: number;
      unit: string;
    };
    platform: string;
    nodeVersion: string;
    pid: number;
    arch: string;
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
    totalErrors: number;
  };
  requestId?: string;
}

interface AnalysisResult {
  overall: {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    insights: string[];
  };
  database: {
    status: 'healthy' | 'warning' | 'critical';
    insights: string[];
  };
  system: {
    status: 'excellent' | 'good' | 'warning' | 'critical';
    memoryUsage: number;
    insights: string[];
  };
  performance: {
    status: 'excellent' | 'good' | 'warning' | 'critical';
    errorRate: number;
    insights: string[];
  };
  services: {
    status: 'healthy' | 'warning' | 'critical';
    insights: string[];
  };
}

// Analysis functions
function analyzeOverall(data: SystemHealthData): AnalysisResult['overall'] {
  const insights: string[] = [];
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  let score = 100;

  // Check main status
  if (data.status === 'healthy') {
    insights.push("System is operating normally");
  } else {
    insights.push(`System status: ${data.status}`);
    status = 'critical';
    score -= 50;
  }

  // Check database
  if (data.services.database.status !== 'healthy') {
    insights.push(`Database status: ${data.services.database.status}`);
    status = 'critical';
    score -= 30;
  }

  // Check app status
  if (data.services.app.status !== 'healthy') {
    insights.push(`Application status: ${data.services.app.status}`);
    status = status === 'healthy' ? 'warning' : 'critical';
    score -= 20;
  }

  // Check memory usage
  const memoryPercent = (data.system.memory.heapUsed / data.system.memory.heapTotal) * 100;
  if (memoryPercent > 90) {
    insights.push(`High memory usage (${memoryPercent.toFixed(1)}%)`);
    status = 'critical';
    score -= 20;
  } else if (memoryPercent > 80) {
    insights.push(`Memory usage is elevated (${memoryPercent.toFixed(1)}%)`);
    if (status === 'healthy') status = 'warning';
    score -= 10;
  }

  // Check errors
  if (data.metrics.totalErrors > 0) {
    insights.push(`${data.metrics.totalErrors} error(s) detected`);
    if (data.metrics.totalErrors > 10) {
      status = 'critical';
      score -= 15;
    } else {
      if (status === 'healthy') status = 'warning';
      score -= 5;
    }
  }

  return { status, score: Math.max(0, score), insights };
}

function analyzeDatabase(data: SystemHealthData): AnalysisResult['database'] {
  const insights: string[] = [];
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';

  const db = data.services.database;

  if (db.status === 'healthy' && db.state === 'connected') {
    insights.push("Database connection is healthy");
    insights.push(`Connected to ${db.host}:${db.port}`);
    insights.push(`Database: ${db.name} (${db.collections} collections)`);
    if (db.queryTest) {
      insights.push("Query test passed successfully");
    }
  } else {
    insights.push(`Database status: ${db.status}`);
    insights.push(`Connection state: ${db.state}`);
    status = 'critical';
  }

  return { status, insights };
}

function analyzeSystem(data: SystemHealthData): AnalysisResult['system'] {
  const insights: string[] = [];
  let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';

  const memory = data.system.memory;
  const memoryPercent = (memory.heapUsed / memory.heapTotal) * 100;

  // Memory analysis
  if (memoryPercent > 90) {
    insights.push(`Memory usage is critical (${memoryPercent.toFixed(1)}%)`);
    status = 'critical';
  } else if (memoryPercent > 80) {
    insights.push(`Memory usage is high (${memoryPercent.toFixed(1)}%)`);
    status = 'warning';
  } else {
    insights.push(`Memory usage is healthy (${memoryPercent.toFixed(1)}%)`);
  }

  insights.push(`RSS: ${memory.rss}${memory.unit}, Heap: ${memory.heapUsed}${memory.unit}/${memory.heapTotal}${memory.unit}`);
  insights.push(`External memory: ${memory.external}${memory.unit}`);

  // CPU analysis
  const cpuTotal = data.system.cpu.user + data.system.cpu.system;
  const cpuSeconds = cpuTotal / 1000000; // Convert microseconds to seconds
  insights.push(`CPU time: ${cpuSeconds.toFixed(2)}s (user: ${(data.system.cpu.user / 1000000).toFixed(2)}s, system: ${(data.system.cpu.system / 1000000).toFixed(2)}s)`);

  // Platform info
  insights.push(`Platform: ${data.system.platform} (${data.system.arch})`);
  insights.push(`Node.js: ${data.system.nodeVersion}`);
  insights.push(`Process ID: ${data.system.pid}`);

  return { status, memoryUsage: memoryPercent, insights };
}

function analyzePerformance(data: SystemHealthData): AnalysisResult['performance'] {
  const insights: string[] = [];
  let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';

  const metrics = data.metrics;

  // Error rate analysis
  const errorRate = metrics.httpRequests > 0 
    ? (metrics.totalErrors / metrics.httpRequests) * 100 
    : 0;

  if (errorRate === 0) {
    insights.push("No errors detected - system is stable");
  } else if (errorRate < 1) {
    insights.push(`Low error rate (${errorRate.toFixed(2)}%) - within acceptable range`);
    status = 'good';
  } else if (errorRate < 5) {
    insights.push(`Moderate error rate (${errorRate.toFixed(2)}%) - monitoring recommended`);
    status = 'warning';
  } else {
    insights.push(`High error rate (${errorRate.toFixed(2)}%) - immediate attention required`);
    status = 'critical';
  }

  // Request volume
  if (metrics.httpRequests > 1000) {
    insights.push(`High request volume (${metrics.httpRequests}) - system handling load well`);
  } else if (metrics.httpRequests > 100) {
    insights.push(`Moderate request volume (${metrics.httpRequests})`);
  } else {
    insights.push(`Low request volume (${metrics.httpRequests}) - may indicate low traffic`);
  }

  // Active connections
  insights.push(`Active connections: ${metrics.activeConnections}`);

  // CPU usage
  if (metrics.cpuUsage > 90) {
    insights.push(`CPU usage is critical (${metrics.cpuUsage}%)`);
    status = status === 'excellent' ? 'critical' : status;
  } else if (metrics.cpuUsage > 70) {
    insights.push(`CPU usage is high (${metrics.cpuUsage}%)`);
    if (status === 'excellent') status = 'warning';
  } else {
    insights.push(`CPU usage is normal (${metrics.cpuUsage}%)`);
  }

  return { status, errorRate, insights };
}

function analyzeServices(data: SystemHealthData): AnalysisResult['services'] {
  const insights: string[] = [];
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';

  // App service
  const app = data.services.app;
  if (app.status === 'healthy') {
    insights.push(`Application is healthy (v${app.version}, ${app.environment})`);
    if (app.maintenanceMode) {
      insights.push("⚠️ Maintenance mode is enabled");
      status = 'warning';
    }
    const enabledFeatures = Object.entries(app.features)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
    insights.push(`Enabled features: ${enabledFeatures.join(', ')}`);
  } else {
    insights.push(`Application status: ${app.status}`);
    status = 'critical';
  }

  // External APIs
  const externalApis = data.services.external_apis;
  const apiEntries = Object.entries(externalApis);
  
  if (apiEntries.length > 0) {
    insights.push(`External APIs configured: ${apiEntries.length}`);
    apiEntries.forEach(([name, api]) => {
      if (api.status === 'configured') {
        insights.push(`✓ ${name}: ${api.status}`);
      } else {
        insights.push(`✗ ${name}: ${api.status}`);
        status = status === 'healthy' ? 'warning' : 'critical';
      }
    });
  }

  return { status, insights };
}

export default function AdminHealthPage() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSystemHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeClientPublicRequest(
        'monitoringSystemHealth' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch system health`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load system health data');
      }

      const data = result.data as SystemHealthData;
      setHealthData(data);

      // Analyze the data
      const analysisResult: AnalysisResult = {
        overall: analyzeOverall(data),
        database: analyzeDatabase(data),
        system: analyzeSystem(data),
        performance: analyzePerformance(data),
        services: analyzeServices(data),
      };
      setAnalysis(analysisResult);

      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching system health', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load system health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemHealth();
  }, [fetchSystemHealth]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchSystemHealth();
    } catch (err) {
      logger.error('Error refreshing system health', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
          <p className="text-gray-600 text-sm">Comprehensive system monitoring and analysis</p>
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
      {analysis && healthData && (
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900">Overall System Status</h2>
            <div className="flex items-center space-x-2">
              {getStatusIcon(analysis.overall.status)}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(analysis.overall.status)}`}>
                {analysis.overall.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs font-medium text-gray-500">Health Score</p>
              <p className="text-2xl font-bold text-gray-900">{analysis.overall.score}</p>
              <p className="text-xs text-gray-500">out of 100</p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs font-medium text-gray-500">Uptime</p>
              <p className="text-lg font-bold text-gray-900">{healthData.uptimeFormatted}</p>
              <p className="text-xs text-gray-500">{healthData.uptime}s total</p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs font-medium text-gray-500">Version</p>
              <p className="text-lg font-bold text-gray-900">{healthData.version}</p>
              <p className="text-xs text-gray-500">{healthData.environment}</p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs font-medium text-gray-500">HTTP Requests</p>
              <p className="text-lg font-bold text-gray-900">{healthData.metrics.httpRequests}</p>
              <p className="text-xs text-gray-500">Total requests</p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs font-medium text-gray-500">Errors</p>
              <p className={`text-lg font-bold ${healthData.metrics.totalErrors > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {healthData.metrics.totalErrors}
              </p>
              <p className="text-xs text-gray-500">Total errors</p>
            </div>
          </div>
          {analysis.overall.insights.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Key Insights:</p>
              <div className="space-y-1">
                {analysis.overall.insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs text-gray-600">
                    <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Database Health */}
      {analysis && healthData && (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-medium text-gray-900">Database</h3>
              </div>
              {getStatusIcon(analysis.database.status)}
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Status</p>
                <p className="text-lg font-bold text-gray-900 capitalize">{healthData.services.database.status}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Host</p>
                <p className="text-sm font-bold text-gray-900 truncate" title={healthData.services.database.host}>
                  {healthData.services.database.host}
                </p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Database</p>
                <p className="text-lg font-bold text-gray-900">{healthData.services.database.name}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Collections</p>
                <p className="text-lg font-bold text-gray-900">{healthData.services.database.collections}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Details:</p>
              {analysis.database.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Resources */}
      {analysis && healthData && (
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Memory Usage</p>
                <p className="text-lg font-bold text-gray-900">{analysis.system.memoryUsage.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      analysis.system.memoryUsage > 90 ? 'bg-red-500' : 
                      analysis.system.memoryUsage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${analysis.system.memoryUsage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {healthData.system.memory.heapUsed}{healthData.system.memory.unit} / {healthData.system.memory.heapTotal}{healthData.system.memory.unit}
                </p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">RSS Memory</p>
                <p className="text-lg font-bold text-gray-900">
                  {healthData.system.memory.rss}{healthData.system.memory.unit}
                </p>
                <p className="text-xs text-gray-500">Resident set size</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">CPU Usage</p>
                <p className="text-lg font-bold text-gray-900">{healthData.metrics.cpuUsage}%</p>
                <p className="text-xs text-gray-500">Current usage</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Platform</p>
                <p className="text-sm font-bold text-gray-900">{healthData.system.platform}</p>
                <p className="text-xs text-gray-500">{healthData.system.arch}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">System Information:</p>
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

      {/* Performance Metrics */}
      {analysis && healthData && (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-900">Performance Metrics</h3>
              </div>
              {getStatusIcon(analysis.performance.status)}
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Error Rate</p>
                <p className={`text-lg font-bold ${analysis.performance.errorRate > 5 ? 'text-red-600' : analysis.performance.errorRate > 1 ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {analysis.performance.errorRate.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500">
                  {healthData.metrics.totalErrors} errors / {healthData.metrics.httpRequests} requests
                </p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Active Connections</p>
                <p className="text-lg font-bold text-gray-900">{healthData.metrics.activeConnections}</p>
                <p className="text-xs text-gray-500">Current connections</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">HTTP Requests</p>
                <p className="text-lg font-bold text-gray-900">{healthData.metrics.httpRequests}</p>
                <p className="text-xs text-gray-500">Total requests</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500">Node.js Version</p>
                <p className="text-sm font-bold text-gray-900">{healthData.system.nodeVersion}</p>
                <p className="text-xs text-gray-500">Runtime version</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Performance Insights:</p>
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

      {/* Services Status */}
      {analysis && healthData && (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-cyan-600" />
                <h3 className="text-sm font-medium text-gray-900">Services & Features</h3>
              </div>
              {getStatusIcon(analysis.services.status)}
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Application</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Status:</span>
                    <span className={`text-xs font-medium capitalize ${getStatusColor(healthData.services.app.status)} px-2 py-0.5 rounded`}>
                      {healthData.services.app.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Version:</span>
                    <span className="text-xs font-medium text-gray-900">{healthData.services.app.version}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Environment:</span>
                    <span className="text-xs font-medium text-gray-900">{healthData.services.app.environment}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Maintenance Mode:</span>
                    <span className={`text-xs font-medium ${healthData.services.app.maintenanceMode ? 'text-yellow-600' : 'text-green-600'}`}>
                      {healthData.services.app.maintenanceMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Features</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(healthData.services.app.features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center space-x-1">
                      {enabled ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-600 capitalize">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Service Details:</p>
              {analysis.services.insights.map((insight, idx) => (
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
