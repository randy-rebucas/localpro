"use client";

import { useState, useEffect } from "react";
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
  DollarSign,
  Package,
  ArrowUpRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Download,
  Bell,
  Shield,
  Zap,
  Crown
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { useRoleAccess } from "@/components/role-guard";
import { useSession } from "@/hooks/useAuth";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";

interface DashboardStats {
  totalUsers: number;
  activeServices: number;
  totalRevenue: number;
  growthRate: number;
  pendingApprovals: number;
  systemHealth: string;
  newUsersToday: number;
  activeBookings: number;
  conversionRate: number;
  avgResponseTime: number;
  serverUptime: number;
  errorRate: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
  status: 'success' | 'warning' | 'error' | 'info';
  priority: 'low' | 'medium' | 'high';
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);
  const roleAccess = useRoleAccess();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real data from admin dashboard API
        const response = await makeClientAuthenticatedRequestWithEndpointSafe(
          'analyticsDashboard' as keyof typeof API_ENDPOINTS,
          { method: 'GET' }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch dashboard data`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load dashboard data');
        }

        const { stats: apiStats, recentActivity: apiActivity, systemAlerts: apiAlerts } = result.data;

        setStats(apiStats);
        setRecentActivity(apiActivity);
        setSystemAlerts(apiAlerts);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Fetch fresh data from admin dashboard API
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'analyticsDashboard' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to refresh dashboard data`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to refresh dashboard data');
      }

      const { stats: apiStats, recentActivity: apiActivity, systemAlerts: apiAlerts } = result.data;

      setStats(apiStats);
      setRecentActivity(apiActivity);
      setSystemAlerts(apiAlerts);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh dashboard data');
    } finally {
      setRefreshing(false);
    }
  };

  const modules = [
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
      stats: "567 products"
    },
    {
      name: "Academy",
      description: "Manage courses and enrollments",
      icon: BookOpen,
      href: "/admin/academy",
      color: "bg-indigo-500",
      stats: "89 courses"
    },
    {
      name: "Finance",
      description: "Financial overview and transactions",
      icon: CreditCard,
      href: "/admin/finance",
      color: "bg-yellow-500",
      stats: stats ? `$${stats.totalRevenue.toLocaleString()}` : "Loading..."
    },
    {
      name: "Rentals",
      description: "Manage rental items and bookings",
      icon: Home,
      href: "/admin/rentals",
      color: "bg-orange-500",
      stats: "234 rentals"
    },
    {
      name: "Ads",
      description: "Manage advertisements and campaigns",
      icon: Megaphone,
      href: "/admin/ads",
      color: "bg-pink-500",
      stats: "45 active ads"
    },
    {
      name: "Communication",
      description: "Messages and notifications",
      icon: MessageSquare,
      href: "/admin/communication",
      color: "bg-cyan-500",
      stats: "1,234 messages"
    },
    {
      name: "Analytics",
      description: "Platform analytics and insights",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-violet-500",
      stats: "Real-time data"
    },
    {
      name: "Plus",
      description: "Manage subscription plans and revenue",
      icon: Crown,
      href: "/admin/plus",
      color: "bg-yellow-500",
      stats: stats ? `${stats.totalRevenue.toLocaleString()} revenue` : "Loading..."
    },
    {
      name: "System",
      description: "System settings and monitoring",
      icon: Settings,
      href: "/admin/system",
      color: "bg-gray-500",
      stats: stats ? stats.systemHealth : "Loading..."
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading admin dashboard..." />
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };


  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Bell className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-3">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 text-sm">LocalPro administration panel</p>
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
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => setShowDevTools(!showDevTools)}
              className="inline-flex items-center px-2 py-1 border border-yellow-300 shadow-sm text-xs font-medium rounded text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200"
            >
              <Settings className="w-3 h-3 mr-1" />
              Dev
            </button>
          )}
        </div>
      </div>

      {/* Development Tools */}
      {showDevTools && process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-yellow-800">Dev Tools</h3>
            <button
              onClick={() => setShowDevTools(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded border border-yellow-200">
              <h4 className="text-sm font-medium text-gray-900 mb-1">User Info</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Role:</strong> {session?.user?.role || 'Not set'}</p>
                <p><strong>Admin Access:</strong> {roleAccess?.isAdmin ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-yellow-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`${API_BASE_URL}/api/admin/setup`, createAuthFetchOptions({
                          method: 'POST'
                        }));
                        const result = await response.json();
                        if (result.success) {
                          alert('Admin role set! Please refresh the page.');
                          window.location.reload();
                        } else {
                          alert('Failed to set admin role: ' + result.error);
                        }
                      } catch (error) {
                        alert('Error: ' + error);
                      }
                    }}
                    className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  >
                    Set Admin Role
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                  >
                    Refresh
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-medium text-gray-700">Role:</label>
                  <select
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      if (newRole) {
                        try {
                          const response = await fetch(`${API_BASE_URL}/api/admin/update-role`, createAuthFetchOptions({
                            method: 'POST',
                            body: JSON.stringify({ role: newRole })
                          }));
                          const result = await response.json();
                          if (result.success) {
                            alert(`Role updated to ${newRole}! Refreshing page...`);
                            window.location.reload();
                          } else {
                            alert('Failed to update role: ' + result.error);
                          }
                        } catch (error) {
                          alert('Error: ' + error);
                        }
                      }
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="">Select Role</option>
                    <option value="client">Client</option>
                    <option value="provider">Provider</option>
                    <option value="supplier">Supplier</option>
                    <option value="instructor">Instructor</option>
                    <option value="agency_owner">Agency Owner</option>
                    <option value="agency_admin">Agency Admin</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
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
            {stats?.growthRate && stats.growthRate > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
            )}
            <span className={`font-medium ${stats?.growthRate && stats.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats?.growthRate && stats.growthRate > 0 ? '+' : ''}{stats?.growthRate || 0}%
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
                {stats?.activeBookings || 0} bookings
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+8.2%</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">
                ${stats?.totalRevenue.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500">
                {stats?.conversionRate || 0}% conversion
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12.5%</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Pending Approvals</p>
              <p className="text-xl font-bold text-gray-900">
                {stats?.pendingApprovals || '0'}
              </p>
              <p className="text-xs text-gray-500">
                High priority
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="text-red-600 font-medium">Attention</span>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">System Health</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.serverUptime || 0}%
              </p>
              <p className="text-xs text-gray-500">
                {stats?.systemHealth || 'Unknown'}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Response Time</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.avgResponseTime || 0}s
              </p>
              <p className="text-xs text-gray-500">
                {stats?.avgResponseTime && stats.avgResponseTime < 2 ? 'Excellent' : 'Good'}
              </p>
            </div>
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Zap className="w-4 h-4 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Error Rate</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.errorRate || 0}%
              </p>
              <p className="text-xs text-gray-500">
                {stats?.errorRate && stats.errorRate < 1 ? 'Low' : 'High'}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">Active Alerts</p>
              <p className="text-lg font-bold text-gray-900">
                {systemAlerts?.filter(alert => !alert.resolved).length || 0}
              </p>
              <p className="text-xs text-gray-500">
                {(systemAlerts?.filter(alert => !alert.resolved).length || 0) === 0 ? 'All Clear' : 'Attention'}
              </p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Bell className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-4">
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity?.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.status).split(' ')[1]}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-900 font-medium truncate">{activity.description}</p>
                        <span className={`text-xs px-1 py-0.5 rounded ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">{activity.user}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleTimeString()}
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

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors group">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-blue-600 mr-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Manage Users</p>
                    <p className="text-xs text-gray-500">View and edit accounts</p>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-gray-400" />
                </div>
              </button>
              
              <button className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 rounded transition-colors group">
                <div className="flex items-center">
                  <Settings className="w-4 h-4 text-green-600 mr-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">System Settings</p>
                    <p className="text-xs text-gray-500">Configure platform</p>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-gray-400" />
                </div>
              </button>
              
              <button className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded transition-colors group">
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 text-purple-600 mr-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">View Analytics</p>
                    <p className="text-xs text-gray-500">Performance metrics</p>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-gray-400" />
                </div>
              </button>

              <button className="w-full text-left px-3 py-2 bg-red-50 hover:bg-red-100 rounded transition-colors group">
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Review Alerts</p>
                    <p className="text-xs text-gray-500">System warnings</p>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-gray-400" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {systemAlerts && systemAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">System Alerts</h3>
              <span className="text-xs text-gray-500">
                {systemAlerts?.filter(alert => !alert.resolved).length || 0} active
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {systemAlerts?.slice(0, 3).map((alert) => (
                <div key={alert.id} className={`p-3 rounded border-l-4 ${
                  alert.type === 'error' ? 'border-red-500 bg-red-50' :
                  alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  alert.type === 'info' ? 'border-blue-500 bg-blue-50' :
                  'border-green-500 bg-green-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {alert.resolved ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
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

      {/* Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Admin Modules</h2>
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Filter className="w-3 h-3 mr-1" />
              Filter
            </button>
            <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Download className="w-3 h-3 mr-1" />
              Export
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {modules.map((module) => (
            <a
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
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
