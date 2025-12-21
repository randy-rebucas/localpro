"use client";

/**
 * Analytics Dashboard Component
 * Displays real-time analytics and monitoring data
 * Only visible to admin users
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Users,
  Eye,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw
} from 'lucide-react';
import { analytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { useSession } from '@/hooks/useAuth';

interface AnalyticsData {
  realtime: {
    activeUsers: number;
    pageViews: number;
    events: number;
  };
  performance: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  errors: {
    count: number;
    recent: Array<{
      message: string;
      timestamp: number;
      url: string;
    }>;
  };
  userBehavior: {
    topPages: Array<{
      path: string;
      views: number;
      avgTime: number;
    }>;
    devices: {
      mobile: number;
      desktop: number;
      tablet: number;
    };
  };
}

export function AnalyticsDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Check if user is admin
  const isAdmin = session?.user?.roles?.includes('ADMIN') ?? false;

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // In a real implementation, this would fetch from your analytics API
      // For now, we'll use mock data
      const mockData: AnalyticsData = {
        realtime: {
          activeUsers: Math.floor(Math.random() * 100) + 50,
          pageViews: Math.floor(Math.random() * 500) + 200,
          events: Math.floor(Math.random() * 1000) + 300,
        },
        performance: {
          lcp: Math.random() * 2000 + 1000,
          fid: Math.random() * 100 + 10,
          cls: Math.random() * 0.1,
          fcp: Math.random() * 1500 + 500,
          ttfb: Math.random() * 500 + 100,
        },
        errors: {
          count: Math.floor(Math.random() * 10),
          recent: [
            {
              message: 'TypeError: Cannot read property of undefined',
              timestamp: Date.now() - 300000,
              url: '/marketplace',
            },
            {
              message: 'Network Error: Failed to fetch',
              timestamp: Date.now() - 600000,
              url: '/dashboard',
            },
          ],
        },
        userBehavior: {
          topPages: [
            { path: '/dashboard', views: 1250, avgTime: 180 },
            { path: '/marketplace', views: 890, avgTime: 240 },
            { path: '/messages', views: 650, avgTime: 120 },
            { path: '/profile', views: 420, avgTime: 90 },
          ],
          devices: {
            mobile: 65,
            desktop: 30,
            tablet: 5,
          },
        },
      };

      setData(mockData);
      setLastUpdate(new Date());
    } catch (error) {
      logger.error('Failed to fetch analytics data', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    
    fetchAnalyticsData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPerformanceRating = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    switch (metric) {
      case 'lcp':
      case 'fcp':
        if (value <= 2500) return 'good';
        if (value <= 4000) return 'needs-improvement';
        return 'poor';
      case 'fid':
        if (value <= 100) return 'good';
        if (value <= 300) return 'needs-improvement';
        return 'poor';
      case 'cls':
        if (value <= 0.1) return 'good';
        if (value <= 0.25) return 'needs-improvement';
        return 'poor';
      case 'ttfb':
        if (value <= 800) return 'good';
        if (value <= 1800) return 'needs-improvement';
        return 'poor';
      default:
        return 'good';
    }
  };

  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor'): string => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
    }
  };

  if (loading && !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Unable to load analytics data
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Real-time monitoring and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(data.realtime.activeUsers)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Page Views</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(data.realtime.pageViews)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Events</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(data.realtime.events)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(data.performance).map(([key, value]) => {
                const rating = getPerformanceRating(key, value);
                return (
                  <div key={key} className="text-center">
                    <Badge
                      variant="secondary"
                      className={`${getRatingColor(rating)} mb-2`}
                    >
                      {key.toUpperCase()}
                    </Badge>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatTime(value)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Largest Contentful Paint</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{formatTime(data.performance.lcp)}</span>
                    <Badge
                      variant="secondary"
                      className={getRatingColor(getPerformanceRating('lcp', data.performance.lcp))}
                    >
                      {getPerformanceRating('lcp', data.performance.lcp) === 'good' ? 'Good' :
                       getPerformanceRating('lcp', data.performance.lcp) === 'needs-improvement' ? 'Fair' : 'Poor'}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">First Input Delay</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{formatTime(data.performance.fid)}</span>
                    <Badge
                      variant="secondary"
                      className={getRatingColor(getPerformanceRating('fid', data.performance.fid))}
                    >
                      {getPerformanceRating('fid', data.performance.fid) === 'good' ? 'Good' :
                       getPerformanceRating('fid', data.performance.fid) === 'needs-improvement' ? 'Fair' : 'Poor'}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cumulative Layout Shift</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{data.performance.cls.toFixed(3)}</span>
                    <Badge
                      variant="secondary"
                      className={getRatingColor(getPerformanceRating('cls', data.performance.cls))}
                    >
                      {getPerformanceRating('cls', data.performance.cls) === 'good' ? 'Good' :
                       getPerformanceRating('cls', data.performance.cls) === 'needs-improvement' ? 'Fair' : 'Poor'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">First Contentful Paint</span>
                  <span className="font-medium">{formatTime(data.performance.fcp)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Time to First Byte</span>
                  <span className="font-medium">{formatTime(data.performance.ttfb)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Error Count (24h)</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{data.errors.count}</span>
                    {data.errors.count > 0 && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h3>
            {data.errors.recent.length > 0 ? (
              <div className="space-y-3">
                {data.errors.recent.map((error, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">{error.message}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-red-700">
                        <span>{error.url}</span>
                        <span>{new Date(error.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No errors reported in the last 24 hours</p>
            )}
          </Card>
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
              <div className="space-y-3">
                {data.userBehavior.topPages.map((page, index) => (
                  <div key={page.path} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{page.path}</p>
                        <p className="text-sm text-gray-600">{formatNumber(page.views)} views</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {Math.round(page.avgTime / 60)}m {page.avgTime % 60}s
                      </p>
                      <p className="text-xs text-gray-600">avg. time</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Mobile</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{data.userBehavior.devices.mobile}%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${data.userBehavior.devices.mobile}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">Desktop</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{data.userBehavior.devices.desktop}%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${data.userBehavior.devices.desktop}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Tablet</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{data.userBehavior.devices.tablet}%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${data.userBehavior.devices.tablet}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}



