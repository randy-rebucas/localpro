"use client";

import { useState, useEffect } from "react";
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
  RefreshCw
} from "lucide-react";
import { Loading } from "@/components/ui/loading";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    totalServices: number;
    totalBookings: number;
    averageRating: number;
    growthRate: number;
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
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use mock data for now since API endpoints may not exist
      const mockData = {
        overview: {
          totalUsers: 2500,
          activeUsers: 1800,
          totalRevenue: 150000,
          totalServices: 120,
          totalBookings: 3500,
          averageRating: 4.7,
          growthRate: 18.5
        },
        userGrowth: [
          { period: '2024-01', users: 2000, growth: 15.2 },
          { period: '2024-02', users: 2200, growth: 10.0 },
          { period: '2024-03', users: 2500, growth: 13.6 }
        ],
        revenueData: [
          { period: '2024-01', revenue: 120000, growth: 12.5 },
          { period: '2024-02', revenue: 135000, growth: 12.5 },
          { period: '2024-03', revenue: 150000, growth: 11.1 }
        ],
        topServices: [
          { id: '1', name: 'House Cleaning', bookings: 150, revenue: 15000, rating: 4.8 },
          { id: '2', name: 'Plumbing Repair', bookings: 120, revenue: 18000, rating: 4.7 },
          { id: '3', name: 'Electrical Work', bookings: 100, revenue: 20000, rating: 4.9 }
        ],
        topCategories: [
          { category: 'CLEANING', services: 45, bookings: 800, revenue: 80000 },
          { category: 'PLUMBING', services: 30, bookings: 600, revenue: 90000 },
          { category: 'ELECTRICAL', services: 25, bookings: 500, revenue: 100000 }
        ],
        userEngagement: {
          dailyActiveUsers: 450,
          weeklyActiveUsers: 1200,
          monthlyActiveUsers: 1800,
          averageSessionDuration: 25
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAnalyticsData(mockData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Platform performance and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {analyticsData?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-700">{analyticsData.overview.totalUsers.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {analyticsData.overview.growthRate >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${analyticsData.overview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(analyticsData.overview.growthRate)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Store className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Services</p>
                <p className="text-2xl font-bold text-gray-700">{analyticsData.overview.totalServices.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500">Active listings</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-700">${analyticsData.overview.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500">All time</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-700">{analyticsData.overview.totalBookings.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Engagement */}
      {analyticsData?.userEngagement && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Daily Active Users</p>
                <p className="text-2xl font-bold text-gray-700">{analyticsData.userEngagement.dailyActiveUsers.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Weekly Active Users</p>
                <p className="text-2xl font-bold text-gray-700">{analyticsData.userEngagement.weeklyActiveUsers.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Active Users</p>
                <p className="text-2xl font-bold text-gray-700">{analyticsData.userEngagement.monthlyActiveUsers.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Session Duration</p>
                <p className="text-2xl font-bold text-gray-700">{Math.round(analyticsData.userEngagement.averageSessionDuration)}m</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Eye className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        {analyticsData?.topServices && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Performing Services</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.topServices.slice(0, 5).map((service, index) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-gray-500">{service.bookings} bookings • ${service.revenue.toFixed(2)} revenue</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{service.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 ml-1">★</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Categories */}
        {analyticsData?.topCategories && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Categories</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.topCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{category.category}</p>
                        <p className="text-xs text-gray-500">{category.services} services • {category.bookings} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${category.revenue.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Growth Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart visualization would go here</p>
              <p className="text-sm text-gray-400">Integration with charting library needed</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart visualization would go here</p>
              <p className="text-sm text-gray-400">Integration with charting library needed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
