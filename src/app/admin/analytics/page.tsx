'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  Eye, 
  Clock,
  Download,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Zap
} from 'lucide-react';
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    conversionRate: number;
    avgSessionDuration: number;
    bounceRate: number;
    pageViews: number;
    newUsers: number;
  };
  realTime: {
    currentUsers: number;
    pageViews: number;
    events: number;
    topPages: Array<{ page: string; views: number }>;
    topCountries: Array<{ country: string; users: number }>;
    topDevices: Array<{ device: string; users: number }>;
  };
  performance: {
    avgLoadTime: number;
    slowestPages: Array<{ page: string; loadTime: number }>;
    errorRate: number;
    uptime: number;
    coreWebVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
  };
  userBehavior: {
    sessionDuration: Array<{ duration: string; count: number }>;
    userFlow: Array<{ step: string; users: number; dropoff: number }>;
    deviceBreakdown: Array<{ device: string; percentage: number }>;
    browserBreakdown: Array<{ browser: string; percentage: number }>;
  };
  revenue: {
    totalRevenue: number;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    revenueBySource: Array<{ source: string; revenue: number }>;
    averageOrderValue: number;
    revenueGrowth: number;
  };
  conversion: {
    overallRate: number;
    funnelSteps: Array<{ step: string; users: number; conversion: number }>;
    topConvertingPages: Array<{ page: string; rate: number }>;
    conversionByDevice: Array<{ device: string; rate: number }>;
  };
  trends: Array<{
    date: string;
    users: number;
    revenue: number;
    sessions: number;
  }>;
}

interface AnalyticsStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  newUsers: number;
  currentUsers: number;
  avgLoadTime: number;
  errorRate: number;
  uptime: number;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedType, setSelectedType] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);

  const periods = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  const analyticsTypes = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'realtime', label: 'Real-time', icon: Activity },
    { value: 'performance', label: 'Performance', icon: Zap },
    { value: 'user-behavior', label: 'User Behavior', icon: Users },
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'conversion', label: 'Conversion', icon: TrendingUp }
  ];

  const fetchAnalyticsData = useCallback(async (type: string = selectedType, period: string = selectedPeriod) => {
    try {
      setLoading(true);
      setError(null);
      setSlowRequest(false);

      const startTime = Date.now();
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'analyticsDashboard' as keyof typeof API_ENDPOINTS,
        { method: 'GET', query: { type, period } }
      );
      const duration = Date.now() - startTime;

      if (duration > 5000) {
        setSlowRequest(true);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics data');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setAnalyticsData(result.data);
        
        // Extract stats for the stats cards
        if (result.data.overview) {
          setStats({
            totalUsers: result.data.overview.totalUsers || 0,
            activeUsers: result.data.overview.activeUsers || 0,
            totalRevenue: result.data.overview.totalRevenue || 0,
            conversionRate: result.data.overview.conversionRate || 0,
            avgSessionDuration: result.data.overview.avgSessionDuration || 0,
            bounceRate: result.data.overview.bounceRate || 0,
            pageViews: result.data.overview.pageViews || 0,
            newUsers: result.data.overview.newUsers || 0,
            currentUsers: result.data.realTime?.currentUsers || 0,
            avgLoadTime: result.data.performance?.avgLoadTime || 0,
            errorRate: result.data.performance?.errorRate || 0,
            uptime: result.data.performance?.uptime || 0
          });
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedPeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const handleExport = async (format: string = 'json') => {
    try {
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'analyticsCustom' as keyof typeof API_ENDPOINTS,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'export_data',
            data: { format, filters: { period: selectedPeriod, type: selectedType } }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedType}-${selectedPeriod}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export data');
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive analytics and insights</p>
          </div>
        </div>

        {/* Loading State */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive analytics and insights</p>
          </div>
        </div>

        {/* Error State */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => fetchAnalyticsData()}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive analytics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => handleExport('json')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Slow Request Warning */}
      {slowRequest && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Slow Response</h3>
              <p className="text-sm text-yellow-700">Analytics data is taking longer than usual to load. This may be due to high server load.</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Analytics Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {analyticsTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSelectedType(type.value);
                      fetchAnalyticsData(type.value, selectedPeriod);
                    }}
                    className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border ${
                      selectedType === type.value
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                fetchAnalyticsData(selectedType, e.target.value);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalUsers)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.activeUsers)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{formatPercentage(stats.conversionRate)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Session</p>
                <p className="text-2xl font-semibold text-gray-900">{formatDuration(stats.avgSessionDuration)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bounce Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{formatPercentage(stats.bounceRate)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Page Views</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.pageViews)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-8 w-8 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Uptime</p>
                <p className="text-2xl font-semibold text-gray-900">{formatPercentage(stats.uptime)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Content */}
      {analyticsData && (
        <div className="space-y-6">
          {selectedType === 'realtime' && analyticsData.realTime && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Activity</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Users</span>
                    <span className="text-2xl font-semibold text-green-600">{analyticsData.realTime.currentUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Page Views</span>
                    <span className="text-2xl font-semibold text-blue-600">{analyticsData.realTime.pageViews}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Events</span>
                    <span className="text-2xl font-semibold text-purple-600">{analyticsData.realTime.events}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Pages</h3>
                <div className="space-y-2">
                  {analyticsData.realTime.topPages?.map((page, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 truncate">{page.page}</span>
                      <span className="text-sm font-medium text-gray-900">{page.views}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedType === 'performance' && analyticsData.performance && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Load Time</span>
                    <span className="text-2xl font-semibold text-blue-600">{analyticsData.performance.avgLoadTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="text-2xl font-semibold text-red-600">{formatPercentage(analyticsData.performance.errorRate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="text-2xl font-semibold text-green-600">{formatPercentage(analyticsData.performance.uptime)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Core Web Vitals</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">LCP</span>
                    <span className="text-sm font-medium text-gray-900">{analyticsData.performance.coreWebVitals.lcp}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">FID</span>
                    <span className="text-sm font-medium text-gray-900">{analyticsData.performance.coreWebVitals.fid}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CLS</span>
                    <span className="text-sm font-medium text-gray-900">{analyticsData.performance.coreWebVitals.cls}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedType === 'revenue' && analyticsData.revenue && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="text-2xl font-semibold text-green-600">{formatCurrency(analyticsData.revenue.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Order Value</span>
                    <span className="text-2xl font-semibold text-blue-600">{formatCurrency(analyticsData.revenue.averageOrderValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Growth Rate</span>
                    <span className="text-2xl font-semibold text-purple-600">{formatPercentage(analyticsData.revenue.revenueGrowth)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Source</h3>
                <div className="space-y-2">
                  {analyticsData.revenue.revenueBySource?.map((source, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{source.source}</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(source.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedType === 'conversion' && analyticsData.conversion && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overall Rate</span>
                    <span className="text-2xl font-semibold text-green-600">{formatPercentage(analyticsData.conversion.overallRate)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Funnel Steps</h3>
                <div className="space-y-2">
                  {analyticsData.conversion.funnelSteps?.map((step, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{step.step}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{step.users}</span>
                        <span className="text-xs text-gray-500">({formatPercentage(step.conversion)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}