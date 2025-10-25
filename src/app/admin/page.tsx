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
  Zap
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { useRoleAccess } from "@/components/role-guard";

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use mock data for now since API endpoints may not exist
        // In production, replace with actual API calls
        const mockStatsData = {
          totalUsers: 1234,
          activeServices: 567,
          totalRevenue: 45678,
          growthRate: 12.5,
          pendingApprovals: 23,
          systemHealth: 'Good',
          newUsersToday: 45,
          activeBookings: 234,
          conversionRate: 3.2,
          avgResponseTime: 1.2,
          serverUptime: 99.9,
          errorRate: 0.1
        };

        const mockActivityData = {
          recentActivity: [
            {
              id: '1',
              type: 'user_registration',
              description: 'New user registered',
              timestamp: new Date().toISOString(),
              user: 'System',
              status: 'success' as const,
              priority: 'low' as const
            },
            {
              id: '2',
              type: 'service_created',
              description: 'New service created',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              user: 'Provider',
              status: 'info' as const,
              priority: 'medium' as const
            },
            {
              id: '3',
              type: 'booking_completed',
              description: 'Service booking completed',
              timestamp: new Date(Date.now() - 600000).toISOString(),
              user: 'Client',
              status: 'success' as const,
              priority: 'low' as const
            },
            {
              id: '4',
              type: 'payment_failed',
              description: 'Payment processing failed',
              timestamp: new Date(Date.now() - 900000).toISOString(),
              user: 'System',
              status: 'error' as const,
              priority: 'high' as const
            },
            {
              id: '5',
              type: 'system_alert',
              description: 'High server load detected',
              timestamp: new Date(Date.now() - 1200000).toISOString(),
              user: 'System',
              status: 'warning' as const,
              priority: 'high' as const
            }
          ]
        };

        const mockAlertsData = [
          {
            id: '1',
            type: 'warning' as const,
            title: 'High Server Load',
            message: 'Server CPU usage is above 80%',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            resolved: false
          },
          {
            id: '2',
            type: 'error' as const,
            title: 'Database Connection',
            message: 'Failed to connect to primary database',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            resolved: true
          },
          {
            id: '3',
            type: 'info' as const,
            title: 'Scheduled Maintenance',
            message: 'System maintenance scheduled for tonight',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            resolved: false
          }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStats({
          totalUsers: mockStatsData.totalUsers,
          activeServices: mockStatsData.activeServices,
          totalRevenue: mockStatsData.totalRevenue,
          growthRate: mockStatsData.growthRate,
          pendingApprovals: mockStatsData.pendingApprovals,
          systemHealth: mockStatsData.systemHealth,
          newUsersToday: mockStatsData.newUsersToday,
          activeBookings: mockStatsData.activeBookings,
          conversionRate: mockStatsData.conversionRate,
          avgResponseTime: mockStatsData.avgResponseTime,
          serverUptime: mockStatsData.serverUptime,
          errorRate: mockStatsData.errorRate
        });

        setRecentActivity(mockActivityData.recentActivity);
        setSystemAlerts(mockAlertsData);
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
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // In production, call actual API here
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing data:', err);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
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
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to the LocalPro administration panel</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => setShowDevTools(!showDevTools)}
              className="inline-flex items-center px-3 py-2 border border-yellow-300 shadow-sm text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200 hover:shadow-md"
            >
              <Settings className="w-4 h-4 mr-2" />
              Dev Tools
            </button>
          )}
        </div>
      </div>

      {/* Development Tools */}
      {showDevTools && process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-yellow-800">Development Tools</h3>
            <button
              onClick={() => setShowDevTools(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-gray-900 mb-2">Current User Info</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Role:</strong> {typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'Not set' : 'Loading...'}</p>
                <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
                <p><strong>Admin Access:</strong> {roleAccess?.isAdmin ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-gray-900 mb-2">Role Management</h4>
              <p className="text-sm text-gray-600 mb-3">
                To access the admin panel, your user role needs to be set to &apos;admin&apos;. 
                In development, you can temporarily bypass this by having any non-client role.
              </p>
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/setup', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        });
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Set Admin Role
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    Refresh Page
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Quick Role Switch:</label>
                  <select
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      if (newRole) {
                        try {
                          const response = await fetch('/api/admin/update-role', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ role: newRole })
                          });
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
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
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
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/debug-session');
                        const result = await response.json();
                        console.log('Session Debug:', result);
                        alert('Session debug info logged to console. Check browser console for details.');
                      } catch (error) {
                        alert('Error: ' + error);
                      }
                    }}
                    className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                  >
                    Debug Session
                  </button>
                  <button
                    onClick={() => {
                      console.log('Current Role Access:', roleAccess);
                      console.log('Current Session:', typeof window !== 'undefined' ? document.cookie : 'Not available');
                      alert('Role access info logged to console. Check browser console for details.');
                    }}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                  >
                    Debug Role Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 p-6 border-l-4 border-blue-500 hover:border-blue-600 group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {stats?.totalUsers.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                +{stats?.newUsersToday || 0} today
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4 group-hover:bg-blue-200 transition-colors duration-200">
              <Users className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {stats?.growthRate && stats.growthRate > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`font-medium ${stats?.growthRate && stats.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats?.growthRate && stats.growthRate > 0 ? '+' : ''}{stats?.growthRate || 0}%
            </span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 p-6 border-l-4 border-green-500 hover:border-green-600 group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Active Services</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                {stats?.activeServices.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.activeBookings || 0} active bookings
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4 group-hover:bg-green-200 transition-colors duration-200">
              <ShoppingCart className="w-6 h-6 text-green-600 group-hover:scale-110 transition-transform duration-200" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+8.2%</span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 p-6 border-l-4 border-yellow-500 hover:border-yellow-600 group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors duration-200">
                ${stats?.totalRevenue.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.conversionRate || 0}% conversion rate
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4 group-hover:bg-yellow-200 transition-colors duration-200">
              <DollarSign className="w-6 h-6 text-yellow-600 group-hover:scale-110 transition-transform duration-200" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12.5%</span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 p-6 border-l-4 border-red-500 hover:border-red-600 group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-200">
                {stats?.pendingApprovals || '0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Requires immediate attention
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg flex-shrink-0 ml-4 group-hover:bg-red-200 transition-colors duration-200">
              <AlertTriangle className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform duration-200" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600 font-medium">High Priority</span>
          </div>
        </div>
      </div>

      {/* Additional System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">System Health</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.serverUptime || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Server uptime
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${stats?.serverUptime && stats.serverUptime > 99 ? 'text-green-600' : 'text-yellow-600'}`}>
              {stats?.systemHealth || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-cyan-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.avgResponseTime || 0}s
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Average response time
              </p>
            </div>
            <div className="p-3 bg-cyan-100 rounded-lg flex-shrink-0 ml-4">
              <Zap className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${stats?.avgResponseTime && stats.avgResponseTime < 2 ? 'text-green-600' : 'text-yellow-600'}`}>
              {stats?.avgResponseTime && stats.avgResponseTime < 2 ? 'Excellent' : 'Good'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Error Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.errorRate || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                System error rate
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0 ml-4">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${stats?.errorRate && stats.errorRate < 1 ? 'text-green-600' : 'text-red-600'}`}>
              {stats?.errorRate && stats.errorRate < 1 ? 'Low' : 'High'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {systemAlerts.filter(alert => !alert.resolved).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                System alerts
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg flex-shrink-0 ml-4">
              <Bell className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${systemAlerts.filter(alert => !alert.resolved).length === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {systemAlerts.filter(alert => !alert.resolved).length === 0 ? 'All Clear' : 'Attention Needed'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full mt-2 ${getStatusColor(activity.status).split(' ')[1]}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">{activity.user}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                            {activity.priority}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Users</p>
                    <p className="text-sm text-gray-500">View and edit user accounts</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 text-green-600 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium text-gray-900">System Settings</p>
                    <p className="text-sm text-gray-500">Configure platform settings</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-purple-600 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium text-gray-900">View Analytics</p>
                    <p className="text-sm text-gray-500">Platform performance metrics</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </button>

              <button className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium text-gray-900">Review Alerts</p>
                    <p className="text-sm text-gray-500">Check system alerts and warnings</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
              <span className="text-sm text-gray-500">
                {systemAlerts.filter(alert => !alert.resolved).length} active
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {systemAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'error' ? 'border-red-500 bg-red-50' :
                  alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  alert.type === 'info' ? 'border-blue-500 bg-blue-50' :
                  'border-green-500 bg-green-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {alert.resolved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Admin Modules</h2>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((module) => (
            <a
              key={module.name}
              href={module.href}
              className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-300 p-6 group border border-gray-200 hover:border-blue-300 hover:-translate-y-1 hover:scale-105"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-4 rounded-xl ${module.color} text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <module.icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {module.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-medium">
                      {module.stats}
                    </p>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
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
