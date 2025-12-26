"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useActiveRoleView } from "@/shared/hooks/useActiveRoleView";
import { useBookings } from "@/features/marketplace/hooks/useBookings";
import { useMyCourses } from "@/features/academy/hooks/useCourses";
import { useMyApplications } from "@/features/jobs/hooks/useJobs";
import type { Enrollment } from "@/types/courses";
import type { Course as CourseType } from "@/types/courses";
import { useMyOrders } from "@/features/supplies/hooks/useSupplies";
import { useDashboardAnalytics } from "@/features/analytics/hooks/useDashboardAnalytics";
import {
  CalendarDays,
  Clock,
  DollarSign,
  Package,
  GraduationCap,
  Briefcase,
  TrendingUp,
  AlertCircle,
  BarChart3,
  ArrowRight,
  Building,
  Wrench,
  Shield,
  Users,
} from "lucide-react";
// Relative time formatting utility
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    }
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
    }
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months !== 1 ? "s" : ""} ago`;
    }
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years !== 1 ? "s" : ""} ago`;
  } catch {
    return dateString;
  }
}

interface Booking {
  id?: string;
  _id?: string;
  service?: { title?: string; name?: string } | string;
  provider?: { name?: string; businessName?: string } | string;
  status?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  bookingDate?: Date | string;
  createdAt?: string | Date;
}

interface Course {
  id: string;
  title?: string;
  progress?: number;
  completed?: boolean;
  enrolledAt?: string;
}

interface JobApplication {
  id?: string;
  _id?: string;
  job?: { title?: string } | string;
  status?: string;
  appliedAt?: string;
}

interface Order {
  id?: string;
  _id?: string;
  status?: string;
  total?: number;
  createdAt?: string | Date;
  items?: Array<{ name?: string; quantity?: number }>;
}

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return "$0";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString?: string) {
  return formatRelativeTime(dateString);
}

// Client Dashboard Widgets
function ClientWidgets() {
  const { bookings, loading: bookingsLoading, error: bookingsError } = useBookings({
    status: "confirmed",
    limit: 5,
    sortBy: "scheduledDate",
    sortOrder: "asc",
  });

  const { enrollments, loading: coursesLoading, error: coursesError } = useMyCourses({ limit: 3 });
  const { applications, loading: applicationsLoading, error: applicationsError } = useMyApplications({ limit: 3 });

  const upcomingBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];
    return bookings
      .filter((b) => {
        const booking = b as Booking;
        const dateStr = booking.scheduledDate || booking.bookingDate;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date >= new Date();
      })
      .map((b) => {
        const booking = b as Booking;
        return {
          ...booking,
          id: booking.id || booking._id || '',
          scheduledDate: booking.scheduledDate || booking.bookingDate,
        } as Booking;
      })
      .slice(0, 3);
  }, [bookings]);

  const inProgressCourses = useMemo(() => {
    if (!enrollments || enrollments.length === 0) return [];
    return enrollments
      .filter((e: Enrollment & { course?: CourseType | string }) => {
        const course = typeof e.course === 'object' ? e.course : null;
        const progress = typeof e.progress === 'object' && e.progress && 'percentage' in e.progress
          ? (e.progress.percentage as number)
          : (typeof e.progress === 'number' ? e.progress : 0);
        const status = e.status || 'enrolled';
        return course && status !== 'completed' && progress > 0;
      })
      .map((e: Enrollment & { course?: CourseType | string }) => {
        const course = typeof e.course === 'object' ? e.course : ({} as CourseType);
        const progress = typeof e.progress === 'object' && e.progress && 'percentage' in e.progress
          ? (e.progress.percentage as number)
          : (typeof e.progress === 'number' ? e.progress : 0);
        const courseId = (course as { id?: string; _id?: string }).id || (course as { id?: string; _id?: string })._id || (typeof e.course === 'string' ? e.course : '');
        return {
          id: courseId,
          title: course.title,
          progress,
          completed: e.status === 'completed',
        } as Course;
      })
      .slice(0, 3);
  }, [enrollments]);

  return (
    <div className="space-y-6">
      {/* Upcoming Bookings */}
      {!bookingsError && upcomingBookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h3>
            </div>
            <Link
              href="/marketplace/bookings"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {bookingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking: Booking) => {
                const bookingId = booking.id || booking._id || '';
                return (
                <Link
                  key={bookingId}
                  href={`/marketplace/bookings/${bookingId}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {typeof booking.service === 'object' 
                          ? (booking.service?.title || booking.service?.name || "Service")
                          : "Service"}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {typeof booking.provider === 'object'
                          ? (booking.provider?.name || booking.provider?.businessName || "Provider")
                          : "Provider"}
                      </p>
                      {booking.scheduledDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(booking.scheduledDate).toLocaleDateString()}
                            {booking.scheduledTime && ` at ${booking.scheduledTime}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {booking.status || "Confirmed"}
                      </span>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Course Progress */}
      {!coursesError && inProgressCourses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-gray-900">Continue Learning</h3>
            </div>
            <Link
              href="/academy/my-courses"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {coursesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {inProgressCourses.map((course: Course) => (
                <Link
                  key={course.id}
                  href={`/academy/courses/${course.id}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:border-accent hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 flex-1">{course.title || "Course"}</p>
                    <span className="text-xs font-medium text-gray-600 ml-2">{course.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress || 0}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Job Applications */}
      {!applicationsError && applications && applications.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Job Applications</h3>
            </div>
            <Link
              href="/jobs/my-applications"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {applicationsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => {
                const application = app as JobApplication;
                const appId = application.id || application._id || '';
                return (
                <div
                  key={appId}
                  className="p-3 rounded-lg border border-gray-200 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {typeof application.job === 'object' 
                        ? (application.job?.title || "Job Application")
                        : "Job Application"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Applied {formatDate(application.appliedAt)}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-3 ${
                      application.status === "accepted"
                        ? "bg-emerald-100 text-emerald-800"
                        : application.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {application.status || "Pending"}
                  </span>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Provider Dashboard Widgets
function ProviderWidgets() {
  const { bookings, loading: bookingsLoading, error: bookingsError } = useBookings({
    status: "pending",
    limit: 5,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { dashboard, loading: analyticsLoading } = useDashboardAnalytics({
    timeframe: "7d",
    enabled: true,
  });

  const pendingBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings
      .filter((b) => {
        const booking = b as Booking;
        return booking.status === "pending" || booking.status === "requested";
      })
      .map((b) => {
        const booking = b as Booking;
        return {
          ...booking,
          id: booking.id || booking._id || '',
        } as Booking;
      })
      .slice(0, 5);
  }, [bookings]);

  const recentRevenue = dashboard?.summary?.totalRevenue || 0;
  const totalBookings = dashboard?.summary?.totalBookings || 0;

  return (
    <div className="space-y-6">
      {/* Pending Bookings */}
      {!bookingsError && pendingBookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Pending Bookings</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {pendingBookings.length}
              </span>
            </div>
            <Link
              href="/marketplace/my-bookings?status=pending"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {bookingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((booking: Booking) => {
                const bookingId = booking.id || booking._id || '';
                return (
                <Link
                  key={bookingId}
                  href={`/marketplace/my-bookings/${bookingId}`}
                  className="block p-3 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {typeof booking.service === 'object' 
                          ? (booking.service?.title || booking.service?.name || "Service")
                          : "Service"}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Requested {formatDate(booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt)}
                      </p>
                      {booking.scheduledDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <CalendarDays className="w-3 h-3" />
                          <span>
                            {new Date(booking.scheduledDate).toLocaleDateString()}
                            {booking.scheduledTime && ` at ${booking.scheduledTime}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ml-3">
                      Action Required
                    </span>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
        </div>
        {analyticsLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-medium text-emerald-700">Bookings</span>
              </div>
              <p className="text-2xl font-bold text-emerald-900">{totalBookings}</p>
              <p className="text-xs text-emerald-700 mt-1">Last 7 days</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-yellow-700" />
                <span className="text-xs font-medium text-yellow-700">Earnings</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(recentRevenue)}</p>
              <p className="text-xs text-yellow-700 mt-1">Last 7 days</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Supplier Dashboard Widgets
function SupplierWidgets() {
  const { orders, loading: ordersLoading, error: ordersError } = useMyOrders({ limit: 5 });
  const { dashboard, loading: analyticsLoading } = useDashboardAnalytics({
    timeframe: "7d",
    enabled: true,
  });

  const pendingOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter((o) => {
        const order = o as Order;
        return order.status === "pending" || order.status === "processing";
      })
      .map((o) => {
        const order = o as Order;
        return {
          ...order,
          id: order.id || order._id || '',
        } as Order;
      })
      .slice(0, 5);
  }, [orders]);

  const recentRevenue = dashboard?.summary?.totalRevenue || 0;

  return (
    <div className="space-y-6">
      {/* Pending Orders */}
      {!ordersError && pendingOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Pending Orders</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {pendingOrders.length}
              </span>
            </div>
            <Link
              href="/supplies/my-orders?status=pending"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order: Order) => {
                const orderId = order.id || order._id || '';
                return (
                <Link
                  key={orderId}
                  href={`/supplies/my-orders/${orderId}`}
                  className="block p-3 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Order #{orderId.slice(0, 8)}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""} •{" "}
                        {formatDate(order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt)}
                      </p>
                    </div>
                    <div className="ml-3 text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                        {order.status || "Pending"}
                      </span>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Revenue Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
        </div>
        {analyticsLoading ? (
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
            <p className="text-3xl font-bold text-emerald-900 mb-1">{formatCurrency(recentRevenue)}</p>
            <p className="text-xs text-emerald-700">Last 7 days</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Instructor Dashboard Widgets
function InstructorWidgets() {
  const { dashboard, loading: analyticsLoading } = useDashboardAnalytics({
    timeframe: "7d",
    enabled: true,
  });

  return (
    <div className="space-y-6">
      {/* Course Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-gray-900">Course Performance</h3>
        </div>
        {analyticsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/20 border border-accent/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total Enrollments</span>
                <Users className="w-4 h-4 text-accent" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard?.summary?.totalUsers || 0}
              </p>
            </div>
            <Link
              href="/academy/my-courses"
              className="block w-full text-center py-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Manage Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Agency Owner/Admin Dashboard Widgets
function AgencyWidgets() {
  const { dashboard, loading: analyticsLoading } = useDashboardAnalytics({
    timeframe: "7d",
    enabled: true,
  });

  return (
    <div className="space-y-6">
      {/* Agency Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Agency Overview</h3>
        </div>
        {analyticsLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-medium text-purple-700">Providers</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {dashboard?.summary?.activeProviders || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-medium text-emerald-700">Bookings</span>
              </div>
              <p className="text-2xl font-bold text-emerald-900">
                {dashboard?.summary?.totalBookings || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-yellow-700" />
                <span className="text-xs font-medium text-yellow-700">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">
                {formatCurrency(dashboard?.summary?.totalRevenue)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-medium text-blue-700">Agencies</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {dashboard?.summary?.activeAgencies || 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Dashboard Widgets
function AdminWidgets() {
  const { dashboard, loading: analyticsLoading } = useDashboardAnalytics({
    timeframe: "7d",
    enabled: true,
  });

  return (
    <div className="space-y-6">
      {/* Platform Health */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Platform Overview</h3>
        </div>
        {analyticsLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-medium text-blue-700">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {dashboard?.summary?.totalUsers?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-medium text-emerald-700">Active Services</span>
              </div>
              <p className="text-2xl font-bold text-emerald-900">
                {dashboard?.summary?.totalServices?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-yellow-700" />
                <span className="text-xs font-medium text-yellow-700">Total Bookings</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">
                {dashboard?.summary?.totalBookings?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-medium text-purple-700">Platform Revenue</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(dashboard?.summary?.totalRevenue)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Component
export function RoleDashboardWidgets() {
  const { roleView, isClientView, isProviderView } = useActiveRoleView();
  const isSupplierView = roleView === "supplier";
  const isInstructorView = roleView === "instructor";
  const isAgencyView = roleView === "agency_owner" || roleView === "agency_admin";
  const isAdminView = roleView === "admin";

  if (isClientView) {
    return <ClientWidgets />;
  }

  if (isProviderView) {
    return <ProviderWidgets />;
  }

  if (isSupplierView) {
    return <SupplierWidgets />;
  }

  if (isInstructorView) {
    return <InstructorWidgets />;
  }

  if (isAgencyView) {
    return <AgencyWidgets />;
  }

  if (isAdminView) {
    return <AdminWidgets />;
  }

  return null;
}

