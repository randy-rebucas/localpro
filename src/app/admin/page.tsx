"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  BookOpen, 
  CreditCard, 
  Home, 
  Megaphone, 
  MessageSquare, 
  Settings,
  Coins,
  Package,
  ArrowUpRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Download,
  Crown,
  Radio,
  FileText,
  Eye,
  Clock,
  Database,
  Wifi,
  Mail
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
// Lazy load admin error state
import { LazyAdminErrorState } from "@/lib/lazy-components";
// Role access hooks available for future use
// import { useRoleAccess } from "@/components/role-guard";
// import { useSession } from "@/hooks/useAuth";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { useAnalyticsDashboard, useAnalyticsRealtime, useAnalyticsFinancial, useAnalyticsExport, Timeframe } from "@/hooks/useAnalytics";
import { useLogStats, useLogs } from "@/hooks/useLogs";
import { useGlobalActivityStats, useActivityFeed } from "@/hooks/useActivities";
import { useToast, ToastContainer } from "@/components/ui/toast";

interface ModuleStats {
  supplies: number;
  academy: number;
  rentals: number;
  ads: number;
  communication: number;
  broadcaster: number;
}

type RecentActivityItem = {
  _id?: string;
  id?: string;
  category?: string;
  title?: string;
  description?: string;
  type?: string;
  user?: string | { fullName?: string; email?: string };
  createdAt?: string | number | Date;
};

type RecentLogItem = {
  _id?: string;
  id?: string;
  level?: string;
  message?: string;
  source?: string;
  category?: string;
  timestamp?: string | number | Date;
};

export default function AdminDashboard() {
  // State
  const [moduleStats, setModuleStats] = useState<ModuleStats>({
    supplies: 0,
    academy: 0,
    rentals: 0,
    ads: 0,
    communication: 0,
    broadcaster: 0,
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("30d");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  
  // Toast hook
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();
  
  // Analytics hooks
  const { 
    dashboard, 
    loading: dashboardLoading, 
    error: dashboardError, 
    refetch: refetchDashboard 
  } = useAnalyticsDashboard(selectedTimeframe);

  const { 
    realtime, 
    loading: realtimeLoading, 
    refetch: refetchRealtime 
  } = useAnalyticsRealtime(30000); // Auto-refresh every 30 seconds

  const { 
    financial, 
    refetch: refetchFinancial 
  } = useAnalyticsFinancial(selectedTimeframe);

  const { downloadExport, loading: exportLoading } = useAnalyticsExport();

  // Logs hooks
  const { 
    stats: logStats, 
    loading: logStatsLoading, 
    refetch: refetchLogStats 
  } = useLogStats();

  const { 
    logs: recentLogs, 
    loading: logsLoading, 
    refetch: refetchLogs 
  } = useLogs({ limit: 5, sortOrder: "desc" });

  // Activity hooks
  const { 
    stats: activityStats, 
    refetch: refetchActivityStats 
  } = useGlobalActivityStats();

  const { 
    activities: recentActivities, 
    loading: activitiesLoading, 
    refetch: refetchActivities 
  } = useActivityFeed({ limit: 5 });

  // Computed loading state
  const loading = dashboardLoading && !dashboard;
  const error = dashboardError;

  // Fetch module stats on mount
  const fetchModuleStats = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      // Fetch stats for each module in parallel
      const [suppliesRes, academyRes, rentalsRes, adsRes, communicationRes, broadcasterRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/supplies?limit=1`, createAuthFetchOptions({ method: 'GET' })),
        fetch(`${API_BASE_URL}/api/academy/courses?limit=1`, createAuthFetchOptions({ method: 'GET' })),
        fetch(`${API_BASE_URL}/api/rentals?limit=1`, createAuthFetchOptions({ method: 'GET' })),
        fetch(`${API_BASE_URL}/api/ads?limit=1`, createAuthFetchOptions({ method: 'GET' })),
        fetch(`${API_BASE_URL}/api/communication/messages?limit=1`, createAuthFetchOptions({ method: 'GET' })),
        fetch(`${API_BASE_URL}${API_ENDPOINTS.broadcaster}?limit=1`, createAuthFetchOptions({ method: 'GET' })),
      ]);

      const parseCount = (result: PromiseSettledResult<Response>) => {
        if (result.status === 'fulfilled' && result.value.ok) {
          return result.value.headers.get('x-total-count') || 
                 result.value.json().then((data: { total?: number; count?: number }) => data?.total || data?.count || 0).catch(() => 0);
        }
        return Promise.resolve(0);
      };

      const [suppliesCount, academyCount, rentalsCount, adsCount, communicationCount, broadcasterCount] = await Promise.all([
        parseCount(suppliesRes),
        parseCount(academyRes),
        parseCount(rentalsRes),
        parseCount(adsRes),
        parseCount(communicationRes),
        parseCount(broadcasterRes),
      ]);

      setModuleStats({
        supplies: typeof suppliesCount === 'number' ? suppliesCount : 0,
        academy: typeof academyCount === 'number' ? academyCount : 0,
        rentals: typeof rentalsCount === 'number' ? rentalsCount : 0,
        ads: typeof adsCount === 'number' ? adsCount : 0,
        communication: typeof communicationCount === 'number' ? communicationCount : 0,
        broadcaster: typeof broadcasterCount === 'number' ? broadcasterCount : 0,
      });
    } catch {
      // Silently handle module stats errors
    }
  }, []);

  // Initial fetch of module stats
  // Use useEffect to avoid state update on unmounted component
  useEffect(() => {
    fetchModuleStats();
  }, [fetchModuleStats]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchDashboard(),
        refetchRealtime(),
        refetchFinancial(),
        refetchLogStats(),
        refetchLogs(),
        refetchActivityStats(),
        refetchActivities(),
        fetchModuleStats(),
      ]);
      setLastUpdated(new Date());
      toastSuccess("Dashboard data refreshed");
    } catch {
      toastError("Failed to refresh some data");
    } finally {
      setRefreshing(false);
    }
  }, [refetchDashboard, refetchRealtime, refetchFinancial, refetchLogStats, refetchLogs, refetchActivityStats, refetchActivities, fetchModuleStats, toastSuccess, toastError]);

  // Handle export
  const handleExport = useCallback(async (format: "json" | "csv") => {
    const exportSuccess = await downloadExport({ 
      type: "overview", 
      timeframe: selectedTimeframe, 
      format 
    });
    if (exportSuccess) {
      toastSuccess(`Analytics exported as ${format.toUpperCase()}`);
    } else {
      toastError("Failed to export analytics");
    }
  }, [downloadExport, selectedTimeframe, toastSuccess, toastError]);

  // Computed stats from dashboard
  const stats = useMemo(() => {
    if (!dashboard?.summary) return null;
    const summary = dashboard.summary;
    const growth = summary.growth || {};
    return {
      totalUsers: summary.users?.total || 0,
      newUsersToday: summary.users?.new || 0,
      activeServices: summary.services?.total || 0,
      totalRevenue: summary.revenue?.total || 0,
      activeBookings: summary.bookings?.total || 0,
      completedBookings: summary.bookings?.completed || 0,
      completionRate: summary.bookings?.completionRate || "0%",
      totalJobs: summary.jobs?.total || 0,
      jobApplications: summary.jobs?.applications || 0,
      totalReferrals: summary.referrals?.total || 0,
      growthUsers: growth.users || "0%",
      growthRevenue: growth.revenue || "0%",
      growthBookings: growth.bookings || "0%",
    };
  }, [dashboard]);

  // Memoize modules array to prevent unnecessary recalculations
  const modules = useMemo(() => [
    {
      name: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-500",
      stats: stats ? `${stats.totalUsers.toLocaleString()} users` : "Loading..."
    },
    {
      name: "Marketplace",
      description: "Manage services, bookings, and reviews",
      icon: ShoppingCart,
      href: "/admin/marketplace",
      color: "bg-green-500",
      stats: stats ? `${stats.activeServices.toLocaleString()} services` : "Loading..."
    },
    {
      name: "Supplies",
      description: "Manage supply products and orders",
      icon: Package,
      href: "/admin/supplies",
      color: "bg-purple-500",
      stats: moduleStats.supplies > 0 ? `${moduleStats.supplies.toLocaleString()} products` : "View products"
    },
    {
      name: "Academy",
      description: "Manage courses and enrollments",
      icon: BookOpen,
      href: "/admin/academy",
      color: "bg-indigo-500",
      stats: moduleStats.academy > 0 ? `${moduleStats.academy.toLocaleString()} courses` : "View courses"
    },
    {
      name: "Finance",
      description: "Financial overview and transactions",
      icon: CreditCard,
      href: "/admin/finance",
      color: "bg-yellow-500",
      stats: financial?.summary?.totalRevenue 
        ? `₱${financial.summary.totalRevenue.toLocaleString()}` 
        : stats ? `₱${stats.totalRevenue.toLocaleString()}` : "Loading..."
    },
    {
      name: "Rentals",
      description: "Manage rental items and bookings",
      icon: Home,
      href: "/admin/rentals",
      color: "bg-orange-500",
      stats: moduleStats.rentals > 0 ? `${moduleStats.rentals.toLocaleString()} rentals` : "View rentals"
    },
    {
      name: "Ads",
      description: "Manage advertisements and campaigns",
      icon: Megaphone,
      href: "/admin/ads",
      color: "bg-pink-500",
      stats: moduleStats.ads > 0 ? `${moduleStats.ads.toLocaleString()} active ads` : "View ads"
    },
    {
      name: "Communication",
      description: "Messages and notifications",
      icon: MessageSquare,
      href: "/admin/communication",
      color: "bg-cyan-500",
      stats: moduleStats.communication > 0 ? `${moduleStats.communication.toLocaleString()} messages` : "View messages"
    },
    {
      name: "Broadcaster",
      description: "Manage broadcasts for clients",
      icon: Radio,
      href: "/admin/broadcaster",
      color: "bg-teal-500",
      stats: moduleStats.broadcaster > 0 ? `${moduleStats.broadcaster.toLocaleString()} broadcasts` : "View broadcasts"
    },
    {
      name: "Email Marketing",
      description: "Campaigns and subscriber management",
      icon: Mail,
      href: "/admin/email-marketing",
      color: "bg-rose-500",
      stats: "Manage campaigns"
    },
    {
      name: "Analytics",
      description: "Platform analytics and insights",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-violet-500",
      stats: realtime ? `${realtime.activeUsers?.last15Minutes || 0} active now` : "Real-time data"
    },
    {
      name: "Logs",
      description: "System logs and error tracking",
      icon: FileText,
      href: "/admin/logs",
      color: "bg-slate-500",
      stats: logStats ? `${logStats.totalLogs?.toLocaleString() || 0} entries` : "View logs"
    },
    {
      name: "Plus",
      description: "Manage subscription plans and revenue",
      icon: Crown,
      href: "/admin/plus",
      color: "bg-amber-500",
      stats: financial?.summary?.totalRevenue 
        ? `₱${financial.summary.totalRevenue.toLocaleString()} revenue` 
        : "Loading..."
    },
    {
      name: "System",
      description: "System settings and monitoring",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-500",
      stats: logStats?.errorRate !== undefined 
        ? (logStats.errorRate < 1 ? "Healthy" : "Needs Attention") 
        : "Loading..."
    }
  ], [stats, moduleStats, financial, realtime, logStats]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading admin dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <LazyAdminErrorState 
        error={error}
        onRetry={refreshData}
        retryText="Try Again"
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 text-sm">LocalPro administration panel</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {/* Timeframe Selector */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as Timeframe)}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <p className="text-xs text-gray-500">
            Updated: {lastUpdated.toLocaleTimeString()}
          </p>
          
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

      {/* Real-time Status Bar */}
      {realtime && !realtimeLoading && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-800">Live</span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-green-700">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span><strong>{realtime.activeUsers?.last15Minutes || 0}</strong> active users</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span><strong>{realtime.bookings?.lastHour || 0}</strong> bookings/hr</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Coins className="w-4 h-4" />
                  <span><strong>₱{(realtime.revenue?.lastHour || 0).toLocaleString()}</strong> revenue/hr</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span><strong>{realtime.newUsers?.lastHour || 0}</strong> new users/hr</span>
                </div>
              </div>
            </div>
            <span className="text-xs text-green-600">
              {realtime.timestamp ? new Date(realtime.timestamp).toLocaleTimeString() : ""}
            </span>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Total Users</p>
              <p className="text-xl font-bold text-gray-900">
                {stats?.totalUsers.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500">
                +{stats?.newUsersToday || 0} today
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {stats?.growthUsers && parseFloat(stats.growthUsers) > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
            )}
            <span className={`font-medium ${stats?.growthUsers && parseFloat(stats.growthUsers) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats?.growthUsers || '0%'}
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Active Services</p>
              <p className="text-xl font-bold text-gray-900">
                {stats?.activeServices.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500">
                {stats?.activeBookings || 0} bookings ({stats?.completionRate || '0%'})
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {stats?.growthBookings && parseFloat(stats.growthBookings) > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
            )}
            <span className={`font-medium ${stats?.growthBookings && parseFloat(stats.growthBookings) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats?.growthBookings || '0%'}
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">
                ₱{(financial?.summary?.totalRevenue || stats?.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {financial?.summary?.transactionCount || 0} transactions
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Coins className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {(stats?.growthRevenue && parseFloat(stats.growthRevenue) > 0) || (financial?.summary?.growth && parseFloat(financial.summary.growth) > 0) ? (
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
            )}
            <span className={`font-medium ${(stats?.growthRevenue && parseFloat(stats.growthRevenue) > 0) || (financial?.summary?.growth && parseFloat(financial.summary.growth) > 0) ? 'text-green-600' : 'text-red-600'}`}>
              {financial?.summary?.growth || stats?.growthRevenue || '0%'}
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Jobs & Applications</p>
              <p className="text-xl font-bold text-gray-900">
                {stats?.totalJobs || '0'}
              </p>
              <p className="text-xs text-gray-500">
                {stats?.jobApplications || 0} applications
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="text-purple-600 font-medium">{stats?.totalReferrals || 0} referrals</span>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Total Logs</p>
              <p className="text-lg font-bold text-gray-900">
                {logStats?.totalLogs?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">
                {logStats?.last24Hours?.total?.toLocaleString() || 0} last 24h
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Database className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Response Time</p>
              <p className="text-lg font-bold text-gray-900">
                {logStats?.averageResponseTime ? `${logStats.averageResponseTime.toFixed(0)}ms` : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {logStats?.averageResponseTime && logStats.averageResponseTime < 200 ? 'Excellent' : logStats?.averageResponseTime && logStats.averageResponseTime < 500 ? 'Good' : 'Needs Attention'}
              </p>
            </div>
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Clock className="w-4 h-4 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Error Rate</p>
              <p className="text-lg font-bold text-gray-900">
                {logStats?.errorRate !== undefined ? `${logStats.errorRate.toFixed(2)}%` : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {logStats?.recentErrors || 0} recent errors
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Active Users</p>
              <p className="text-lg font-bold text-gray-900">
                {activityStats?.activeUsersToday || 0}
              </p>
              <p className="text-xs text-gray-500">
                {activityStats?.activeUsersWeek || 0} this week
              </p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Wifi className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Log Level Summary */}
      {logStats && !logStatsLoading && (
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Log Summary</h3>
            <Link href="/admin/logs" className="text-xs text-blue-600 hover:text-blue-800">View All</Link>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {logStats.byLevel && Object.entries(logStats.byLevel).map(([level, count]) => {
              const colors: Record<string, string> = {
                debug: 'bg-gray-100 text-gray-700 border-gray-200',
                info: 'bg-blue-100 text-blue-700 border-blue-200',
                warn: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                error: 'bg-red-100 text-red-700 border-red-200',
                fatal: 'bg-purple-100 text-purple-700 border-purple-200',
              };
              return (
                <div key={level} className={`rounded p-2 text-center border ${colors[level] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  <p className="text-xs uppercase font-medium">{level}</p>
                  <p className="text-lg font-bold">{(count as number)?.toLocaleString() || 0}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-900">Recent Activities</h3>
            <Link href="/admin/activities" className="text-xs text-blue-600 hover:text-blue-800">View All</Link>
          </div>
          <div className="p-4">
            {activitiesLoading ? (
              <div className="flex justify-center py-4">
                <Loading size="sm" />
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-2">
                {recentActivities.slice(0, 5).map((activity: RecentActivityItem) => (
                  <div key={activity._id || activity.id} className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.category === 'financial' ? 'bg-green-500' :
                        activity.category === 'marketplace' ? 'bg-blue-500' :
                        activity.category === 'social' ? 'bg-purple-500' :
                        activity.category === 'learning' ? 'bg-indigo-500' :
                        'bg-gray-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-900 font-medium truncate">
                          {activity.title || activity.description || activity.type}
                        </p>
                        <span className="text-xs px-1 py-0.5 rounded bg-gray-100 text-gray-600">
                          {activity.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 truncate">
                          {typeof activity.user === 'object' 
                            ? activity.user.fullName || activity.user.email 
                            : activity.user || 'Unknown'}
                        </p>
                        <span className="text-xs text-gray-400">
                          {activity.createdAt ? new Date(activity.createdAt).toLocaleTimeString() : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-2 text-sm">No recent activity</p>
            )}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-900">Recent Logs</h3>
            <Link href="/admin/logs" className="text-xs text-blue-600 hover:text-blue-800">View All</Link>
          </div>
          <div className="p-4">
            {logsLoading ? (
              <div className="flex justify-center py-4">
                <Loading size="sm" />
              </div>
            ) : recentLogs && recentLogs.length > 0 ? (
              <div className="space-y-2">
                {recentLogs.slice(0, 5).map((log: RecentLogItem, idx: number) => {
                  const levelColors: Record<string, string> = {
                    debug: 'bg-gray-100 text-gray-700',
                    info: 'bg-blue-100 text-blue-700',
                    warn: 'bg-yellow-100 text-yellow-700',
                    error: 'bg-red-100 text-red-700',
                    fatal: 'bg-purple-100 text-purple-700',
                  };
                  const level = log.level || 'info';
                  return (
                    <div key={log._id || log.id || idx} className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50 transition-colors">
                      <span className={`text-xs px-1.5 py-0.5 rounded uppercase font-medium ${levelColors[level] || 'bg-gray-100 text-gray-700'}`}>
                        {level}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900 font-medium truncate">{log.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">{log.source || log.category || 'system'}</p>
                          <span className="text-xs text-gray-400">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-2 text-sm">No recent logs</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-base font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link 
              href="/admin/users"
              className="text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors group block"
            >
              <div className="flex items-center">
                <Users className="w-4 h-4 text-blue-600 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Manage Users</p>
                  <p className="text-xs text-gray-500">View and edit accounts</p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>
            
            <Link 
              href="/admin/settings"
              className="text-left px-3 py-2 bg-green-50 hover:bg-green-100 rounded transition-colors group block"
            >
              <div className="flex items-center">
                <Settings className="w-4 h-4 text-green-600 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">System Settings</p>
                  <p className="text-xs text-gray-500">Configure platform</p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
            </Link>
            
            <Link 
              href="/admin/analytics"
              className="text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded transition-colors group block"
            >
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 text-purple-600 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">View Analytics</p>
                  <p className="text-xs text-gray-500">Performance metrics</p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </Link>

            <Link 
              href="/admin/logs"
              className="text-left px-3 py-2 bg-red-50 hover:bg-red-100 rounded transition-colors group block"
            >
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-red-600 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">View Logs</p>
                  <p className="text-xs text-gray-500">System & error logs</p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-gray-400 group-hover:text-red-600 transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Top Metrics from Dashboard */}
      {dashboard?.topMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Top Providers */}
          {dashboard.topMetrics.topProviders && dashboard.topMetrics.topProviders.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Top Providers</h3>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  {dashboard.topMetrics.topProviders.slice(0, 5).map((provider, idx) => (
                    <div key={provider.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-900 truncate">{provider.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-900">₱{provider.revenue?.toLocaleString() || 0}</p>
                        <p className="text-xs text-gray-500">{provider.bookings} bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Services */}
          {dashboard.topMetrics.topServices && dashboard.topMetrics.topServices.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Top Services</h3>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  {dashboard.topMetrics.topServices.slice(0, 5).map((service, idx) => (
                    <div key={service.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 flex items-center justify-center bg-green-100 text-green-600 text-xs font-bold rounded-full">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-900 truncate">{service.name}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-600">{service.bookings} bookings</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Categories */}
          {dashboard.topMetrics.topCategories && dashboard.topMetrics.topCategories.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Top Categories</h3>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  {dashboard.topMetrics.topCategories.slice(0, 5).map((category, idx) => (
                    <div key={`${category.category}-${idx}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 flex items-center justify-center bg-purple-100 text-purple-600 text-xs font-bold rounded-full">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-900 capitalize truncate">{category.category}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-600">{category.count} services</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Admin Modules</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleExport("json")}
              disabled={exportLoading}
              className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Download className="w-3 h-3 mr-1" />
              Export JSON
            </button>
            <button 
              onClick={() => handleExport("csv")}
              disabled={exportLoading}
              className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Download className="w-3 h-3 mr-1" />
              Export CSV
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {modules.map((module) => (
            <Link
              key={module.name}
              href={module.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-4 group border border-gray-200 hover:border-blue-300 hover:-translate-y-0.5"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-lg ${module.color} text-white group-hover:scale-105 transition-transform duration-200`}>
                  <module.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                    {module.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {module.description}
                  </p>
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 font-medium">
                      {module.stats}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
