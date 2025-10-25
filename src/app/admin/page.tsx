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
  AlertTriangle
} from "lucide-react";
import { Loading } from "@/components/ui/loading";

interface DashboardStats {
  totalUsers: number;
  activeServices: number;
  totalRevenue: number;
  growthRate: number;
  pendingApprovals: number;
  systemHealth: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          systemHealth: 'Good'
        };

        const mockActivityData = {
          recentActivity: [
            {
              id: '1',
              type: 'user_registration',
              description: 'New user registered',
              timestamp: new Date().toISOString(),
              user: 'System'
            },
            {
              id: '2',
              type: 'service_created',
              description: 'New service created',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              user: 'Provider'
            },
            {
              id: '3',
              type: 'booking_completed',
              description: 'Service booking completed',
              timestamp: new Date(Date.now() - 600000).toISOString(),
              user: 'Client'
            }
          ]
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStats({
          totalUsers: mockStatsData.totalUsers,
          activeServices: mockStatsData.activeServices,
          totalRevenue: mockStatsData.totalRevenue,
          growthRate: mockStatsData.growthRate,
          pendingApprovals: mockStatsData.pendingApprovals,
          systemHealth: mockStatsData.systemHealth
        });

        setRecentActivity(mockActivityData.recentActivity);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to the LocalPro administration panel</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalUsers.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+{stats?.growthRate || 0}%</span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Services</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.activeServices.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+8.2%</span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats?.totalRevenue.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12.5%</span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.pendingApprovals || '0'}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Requires attention</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.user} • {activity.timestamp}</p>
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
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Users</p>
                    <p className="text-sm text-gray-500">View and edit user accounts</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">System Settings</p>
                    <p className="text-sm text-gray-500">Configure platform settings</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">View Analytics</p>
                    <p className="text-sm text-gray-500">Platform performance metrics</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module) => (
            <a
              key={module.name}
              href={module.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-6 group border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${module.color} text-white group-hover:scale-110 transition-transform`}>
                  <module.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {module.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {module.stats}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
