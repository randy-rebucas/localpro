"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Store, 
  DollarSign, 
  Calendar,
  Eye,
  Download,
  RefreshCw,
  Activity,
  Clock
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    totalServices: number;
    totalBookings: number;
    averageRating: number;
    growthRate: number;
    conversionRate: number;
    avgResponseTime: number;
    errorRate: number;
  };
  userGrowth: {
    period: string;
    users: number;
    growth: number;
  }[];
  revenueData: {
    period: string;
    revenue: number;
    growth: number;
  }[];
  topServices: {
    id: string;
    name: string;
    bookings: number;
    revenue: number;
    rating: number;
  }[];
  topCategories: {
    category: string;
    services: number;
    bookings: number;
    revenue: number;
  }[];
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
  };
  marketplaceStats: {
    totalListings: number;
    activeListings: number;
    completedBookings: number;
    pendingBookings: number;
    totalEarnings: number;
    averageBookingValue: number;
  };
  jobStats: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    totalApplications: number;
    averageApplicationRate: number;
  };
  referralStats: {
    totalReferrals: number;
    successfulReferrals: number;
    totalRewards: number;
    conversionRate: number;
  };
  agencyStats: {
    totalAgencies: number;
    activeAgencies: number;
    totalProviders: number;
    totalRevenue: number;
  };
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real analytics data from admin API
      const response = await fetch(`/api/admin/analytics?type=${selectedType}&period=${timeRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch analytics data`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load analytics data');
      }

      // Transform API data to match our interface
      const transformedData = transformApiData(result.data);
      setAnalyticsData(transformedData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedType]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const transformApiData = (apiData: Record<string, unknown>): AnalyticsData => {
    // Transform API response to match our interface
    const baseData = {
      overview: {
        totalUsers: Number(apiData.totalUsers) || 0,
        activeUsers: Number(apiData.activeUsers) || 0,
        totalRevenue: Number(apiData.totalRevenue) || 0,
        totalServices: Number(apiData.totalServices) || 0,
        totalBookings: Number(apiData.totalBookings) || 0,
        averageRating: Number(apiData.averageRating) || 0,
        growthRate: Number(apiData.growthRate) || 0,
        conversionRate: Number(apiData.conversionRate) || 0,
        avgResponseTime: Number(apiData.avgResponseTime) || 0,
        errorRate: Number(apiData.errorRate) || 0
      },
      userGrowth: Array.isArray(apiData.userGrowth) ? apiData.userGrowth as { period: string; users: number; growth: number; }[] : [],
      revenueData: Array.isArray(apiData.revenueData) ? apiData.revenueData as { period: string; revenue: number; growth: number; }[] : [],
      topServices: Array.isArray(apiData.topServices) ? apiData.topServices as { id: string; name: string; bookings: number; revenue: number; rating: number; }[] : [],
      topCategories: Array.isArray(apiData.topCategories) ? apiData.topCategories as { category: string; services: number; bookings: number; revenue: number; }[] : [],
      userEngagement: {
        dailyActiveUsers: Number(apiData.dailyActiveUsers) || 0,
        weeklyActiveUsers: Number(apiData.weeklyActiveUsers) || 0,
        monthlyActiveUsers: Number(apiData.monthlyActiveUsers) || 0,
        averageSessionDuration: Number(apiData.averageSessionDuration) || 0
      },
      marketplaceStats: {
        totalListings: Number(apiData.totalListings) || 0,
        activeListings: Number(apiData.activeListings) || 0,
        completedBookings: Number(apiData.completedBookings) || 0,
        pendingBookings: Number(apiData.pendingBookings) || 0,
        totalEarnings: Number(apiData.totalEarnings) || 0,
        averageBookingValue: Number(apiData.averageBookingValue) || 0
      },
      jobStats: {
        totalJobs: Number(apiData.totalJobs) || 0,
        activeJobs: Number(apiData.activeJobs) || 0,
        completedJobs: Number(apiData.completedJobs) || 0,
        totalApplications: Number(apiData.totalApplications) || 0,
        averageApplicationRate: Number(apiData.averageApplicationRate) || 0
      },
      referralStats: {
        totalReferrals: Number(apiData.totalReferrals) || 0,
        successfulReferrals: Number(apiData.successfulReferrals) || 0,
        totalRewards: Number(apiData.totalRewards) || 0,
        conversionRate: Number(apiData.conversionRate) || 0
      },
      agencyStats: {
        totalAgencies: Number(apiData.totalAgencies) || 0,
        activeAgencies: Number(apiData.activeAgencies) || 0,
        totalProviders: Number(apiData.totalProviders) || 0,
        totalRevenue: Number(apiData.totalRevenue) || 0
      }
    };

    return baseData;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?type=${selectedType}&period=${timeRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${selectedType}-${timeRange}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <Loading 
        size="xl" 
        text="Loading analytics..." 
        fullScreen={true}
        variant="default"
      />
    );
  }

  if (error) {
    return (
      <AdminErrorState 
        error={error}
        onRetry={() => window.location.reload()}
        retryText="Try Again"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-sm">Platform performance and insights</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="overview">Overview</option>
            <option value="user">User Analytics</option>
            <option value="marketplace">Marketplace</option>
            <option value="jobs">Jobs</option>
            <option value="referrals">Referrals</option>
            <option value="agencies">Agencies</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {analyticsData?.overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Users</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.overview.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{analyticsData.overview.activeUsers.toLocaleString()} active</p>
              </div>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              {analyticsData.overview.growthRate >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
              )}
              <span className={`font-medium ${analyticsData.overview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analyticsData.overview.growthRate >= 0 ? '+' : ''}{analyticsData.overview.growthRate.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Services</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.overview.totalServices.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Listings</p>
              </div>
              <Store className="w-5 h-5 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">${analyticsData.overview.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{analyticsData.overview.conversionRate.toFixed(1)}% conversion</p>
              </div>
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-yellow-600 font-medium">Revenue</span>
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Bookings</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.overview.totalBookings.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{analyticsData.overview.averageRating.toFixed(1)}★ avg rating</p>
              </div>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-purple-600 font-medium">Completed</span>
            </div>
          </div>
        </div>
      )}

      {/* System Performance */}
      {analyticsData?.overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-cyan-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Response Time</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.overview.avgResponseTime.toFixed(1)}s</p>
                <p className="text-xs text-gray-500">
                  {analyticsData.overview.avgResponseTime < 2 ? 'Excellent' : 'Good'}
                </p>
              </div>
              <Clock className="w-5 h-5 text-cyan-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Error Rate</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.overview.errorRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  {analyticsData.overview.errorRate < 1 ? 'Low' : 'High'}
                </p>
              </div>
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Daily Active Users</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.userEngagement?.dailyActiveUsers.toLocaleString() || '0'}</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-pink-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Session Duration</p>
                <p className="text-lg font-bold text-gray-900">{Math.round(analyticsData.userEngagement?.averageSessionDuration || 0)}m</p>
                <p className="text-xs text-gray-500">Average</p>
              </div>
              <Eye className="w-5 h-5 text-pink-600" />
            </div>
          </div>
        </div>
      )}

      {/* Additional Analytics based on selected type */}
      {selectedType === 'marketplace' && analyticsData?.marketplaceStats && (
        <div className="bg-white rounded shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Marketplace Analytics</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Total Listings</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.marketplaceStats.totalListings.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Active Listings</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.marketplaceStats.activeListings.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Completed Bookings</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.marketplaceStats.completedBookings.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Pending Bookings</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.marketplaceStats.pendingBookings.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Total Earnings</p>
                <p className="text-lg font-bold text-gray-900">${analyticsData.marketplaceStats.totalEarnings.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Avg Booking Value</p>
                <p className="text-lg font-bold text-gray-900">${analyticsData.marketplaceStats.averageBookingValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedType === 'jobs' && analyticsData?.jobStats && (
        <div className="bg-white rounded shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Job Analytics</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Total Jobs</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.jobStats.totalJobs.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Active Jobs</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.jobStats.activeJobs.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Completed Jobs</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.jobStats.completedJobs.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Total Applications</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.jobStats.totalApplications.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Application Rate</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.jobStats.averageApplicationRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedType === 'referrals' && analyticsData?.referralStats && (
        <div className="bg-white rounded shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Referral Analytics</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Total Referrals</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.referralStats.totalReferrals.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Successful Referrals</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.referralStats.successfulReferrals.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Total Rewards</p>
                <p className="text-lg font-bold text-gray-900">${analyticsData.referralStats.totalRewards.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Conversion Rate</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.referralStats.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedType === 'agencies' && analyticsData?.agencyStats && (
        <div className="bg-white rounded shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Agency Analytics</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Total Agencies</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.agencyStats.totalAgencies.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Active Agencies</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.agencyStats.activeAgencies.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Total Providers</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.agencyStats.totalProviders.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">Agency Revenue</p>
                <p className="text-lg font-bold text-gray-900">${analyticsData.agencyStats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top Services */}
        {analyticsData?.topServices && analyticsData.topServices.length > 0 && (
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Top Performing Services</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.topServices.slice(0, 5).map((service, index) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {service.bookings.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        ${service.revenue.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">{service.rating.toFixed(1)}</span>
                          <span className="text-xs text-yellow-500 ml-1">★</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Categories */}
        {analyticsData?.topCategories && analyticsData.topCategories.length > 0 && (
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Top Categories</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.topCategories.map((category, index) => (
                    <tr key={category.category} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.category}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {category.services.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {category.bookings.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        ${category.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">User Growth Trends</h3>
          </div>
          <div className="p-4">
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chart visualization</p>
                <p className="text-xs text-gray-400">Integration with charting library needed</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Revenue Trends</h3>
          </div>
          <div className="p-4">
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chart visualization</p>
                <p className="text-xs text-gray-400">Integration with charting library needed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
