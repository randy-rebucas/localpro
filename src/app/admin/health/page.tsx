"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Server, 
  Database, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Activity,
  Zap,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  AlertCircle
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { makeClientPublicRequest } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";

interface HealthMetrics {
  status: string;
  timestamp: string;
  uptime: number;
  database: {
    status: string;
    state: string;
    host: string;
    port: number;
    name: string;
  };
  external_apis: {
    [key: string]: {
      status: string;
      response_time: number | null;
    };
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  version: string;
}

interface HealthAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  component: string;
  resolved: boolean;
}

export default function AdminHealthPage() {
  const [healthData, setHealthData] = useState<HealthMetrics | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Generate alerts based on health data
  const generateAlertsFromHealthData = (healthData: HealthMetrics): HealthAlert[] => {
    const alerts: HealthAlert[] = [];
    
    // Check database status
    if (healthData.database?.status && healthData.database.status !== 'healthy') {
      alerts.push({
        id: 'db-1',
        type: 'critical',
        title: 'Database Connection Issue',
        message: `Database is ${healthData.database.status} - ${healthData.database.state || 'Unknown state'}`,
        timestamp: healthData.timestamp,
        component: 'Database',
        resolved: false,
      });
    }
    
    // Check external APIs
    if (healthData.external_apis) {
      Object.entries(healthData.external_apis).forEach(([apiName, apiData]) => {
        if (apiData.status === 'unknown' || apiData.status === 'error') {
          alerts.push({
            id: `api-${apiName}`,
            type: apiData.status === 'error' ? 'critical' : 'warning',
            title: `${apiName} API Issue`,
            message: `${apiName} API is ${apiData.status}`,
            timestamp: healthData.timestamp,
            component: 'External APIs',
            resolved: false,
          });
        }
      });
    }
    
    // Check memory usage
    if (healthData.memory?.heapUsed && healthData.memory?.heapTotal) {
      const memoryUsagePercent = (healthData.memory.heapUsed / healthData.memory.heapTotal) * 100;
      if (memoryUsagePercent > 85) {
        alerts.push({
          id: 'memory-1',
          type: 'warning',
          title: 'High Memory Usage',
          message: `Memory usage is at ${memoryUsagePercent.toFixed(1)}% (${Math.round(healthData.memory.heapUsed / 1024 / 1024)}MB / ${Math.round(healthData.memory.heapTotal / 1024 / 1024)}MB)`,
          timestamp: healthData.timestamp,
          component: 'Server',
          resolved: false,
        });
      }
    }
    
    return alerts;
  };

  const fetchHealthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Health endpoint is public per API documentation
      const response = await makeClientPublicRequest(
        'settingsAppHealth' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch health data`);
      }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load health data');
        }

        // Handle the actual API response format
        const healthResponse = result.data || result;
        setHealthData(healthResponse);
        
        // Generate alerts based on the health data
        const generatedAlerts = generateAlertsFromHealthData(healthResponse);
        setAlerts(generatedAlerts);
        setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching health data', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchHealthData();
    } catch (err) {
      logger.error('Error refreshing health data', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Activity className="w-5 h-5 text-blue-500" />;
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
            System Health
          </h1>
          <p className="text-gray-600 text-sm">Monitor system performance and health metrics</p>
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

      {/* Overall System Status */}
      <div className="bg-white rounded shadow p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-900">System Overview</h2>
          <div className="flex items-center space-x-2">
            {alerts.filter(alert => alert.type === 'critical').length === 0 ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                All Systems Operational
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <XCircle className="w-3 h-3 mr-1" />
                {alerts.filter(alert => alert.type === 'critical').length} Critical Issues
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Alerts</p>
                <p className="text-lg font-bold text-gray-900">{alerts.length}</p>
                <p className="text-xs text-gray-500">All alerts</p>
              </div>
              <AlertCircle className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Critical</p>
                <p className="text-lg font-bold text-gray-900">{alerts.filter(alert => alert.type === 'critical').length}</p>
                <p className="text-xs text-gray-500">Critical issues</p>
              </div>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Warnings</p>
                <p className="text-lg font-bold text-gray-900">{alerts.filter(alert => alert.type === 'warning').length}</p>
                <p className="text-xs text-gray-500">Warning alerts</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">System Status</p>
                <p className="text-lg font-bold text-gray-900">{healthData?.status || 'Unknown'}</p>
                <p className="text-xs text-gray-500">Overall health</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Server Health */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-900">Server Health</h3>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(healthData?.status || 'unknown')}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(healthData?.status || 'unknown')}`}>
                {healthData?.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Uptime</p>
                  <p className="text-lg font-bold text-gray-900">{healthData?.uptime ? Math.floor(healthData.uptime / 3600) : 0}h</p>
                  <p className="text-xs text-gray-500">Server uptime</p>
                </div>
                <Cpu className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Memory Usage</p>
                  <p className="text-lg font-bold text-gray-900">
                    {healthData?.memory ? Math.round((healthData.memory.heapUsed / healthData.memory.heapTotal) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-500">Heap utilization</p>
                </div>
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    healthData?.memory && (healthData.memory.heapUsed / healthData.memory.heapTotal) > 0.85 ? 'bg-red-500' : 
                    healthData?.memory && (healthData.memory.heapUsed / healthData.memory.heapTotal) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${healthData?.memory ? (healthData.memory.heapUsed / healthData.memory.heapTotal) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Memory RSS</p>
                  <p className="text-lg font-bold text-gray-900">
                    {healthData?.memory ? Math.round(healthData.memory.rss / 1024 / 1024) : 0}MB
                  </p>
                  <p className="text-xs text-gray-500">Resident set size</p>
                </div>
                <HardDrive className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white rounded shadow p-3 border-l-4 border-cyan-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Version</p>
                  <p className="text-lg font-bold text-gray-900">{healthData?.version || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">App version</p>
                </div>
                <Zap className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Health */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-medium text-gray-900">Database Health</h3>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(healthData?.database?.status || 'unknown')}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(healthData?.database?.status || 'unknown')}`}>
                {healthData?.database?.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Database Status</p>
                  <p className="text-lg font-bold text-gray-900">{healthData?.database?.status || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">Connection state</p>
                </div>
                <Database className="w-5 h-5 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Database Host</p>
                  <p className="text-lg font-bold text-gray-900">{healthData?.database?.host || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">MongoDB host</p>
                </div>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Database Name</p>
                  <p className="text-lg font-bold text-gray-900">{healthData?.database?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">Database name</p>
                </div>
                <HardDrive className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white rounded shadow p-3 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Port</p>
                  <p className="text-lg font-bold text-gray-900">{healthData?.database?.port || 0}</p>
                  <p className="text-xs text-gray-500">Database port</p>
                </div>
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* External APIs */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Globe className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-900">External APIs</h3>
          </div>
        </div>
        
        <div className="p-4">
          <div className="space-y-3">
            {healthData?.external_apis && Object.entries(healthData.external_apis).map(([apiName, apiData]) => (
              <div key={apiName} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <Wifi className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{apiName}</p>
                    <p className="text-xs text-gray-500">External API service</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {apiData.response_time ? `${apiData.response_time}ms` : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">Response time</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(apiData.status)}
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apiData.status)}`}>
                      {apiData.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">System Alerts</h3>
              <span className="text-xs text-gray-500">
                {alerts.filter(alert => !alert.resolved).length} active alerts
              </span>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded border-l-4 ${
                  alert.type === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="text-xs text-gray-500">Component: {alert.component}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {alert.resolved ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolved
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
