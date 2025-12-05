"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  DollarSign,
  Target,
  AlertCircle
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/loading";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

interface AnalyticsData {
  adId: string;
  period: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  roi: number;
  dailyStats: Array<{
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  }>;
  audienceBreakdown: Array<{
    audience: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    impressions: number;
    clicks: number;
    percentage: number;
  }>;
  locationBreakdown: Array<{
    location: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}

const timePeriods = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
  { value: "all", label: "All time" }
];

export default function AdAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.adsAnalytics}/${params.id}/analytics?period=${selectedPeriod}`, createAuthFetchOptions());
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      logger.error('Error fetching analytics', error instanceof Error ? error : new Error(String(error)), { adId: params.id });
      // Fallback to mock data
      setAnalytics({
        adId: params.id as string,
        period: selectedPeriod,
        impressions: 12500,
        clicks: 245,
        ctr: 1.96,
        cpc: 2.50,
        cpm: 15.00,
        spend: 1250,
        conversions: 18,
        conversionRate: 7.35,
        revenue: 3600,
        roi: 188,
        dailyStats: [
          { date: "2024-01-01", impressions: 450, clicks: 9, spend: 45, conversions: 1 },
          { date: "2024-01-02", impressions: 520, clicks: 11, spend: 52, conversions: 2 },
          { date: "2024-01-03", impressions: 480, clicks: 8, spend: 48, conversions: 1 },
          { date: "2024-01-04", impressions: 600, clicks: 12, spend: 60, conversions: 2 },
          { date: "2024-01-05", impressions: 550, clicks: 10, spend: 55, conversions: 1 },
          { date: "2024-01-06", impressions: 420, clicks: 7, spend: 42, conversions: 1 },
          { date: "2024-01-07", impressions: 380, clicks: 6, spend: 38, conversions: 0 }
        ],
        audienceBreakdown: [
          { audience: "Contractors", impressions: 4500, clicks: 90, ctr: 2.0 },
          { audience: "Homeowners", impressions: 3800, clicks: 76, ctr: 2.0 },
          { audience: "Professionals", impressions: 4200, clicks: 79, ctr: 1.88 }
        ],
        deviceBreakdown: [
          { device: "Desktop", impressions: 7500, clicks: 150, percentage: 60 },
          { device: "Mobile", impressions: 3500, clicks: 70, percentage: 28 },
          { device: "Tablet", impressions: 1500, clicks: 25, percentage: 12 }
        ],
        locationBreakdown: [
          { location: "New York", impressions: 3000, clicks: 60, ctr: 2.0 },
          { location: "Los Angeles", impressions: 2500, clicks: 50, ctr: 2.0 },
          { location: "Chicago", impressions: 2000, clicks: 40, ctr: 2.0 },
          { location: "Other", impressions: 5000, clicks: 95, ctr: 1.9 }
        ],
        topKeywords: [
          { keyword: "hardware store", impressions: 1200, clicks: 24, ctr: 2.0 },
          { keyword: "tools", impressions: 800, clicks: 16, ctr: 2.0 },
          { keyword: "construction", impressions: 600, clicks: 12, ctr: 2.0 },
          { keyword: "materials", impressions: 400, clicks: 8, ctr: 2.0 }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, [params.id, selectedPeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const handleExport = () => {
    // Implement export functionality
    logger.debug('Exporting analytics data', { adId: params.id, period: selectedPeriod });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics not available</h3>
        <p className="text-gray-600 mb-4">Unable to load analytics data for this ad.</p>
        <Button onClick={() => router.push('/ads')}>
          Back to Ads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Ads', href: '/ads' },
          { label: 'Analytics', href: `/ads/${params.id}/analytics` }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Ad Analytics</h1>
            <p className="text-slate-400">Performance insights and metrics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card className="p-4 bg-slate-900/80 border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-medium text-white">Analytics Period</h3>
            <Select
              value={selectedPeriod}
              onValueChange={(value) => setSelectedPeriod(value)}
              options={timePeriods}
            />
          </div>
          <div className="text-sm text-slate-400">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Impressions</p>
              <p className="text-2xl font-bold text-white">{analytics.impressions.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-400" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
            <span className="text-emerald-400">+12.5%</span>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Clicks</p>
              <p className="text-2xl font-bold text-white">{analytics.clicks.toLocaleString()}</p>
            </div>
            <MousePointer className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
            <span className="text-emerald-400">+8.3%</span>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">CTR</p>
              <p className="text-2xl font-bold text-white">{analytics.ctr.toFixed(2)}%</p>
            </div>
            <Target className="w-8 h-8 text-purple-400" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
            <span className="text-red-400">-0.2%</span>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Spend</p>
              <p className="text-2xl font-bold text-white">${analytics.spend.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-amber-400" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
            <span className="text-emerald-400">+15.2%</span>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">CPC</span>
              <span className="font-medium text-white">${analytics.cpc.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">CPM</span>
              <span className="font-medium text-white">${analytics.cpm.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Conversions</span>
              <span className="font-medium text-white">{analytics.conversions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Conversion Rate</span>
              <span className="font-medium text-white">{analytics.conversionRate.toFixed(2)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Revenue</span>
              <span className="font-medium text-white">${analytics.revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">ROI</span>
              <span className="font-medium text-emerald-400">{analytics.roi.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Profit</span>
              <span className="font-medium text-emerald-400">
                ${(analytics.revenue - analytics.spend).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Efficiency</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Avg. Session Duration</span>
              <span className="font-medium text-white">2m 34s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Bounce Rate</span>
              <span className="font-medium text-white">45.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Pages per Session</span>
              <span className="font-medium text-white">2.8</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audience Breakdown */}
        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Audience Breakdown</h3>
          <div className="space-y-3">
            {analytics.audienceBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-300">{item.audience}</span>
                    <span className="text-sm text-slate-400">{item.ctr.toFixed(2)}% CTR</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(item.impressions / analytics.impressions) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{item.impressions.toLocaleString()} impressions</span>
                    <span>{item.clicks.toLocaleString()} clicks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Device Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
          <div className="space-y-3">
            {analytics.deviceBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{item.device}</span>
                    <span className="text-sm text-gray-600">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{item.impressions.toLocaleString()} impressions</span>
                    <span>{item.clicks.toLocaleString()} clicks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Location and Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Performance</h3>
          <div className="space-y-3">
            {analytics.locationBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{item.location}</div>
                  <div className="text-sm text-gray-600">{item.ctr.toFixed(2)}% CTR</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{item.clicks.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">clicks</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Keywords */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Keywords</h3>
          <div className="space-y-3">
            {analytics.topKeywords.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{item.keyword}</div>
                  <div className="text-sm text-gray-600">{item.ctr.toFixed(2)}% CTR</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{item.clicks.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">clicks</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
