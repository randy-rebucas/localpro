"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useAuth";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import Link from "next/link";
import { useActiveRoleView } from "@/shared/hooks/useActiveRoleView";
import { getRoleDisplayName } from "@/shared/lib/role-utils";
import { 
  User, 
  CalendarDays,
  CheckCircle,
  DollarSign,
  Users as UsersIcon,
  Briefcase,
  ArrowUpRight,
  Wallet,
  Bell,
  Heart,
  Compass,
  Shield,
  Building,
  Wrench,
  BarChart3,
  Package
} from "lucide-react";
import { useDashboardAnalytics } from "@/features/analytics/hooks/useDashboardAnalytics";

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
  const { data: session, status } = useSession();
  const { userRoles, roleView, isClientView, isProviderView } = useActiveRoleView();
  const isSupplierView = roleView === "supplier";

  const { dashboard, loading: analyticsLoading } = useDashboardAnalytics({
    timeframe: "30d",
    enabled: !isClientView,
  });

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
        }
      } catch (error) {
        logger.error("Failed to fetch user data", error instanceof Error ? error : new Error(String(error)));
      }
    };

    if (status === "authenticated" && session?.user?.id) {
      fetchUserData();
    }
  }, [session, status]);

  const profileCompleteness = user?.profileCompleteness?.percentage ?? 0;

  const totalUsers = dashboard?.summary?.totalUsers;
  const totalBookings = dashboard?.summary?.totalBookings;
  const totalJobs = dashboard?.summary?.totalJobs;
  const totalRevenue = dashboard?.summary?.totalRevenue;

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return "—";
    return value.toLocaleString();
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "—";
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
    } catch {
      return `$${value.toLocaleString()}`;
    }
  };

  const activeRoleLabel = (() => {
    try {
      return getRoleDisplayName(roleView as never);
    } catch {
      return roleView || "Client";
    }
  })();

  return (
    <div>
      {/* Active role label */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Viewing as{" "}
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 font-medium text-gray-900">
            <Shield className="w-3.5 h-3.5 text-gray-700" />
            {activeRoleLabel}
          </span>
        </div>
        {isClientView && !userRoles.includes("provider") && (
          <Link href="/onboarding" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            Become a provider
          </Link>
        )}
      </div>

      {isClientView ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/marketplace"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Compass className="w-6 h-6 text-emerald-700" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-700" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Explore services</h3>
            <p className="text-xs text-gray-500">Browse and book from the marketplace</p>
          </Link>

          <Link
            href="/marketplace/bookings"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CalendarDays className="w-6 h-6 text-primary" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">My bookings</h3>
            <p className="text-xs text-gray-500">Track upcoming and past bookings</p>
          </Link>

          <Link
            href="/favorites"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-6 h-6 text-pink-700" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-pink-700" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Saved items</h3>
            <p className="text-xs text-gray-500">Your favorites across the app</p>
          </Link>

          <Link
            href="/notifications"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Bell className="w-6 h-6 text-amber-700" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-700" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Notifications</h3>
            <p className="text-xs text-gray-500">Updates, reminders, and alerts</p>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Bookings */}
          <Link
            href={isProviderView ? "/marketplace/my-bookings" : "/marketplace/bookings"}
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CalendarDays className="w-6 h-6 text-emerald-700" />
              </div>
              <div className="flex items-center gap-1 text-emerald-700">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-xs font-medium">30d</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Bookings</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {analyticsLoading ? "…" : formatNumber(totalBookings)}
            </p>
            <p className="text-xs text-gray-500">Total bookings</p>
          </Link>

          {/* Users */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UsersIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-primary">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-xs font-medium">30d</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Users</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {analyticsLoading ? "…" : formatNumber(totalUsers)}
            </p>
            <p className="text-xs text-gray-500">Platform total</p>
          </div>

          {/* Revenue / Earnings */}
          <Link
            href="/finance"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Wallet className="w-6 h-6 text-yellow-700" />
              </div>
              <div className="flex items-center gap-1 text-yellow-700">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-xs font-medium">30d</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{isProviderView ? "Earnings" : "Revenue"}</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">{analyticsLoading ? "…" : formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-500">{isProviderView ? "Total earnings" : "Total revenue"}</p>
          </Link>

          {/* Profile Completeness */}
          <Link
            href="/profile"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">
                    {profileCompleteness}%
                  </span>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Profile complete</h3>
            <div className="mb-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${profileCompleteness}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {user?.profileCompleteness?.completedFields ?
                `${user.profileCompleteness.completedFields}/${user.profileCompleteness.totalFields} fields` :
                "Complete your profile to unlock more features"
              }
            </p>
          </Link>
        </div>
      )}

      {/* Provider Quick Links Section */}
      {isProviderView && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
              <p className="text-sm text-gray-600">Access your provider tools</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* My Services */}
            <Link
              href="/marketplace/my-services"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 group border border-gray-200 hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Wrench className="w-5 h-5 text-blue-700" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors ml-auto" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">My Services</h4>
              <p className="text-xs text-gray-600">Manage your service listings</p>
            </Link>

            {/* Bookings */}
            <Link
              href="/marketplace/my-bookings"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 group border border-gray-200 hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <CalendarDays className="w-5 h-5 text-emerald-700" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors ml-auto" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Bookings</h4>
              <p className="text-xs text-gray-600">View and manage bookings</p>
            </Link>

            {/* Earnings */}
            <Link
              href="/finance"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 group border border-gray-200 hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <DollarSign className="w-5 h-5 text-yellow-700" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors ml-auto" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Earnings</h4>
              <p className="text-xs text-gray-600">Track your revenue</p>
            </Link>

            {/* Analytics */}
            <Link
              href="/analytics"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 group border border-gray-200 hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <BarChart3 className="w-5 h-5 text-purple-700" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors ml-auto" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Analytics</h4>
              <p className="text-xs text-gray-600">View performance metrics</p>
            </Link>
          </div>
        </div>
      )}

      {/* Supplier Quick Links Section */}
      {isSupplierView && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
              <p className="text-sm text-gray-600">Access your supplier tools</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* My Products */}
            <Link
              href="/supplies/my-products"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 group border border-gray-200 hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Package className="w-5 h-5 text-amber-700" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors ml-auto" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">My Products</h4>
              <p className="text-xs text-gray-600">Manage your product catalog</p>
            </Link>

            {/* Orders */}
            <Link
              href="/supplies/my-orders"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 group border border-gray-200 hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Briefcase className="w-5 h-5 text-blue-700" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors ml-auto" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Orders</h4>
              <p className="text-xs text-gray-600">View and manage orders</p>
            </Link>

            {/* Revenue */}
            <Link
              href="/finance"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 group border border-gray-200 hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <DollarSign className="w-5 h-5 text-yellow-700" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors ml-auto" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Revenue</h4>
              <p className="text-xs text-gray-600">Track your sales revenue</p>
            </Link>

            {/* Analytics */}
            <Link
              href="/analytics"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 group border border-gray-200 hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <BarChart3 className="w-5 h-5 text-purple-700" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors ml-auto" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Analytics</h4>
              <p className="text-xs text-gray-600">View sales analytics</p>
            </Link>
          </div>
        </div>
      )}

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Role Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Account Type</h3>
              <p className="text-xl font-bold text-gray-800">
                {activeRoleLabel}
              </p>
              <p className="text-xs text-gray-500">Active view: {roleView}</p>
            </div>
          </div>
        </div>

        {/* Become Agency Card - Show for providers who are not agency owners/admins */}
        {isProviderView && !userRoles.includes("agency_owner") && !userRoles.includes("agency_admin") && (
          <Link
            href="/agencies/create"
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border-2 border-purple-200 hover:border-purple-300 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-purple-900 mb-1">Become Agency</h3>
                <p className="text-xs text-purple-700 mb-2">Scale your business with a team</p>
                <div className="flex items-center gap-1 text-xs font-semibold text-purple-700 group-hover:text-purple-900">
                  Get started
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Jobs Card - Only show if not showing Become Agency */}
        {!(isProviderView && !userRoles.includes("agency_owner") && !userRoles.includes("agency_admin")) && (
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-yellow-700" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{isClientView ? "Explore jobs" : "Jobs"}</h3>
                <p className="text-xl font-bold text-gray-800">
                  {isClientView ? "Browse" : (analyticsLoading ? "…" : formatNumber(totalJobs))}
                </p>
                <p className="text-xs text-gray-500">{isClientView ? "See opportunities and postings" : "Total jobs"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Card */}
        <div className="bg-gradient-to-br from-accent/10 to-accent/10 rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-accent mb-1">Quick Actions</h3>
              <p className="text-xs text-accent mb-2">
                {isClientView ? "Complete onboarding to unlock business tools" : "Create and manage your services"}
              </p>
              {isClientView ? (
                <Link
                  href="/onboarding"
                  className="inline-flex text-xs bg-accent text-white px-3 py-1 rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Continue onboarding
                </Link>
              ) : (
                <Link
                  href="/marketplace/create-service"
                  className="inline-flex text-xs bg-accent text-white px-3 py-1 rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Create service
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
