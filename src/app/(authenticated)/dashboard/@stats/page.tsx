"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useAuth";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { 
  Shield, 
  User, 
  CheckCircle,
  Activity,
  DollarSign,
  Users,
  BarChart3,
  ArrowUpRight
} from "lucide-react";

export default function StatsPage() {
  const [user, setUser] = useState<{ 
    name?: string; 
    role?: string; 
    phone?: string; 
    firstName?: string; 
    lastName?: string;
    profileCompleteness?: {
      percentage: number;
      completedFields: number;
      totalFields: number;
      missingFields: string[];
      fields: Record<string, { completed: boolean; required: boolean }>;
    };
  } | null>(null);
  const [stats, setStats] = useState({
    totalServices: 8,
    activeServices: 6,
    totalUsers: 12500,
    monthlyRevenue: 0,
    profileCompleteness: 0,
    lastActivity: "2 hours ago"
  });
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id || !getApiToken()) return;
      
      try {
        // Fetch user profile
        const userUrl = `${API_BASE_URL}${API_ENDPOINTS.authMe}`;
        const userResponse = await fetch(userUrl, createAuthFetchOptions({ method: 'GET' }));
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const user = userData?.data || userData;
          setUser(user);
          setStats(prev => ({
            ...prev,
            profileCompleteness: user.profileCompleteness?.percentage || 0
          }));
        }

        // Fetch analytics data
        const analyticsUrl = `${API_BASE_URL}${API_ENDPOINTS.analyticsOverview}`;
        const analyticsResponse = await fetch(analyticsUrl, createAuthFetchOptions({ method: 'GET' }));
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          const analytics = analyticsData?.data || analyticsData;
          setStats(prev => ({
            ...prev,
            totalUsers: analytics.totalUsers || 12500,
            monthlyRevenue: analytics.monthlyRevenue || 0,
            lastActivity: analytics.lastActivity || "2 hours ago"
          }));
        }
      } catch (error) {
        logger.error("Failed to fetch user data", error instanceof Error ? error : new Error(String(error)));
      }
    };

    if (status === "authenticated" && session?.user?.id) {
      fetchUserData();
    }
  }, [session, status]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Services Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-xs font-medium">+12%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Services</h3>
          <p className="text-3xl font-bold text-gray-800 mb-1">{stats.activeServices}</p>
          <p className="text-xs text-gray-500">of {stats.totalServices} total modules</p>
        </div>

        {/* Total Users Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-xs font-medium">+8%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Users</h3>
          <p className="text-3xl font-bold text-gray-800 mb-1">{stats.totalUsers.toLocaleString()}</p>
          <p className="text-xs text-gray-500">across all platforms</p>
        </div>

        {/* Profile Completeness Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">
                  {stats.profileCompleteness}%
                </span>
              </div>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Profile Complete</h3>
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${stats.profileCompleteness}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {user?.profileCompleteness?.completedFields ? 
              `${user.profileCompleteness.completedFields}/${user.profileCompleteness.totalFields} fields` : 
              "Profile status"
            }
          </p>
        </div>

        {/* Platform Status Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-emerald-600 font-medium">Live</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Platform Status</h3>
          <p className="text-3xl font-bold text-emerald-600 mb-1">Online</p>
          <p className="text-xs text-gray-500">All systems operational</p>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Role Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Account Type</h3>
              <p className="text-xl font-bold text-gray-800 capitalize">
                {user?.role || "User"}
              </p>
              <p className="text-xs text-gray-500">Current role</p>
            </div>
          </div>
        </div>

        {/* Monthly Revenue Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Monthly Revenue</h3>
              <p className="text-xl font-bold text-gray-800">
                ${stats.monthlyRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-700 mb-1">Quick Actions</h3>
              <p className="text-xs text-green-600 mb-2">View analytics & reports</p>
              <button className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
