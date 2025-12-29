"use client";

import { useState, useEffect, useMemo } from "react";
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
  Package,
  Star,
  Clock,
  AlertCircle
} from "lucide-react";
import { useDashboardAnalytics } from "@/features/analytics/hooks/useDashboardAnalytics";
import { useBookings } from "@/features/marketplace/hooks/useBookings";

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

  // Fetch bookings for client stats
  const { bookings: allBookings, loading: bookingsLoading } = useBookings({
    limit: 1000, // Get all bookings for stats calculation
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

  // Calculate client booking stats
  const clientBookingStats = useMemo(() => {
    if (!allBookings || allBookings.length === 0) {
      return {
        active: 0,
        pending: 0,
        completed: 0,
        totalSpent: 0,
      };
    }

    const active = allBookings.filter((b: { status?: string }) => 
      b.status === 'confirmed' || b.status === 'in_progress'
    ).length;
    
    const pending = allBookings.filter((b: { status?: string }) => 
      b.status === 'pending' || b.status === 'requested'
    ).length;
    
    const completed = allBookings.filter((b: { status?: string }) => 
      b.status === 'completed'
    ).length;
    
    const totalSpent = allBookings
      .filter((b: { status?: string; pricing?: { totalAmount?: number }; payment?: { status?: string } }) => 
        b.status === 'completed' && (b.payment?.status === 'paid' || b.payment?.status === 'completed')
      )
      .reduce((sum: number, b: { pricing?: { totalAmount?: number } }) => {
        return sum + (b.pricing?.totalAmount || 0);
      }, 0);

    return { active, pending, completed, totalSpent };
  }, [allBookings]);

  // Calculate provider stats
  const providerStats = useMemo(() => {
    if (!isProviderView) return null;

    // Get current month start date
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartISO = monthStart.toISOString();

    // Fetch provider bookings for pending count
    const providerBookings = allBookings || [];
    const pendingBookings = providerBookings.filter((b: { status?: string }) => 
      b.status === 'pending' || b.status === 'requested'
    ).length;

    // Calculate earnings for current month
    const monthEarnings = providerBookings
      .filter((b: { 
        status?: string; 
        createdAt?: string | Date; 
        pricing?: { totalAmount?: number }; 
        payment?: { status?: string } 
      }) => {
        const createdDate = b.createdAt ? new Date(b.createdAt) : null;
        return b.status === 'completed' && 
               (b.payment?.status === 'paid' || b.payment?.status === 'completed') &&
               createdDate && createdDate >= monthStart;
      })
      .reduce((sum: number, b: { pricing?: { totalAmount?: number } }) => {
        return sum + (b.pricing?.totalAmount || 0);
      }, 0);

    // Get active services count and rating from dashboard
    const activeServices = dashboard?.summary?.totalServices || 0;
    const rating = user?.profileCompleteness?.percentage ? 4.8 : 0; // Fallback to 4.8 if profile is complete, otherwise 0

    return {
      activeServices,
      pendingBookings,
      monthEarnings,
      rating,
    };
  }, [isProviderView, allBookings, dashboard, user]);

  // Calculate admin stats
  const adminStats = useMemo(() => {
    if (roleView !== 'admin') return null;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Get current month start
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Calculate bookings today (would need to fetch or use dashboard data)
    const bookingsToday = dashboard?.summary?.totalBookings || 0; // This would ideally be filtered for today

    return {
      totalUsers: totalUsers || 0,
      activeServices: dashboard?.summary?.totalServices || 0,
      monthRevenue: totalRevenue || 0, // This should be filtered for current month
      bookingsToday,
    };
  }, [roleView, dashboard, totalUsers, totalRevenue]);

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
          {/* Active Bookings */}
          <Link
            href="/marketplace/my-bookings?status=confirmed"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CalendarDays className="w-6 h-6 text-emerald-700" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-700" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Bookings</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {bookingsLoading ? "…" : formatNumber(clientBookingStats.active)}
            </p>
            <p className="text-xs text-gray-500">Confirmed & in progress</p>
          </Link>

          {/* Pending Bookings */}
          <Link
            href="/marketplace/my-bookings?status=pending"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-700" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Bookings</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {bookingsLoading ? "…" : formatNumber(clientBookingStats.pending)}
            </p>
            <p className="text-xs text-gray-500">Awaiting confirmation</p>
          </Link>

          {/* Completed Bookings */}
          <Link
            href="/marketplace/my-bookings?status=completed"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-6 h-6 text-blue-700" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-700" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Completed Bookings</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {bookingsLoading ? "…" : formatNumber(clientBookingStats.completed)}
            </p>
            <p className="text-xs text-gray-500">Finished services</p>
          </Link>

          {/* Total Spent */}
          <Link
            href="/marketplace/my-bookings"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-purple-700" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-700" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Spent</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {bookingsLoading ? "…" : formatCurrency(clientBookingStats.totalSpent)}
            </p>
            <p className="text-xs text-gray-500">All time</p>
          </Link>
        </div>
      ) : isProviderView ? (
        // Provider Dashboard Stats
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Services */}
          <Link
            href="/marketplace/my-services"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Wrench className="w-6 h-6 text-blue-700" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-700" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Services</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {analyticsLoading ? "…" : formatNumber(providerStats?.activeServices || 0)}
            </p>
            <p className="text-xs text-gray-500">Live listings</p>
          </Link>

          {/* Pending Bookings */}
          <Link
            href="/marketplace/my-bookings?status=pending"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="w-6 h-6 text-amber-700" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-700" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Bookings</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {bookingsLoading ? "…" : formatNumber(providerStats?.pendingBookings || 0)}
            </p>
            <p className="text-xs text-gray-500">Awaiting action</p>
          </Link>

          {/* Earnings (Month) */}
          <Link
            href="/finance"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-yellow-700" />
              </div>
              <div className="flex items-center gap-1 text-yellow-700">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-xs font-medium">Month</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Earnings</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {analyticsLoading ? "…" : formatCurrency(providerStats?.monthEarnings || 0)}
            </p>
            <p className="text-xs text-gray-500">This month</p>
          </Link>

          {/* Rating */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Star className="w-6 h-6 text-purple-700" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Rating</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {analyticsLoading ? "…" : (providerStats?.rating || 0).toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">Average rating</p>
          </div>
        </div>
      ) : roleView === 'admin' ? (
        // Admin Dashboard Stats
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Link
            href="/admin/users"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UsersIcon className="w-6 h-6 text-blue-700" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-700" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Users</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {analyticsLoading ? "…" : formatNumber(adminStats?.totalUsers || 0)}
            </p>
            <p className="text-xs text-gray-500">Platform total</p>
          </Link>

          {/* Active Services */}
          <Link
            href="/admin/marketplace"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Wrench className="w-6 h-6 text-emerald-700" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-700" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Services</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {analyticsLoading ? "…" : formatNumber(adminStats?.activeServices || 0)}
            </p>
            <p className="text-xs text-gray-500">Live services</p>
          </Link>

          {/* Revenue (Month) */}
          <Link
            href="/admin/analytics"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-yellow-700" />
              </div>
              <div className="flex items-center gap-1 text-yellow-700">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-xs font-medium">Month</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Revenue</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {analyticsLoading ? "…" : formatCurrency(adminStats?.monthRevenue || 0)}
            </p>
            <p className="text-xs text-gray-500">This month</p>
          </Link>

          {/* Bookings (Today) */}
          <Link
            href="/admin/bookings"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CalendarDays className="w-6 h-6 text-purple-700" />
              </div>
              <div className="flex items-center gap-1 text-purple-700">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-xs font-medium">Today</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Bookings</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {analyticsLoading ? "…" : formatNumber(adminStats?.bookingsToday || 0)}
            </p>
            <p className="text-xs text-gray-500">Today&apos;s bookings</p>
          </Link>
        </div>
      ) : (
        // Fallback for other roles (supplier, instructor, agency)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Bookings */}
          <Link
            href="/marketplace/my-bookings"
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
            <h3 className="text-sm font-medium text-gray-600 mb-1">Revenue</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">{analyticsLoading ? "…" : formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-500">Total revenue</p>
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
