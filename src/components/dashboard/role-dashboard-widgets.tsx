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
  BarChart3,
  ArrowRight,
  Building,
  Shield,
  Users,
  Star,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
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
    <>
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
    </>
  );
}

// Provider Dashboard Widgets
function ProviderWidgets() {
  const { bookings: allBookings, loading: bookingsLoading } = useBookings({
    limit: 50,
    sortBy: "scheduledDate",
    sortOrder: "asc",
  });

  const { loading: analyticsLoading } = useDashboardAnalytics({
    timeframe: "30d",
    enabled: true,
  });

  const [services, setServices] = useState<Array<{
    id: string;
    title?: string;
    name?: string;
    bookingCount?: number;
    totalEarnings?: number;
    rating?: number;
  }>>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Fetch provider services
  useEffect(() => {
    const fetchServices = async () => {
      if (!getApiToken()) return;
      try {
        setServicesLoading(true);
        const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServices}?isActive=true&limit=10&sortBy=bookingCount&sortOrder=desc`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
        if (response.ok) {
          const data = await response.json();
          const servicesData = data?.data?.services || data?.services || data?.data || [];
          setServices(servicesData.slice(0, 5).map((s: unknown) => {
            const service = s as Record<string, unknown>;
            return {
              id: service.id || service._id || '',
              title: service.title || service.name || '',
              name: service.name || service.title || '',
              bookingCount: service.bookingCount || 0,
              totalEarnings: service.totalEarnings || 0,
              rating: typeof service.rating === 'object' && service.rating !== null && 'average' in service.rating
                ? (service.rating as { average?: number }).average || 0
                : (service.rating as number) || 0,
            };
          }));
        }
      } catch (error) {
        logger.error('Error fetching services', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, []);

  const upcomingBookings = useMemo(() => {
    if (!allBookings) return [];
    const now = new Date();
    return allBookings
      .filter((b) => {
        const booking = b as Booking;
        const dateStr = booking.scheduledDate || booking.bookingDate;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return (booking.status === "confirmed" || booking.status === "in_progress") && date >= now;
      })
      .map((b) => {
        const booking = b as Booking;
        return {
          ...booking,
          id: booking.id || booking._id || '',
        } as Booking;
      })
      .slice(0, 5);
  }, [allBookings]);

  return (
    <>
      {/* Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
          </div>
          <Link
            href="/analytics"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Chart Placeholder */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-yellow-700" />
                <span className="text-sm font-medium text-yellow-700">Revenue Trend</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[65, 80, 70, 90, 85, 95, 100].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-yellow-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-yellow-700 mt-2">Last 7 days</p>
            </div>
            {/* Booking Trends Placeholder */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span className="text-sm font-medium text-emerald-700">Booking Trends</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[50, 60, 55, 70, 65, 75, 80].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-emerald-700 mt-2">Last 7 days</p>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h3>
            </div>
            <Link
              href="/marketplace/my-bookings?status=confirmed"
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
                    href={`/marketplace/my-bookings/${bookingId}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {typeof booking.service === 'object' 
                            ? (booking.service?.title || booking.service?.name || "Service")
                            : "Service"}
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
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 ml-3">
                        {booking.status || "Confirmed"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Service Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Service Performance</h3>
          </div>
          <Link
            href="/marketplace/my-services"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {servicesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">Service</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Bookings</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Earnings</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Rating</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <Link
                        href={`/marketplace/services/${service.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-emerald-700"
                      >
                        {service.title || service.name || "Service"}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-600">{service.bookingCount || 0}</td>
                    <td className="py-3 px-3 text-right text-sm text-gray-600">{formatCurrency(service.totalEarnings || 0)}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-600">{(service.rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-gray-500">
            No services found. <Link href="/marketplace/my-services" className="text-emerald-700 hover:text-emerald-800">Create your first service</Link>
          </div>
        )}
      </div>
    </>
  );
}

// Supplier Dashboard Widgets
function SupplierWidgets() {
  const { orders, loading: ordersLoading, error: ordersError } = useMyOrders({ limit: 50 });
  const { loading: analyticsLoading } = useDashboardAnalytics({
    timeframe: "30d",
    enabled: true,
  });

  const [products, setProducts] = useState<Array<{
    id: string;
    name?: string;
    title?: string;
    orderCount?: number;
    totalRevenue?: number;
    rating?: number;
  }>>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Fetch supplier products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!getApiToken()) return;
      try {
        setProductsLoading(true);
        const url = `${API_BASE_URL}${API_ENDPOINTS.supplies}?isActive=true&limit=10&sortBy=orderCount&sortOrder=desc`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
        if (response.ok) {
          const data = await response.json();
          const productsData = data?.data?.supplies || data?.supplies || data?.data || [];
          setProducts(productsData.slice(0, 5).map((p: unknown) => {
            const product = p as Record<string, unknown>;
            return {
              id: product.id || product._id || '',
              name: product.name || product.title || '',
              title: product.title || product.name || '',
              orderCount: product.orderCount || 0,
              totalRevenue: product.totalRevenue || 0,
              rating: typeof product.rating === 'object' && product.rating !== null && 'average' in product.rating
                ? (product.rating as { average?: number }).average || 0
                : (product.rating as number) || 0,
            };
          }));
        }
      } catch (error) {
        logger.error('Error fetching products', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

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

  return (
    <>
      {/* Revenue Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
          </div>
          <Link
            href="/analytics"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Chart */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span className="text-sm font-medium text-emerald-700">Revenue Trend</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[55, 65, 60, 75, 70, 80, 85].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-emerald-700 mt-2">Last 7 days</p>
            </div>
            {/* Order Trends */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-700" />
                <span className="text-sm font-medium text-blue-700">Order Trends</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[45, 55, 50, 65, 60, 70, 75].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-blue-700 mt-2">Last 7 days</p>
            </div>
          </div>
        )}
      </div>

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

      {/* Product Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
          </div>
          <Link
            href="/supplies"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {productsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">Product</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Orders</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Revenue</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Rating</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <Link
                        href={`/supplies/${product.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-emerald-700"
                      >
                        {product.title || product.name || "Product"}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-600">{product.orderCount || 0}</td>
                    <td className="py-3 px-3 text-right text-sm text-gray-600">{formatCurrency(product.totalRevenue || 0)}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-600">{(product.rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-gray-500">
            No products found. <Link href="/supplies" className="text-emerald-700 hover:text-emerald-800">Create your first product</Link>
          </div>
        )}
      </div>
    </>
  );
}

// Instructor Dashboard Widgets
function InstructorWidgets() {
  const { loading: analyticsLoading } = useDashboardAnalytics({
    timeframe: "30d",
    enabled: true,
  });

  const [courses, setCourses] = useState<Array<{
    id: string;
    title?: string;
    enrollmentCount?: number;
    totalRevenue?: number;
    rating?: number;
  }>>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [students, setStudents] = useState<Array<{
    id: string;
    name?: string;
    courseName?: string;
    enrolledAt?: string;
  }>>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Fetch instructor courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!getApiToken()) return;
      try {
        setCoursesLoading(true);
        const url = `${API_BASE_URL}${API_ENDPOINTS.academyMyCreatedCourses}?limit=10&sortBy=enrollmentCount&sortOrder=desc`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
        if (response.ok) {
          const data = await response.json();
          const coursesData = data?.data?.courses || data?.courses || data?.data || [];
          setCourses(coursesData.slice(0, 5).map((c: unknown) => {
            const course = c as Record<string, unknown>;
            return {
              id: course.id || course._id || '',
              title: course.title || course.name || '',
              enrollmentCount: course.enrollmentCount || 0,
              totalRevenue: course.totalRevenue || 0,
              rating: typeof course.rating === 'object' && course.rating !== null && 'average' in course.rating
                ? (course.rating as { average?: number }).average || 0
                : (course.rating as number) || 0,
            };
          }));
        }
      } catch (error) {
        logger.error('Error fetching courses', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch recent students/enrollments
  useEffect(() => {
    const fetchStudents = async () => {
      if (!getApiToken()) return;
      try {
        setStudentsLoading(true);
        // Use my-courses endpoint which includes enrollments
        const url = `${API_BASE_URL}${API_ENDPOINTS.academyMyCreatedCourses}?limit=10`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
        if (response.ok) {
          const data = await response.json();
          const coursesData = data?.data?.courses || data?.courses || data?.data || [];
          // Extract enrollments from courses
          const allEnrollments: Array<{
            id: string;
            name: string;
            courseName: string;
            enrolledAt: string;
          }> = [];
          coursesData.forEach((course: unknown) => {
            const courseObj = course as Record<string, unknown>;
            const enrollments = courseObj.enrollments as Array<unknown> || [];
            enrollments.forEach((enrollment: unknown) => {
              const enrollmentObj = enrollment as Record<string, unknown>;
              const student = typeof enrollmentObj.student === 'object' ? enrollmentObj.student as Record<string, unknown> : null;
              const studentName = student && typeof student.name === 'string' ? student.name : 
                (student ? `${String(student.firstName || '')} ${String(student.lastName || '')}`.trim() : '');
              allEnrollments.push({
                id: String(enrollmentObj.id || enrollmentObj._id || ''),
                name: studentName || 'Student',
                courseName: String(courseObj.title || courseObj.name || 'Course'),
                enrolledAt: String(enrollmentObj.enrolledAt || enrollmentObj.createdAt || ''),
              });
            });
          });
          setStudents(allEnrollments.slice(0, 5));
        }
      } catch (error) {
        logger.error('Error fetching students', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  return (
    <>
      {/* Analytics Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-gray-900">Analytics Overview</h3>
          </div>
          <Link
            href="/analytics"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enrollment Trends */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/20 border border-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-gray-700">Enrollment Trends</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[40, 50, 45, 60, 55, 70, 65].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-accent rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">Last 7 days</p>
            </div>
            {/* Earnings Chart */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-yellow-700" />
                <span className="text-sm font-medium text-yellow-700">Earnings Trend</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[50, 60, 55, 70, 65, 80, 75].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-yellow-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-yellow-700 mt-2">Last 7 days</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Students */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Students</h3>
            </div>
            <Link
              href="/academy/students"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {studentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Enrolled in {student.courseName} • {formatDate(student.enrolledAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Course Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-gray-900">Course Performance</h3>
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">Course</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Enrollments</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Earnings</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Rating</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <Link
                        href={`/academy/courses/${course.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-emerald-700"
                      >
                        {course.title || "Course"}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-600">{course.enrollmentCount || 0}</td>
                    <td className="py-3 px-3 text-right text-sm text-gray-600">{formatCurrency(course.totalRevenue || 0)}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-600">{(course.rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-gray-500">
            No courses found. <Link href="/academy/my-courses" className="text-emerald-700 hover:text-emerald-800">Create your first course</Link>
          </div>
        )}
      </div>
    </>
  );
}

// Agency Owner/Admin Dashboard Widgets
function AgencyWidgets() {
  const { dashboard, loading: analyticsLoading } = useDashboardAnalytics({
    timeframe: "30d",
    enabled: true,
  });

  const [providers, setProviders] = useState<Array<{
    id: string;
    name?: string;
    bookingCount?: number;
    totalEarnings?: number;
    rating?: number;
  }>>([]);
  const [providersLoading, setProvidersLoading] = useState(false);

  // Fetch agency providers
  useEffect(() => {
    const fetchProviders = async () => {
      if (!getApiToken()) return;
      try {
        setProvidersLoading(true);
        // Use my agencies endpoint to get agency data with providers
        const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesMyAgencies}?limit=1`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
        if (response.ok) {
          const data = await response.json();
          const agenciesData = data?.data?.agencies || data?.agencies || data?.data || [];
          // Extract providers from first agency
          const firstAgency = agenciesData[0] as Record<string, unknown> | undefined;
          const providersList = firstAgency?.providers as Array<unknown> || [];
          setProviders(providersList.slice(0, 5).map((p: unknown) => {
            const provider = p as Record<string, unknown>;
            const providerName = typeof provider.name === 'string' ? provider.name : 
              `${String(provider.firstName || '')} ${String(provider.lastName || '')}`.trim() || 'Provider';
            return {
              id: String(provider.id || provider._id || ''),
              name: providerName,
              bookingCount: typeof provider.bookingCount === 'number' ? provider.bookingCount : (typeof provider.bookingCount === 'string' ? parseInt(provider.bookingCount, 10) || 0 : 0),
              totalEarnings: typeof provider.totalEarnings === 'number' ? provider.totalEarnings : (typeof provider.totalEarnings === 'string' ? parseFloat(provider.totalEarnings) || 0 : 0),
              rating: typeof provider.rating === 'object' && provider.rating !== null && 'average' in provider.rating
                ? (provider.rating as { average?: number }).average || 0
                : (typeof provider.rating === 'number' ? provider.rating : 0),
            };
          }));
        }
      } catch (error) {
        logger.error('Error fetching providers', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setProvidersLoading(false);
      }
    };
    fetchProviders();
  }, []);

  return (
    <>
      {/* Agency Analytics Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Agency Analytics</h3>
          </div>
          <Link
            href="/analytics"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Agency Performance Chart */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-purple-700" />
                <span className="text-sm font-medium text-purple-700">Agency Performance</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[60, 70, 65, 80, 75, 85, 90].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-purple-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-purple-700 mt-2">Last 7 days</p>
            </div>
            {/* Provider Performance Chart */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-700" />
                <span className="text-sm font-medium text-blue-700">Provider Performance</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[50, 60, 55, 70, 65, 75, 80].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-blue-700 mt-2">Last 7 days</p>
            </div>
          </div>
        )}
      </div>

      {/* Team Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Team Management</h3>
          </div>
          <Link
            href="/agencies"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Manage team
            <ArrowRight className="w-4 h-4" />
          </Link>
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
                <span className="text-xs font-medium text-purple-700">Total Providers</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {dashboard?.summary?.activeProviders || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-medium text-emerald-700">Total Bookings</span>
              </div>
              <p className="text-2xl font-bold text-emerald-900">
                {dashboard?.summary?.totalBookings || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-yellow-700" />
                <span className="text-xs font-medium text-yellow-700">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">
                {formatCurrency(dashboard?.summary?.totalRevenue || 0)}
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

      {/* Provider Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Provider Performance</h3>
          </div>
          <Link
            href="/agencies"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {providersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : providers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">Provider</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Bookings</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Earnings</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Rating</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <Link
                        href={`/marketplace/providers/${provider.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-emerald-700"
                      >
                        {provider.name || "Provider"}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-600">{provider.bookingCount || 0}</td>
                    <td className="py-3 px-3 text-right text-sm text-gray-600">{formatCurrency(provider.totalEarnings || 0)}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-600">{(provider.rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-gray-500">
            No providers found. <Link href="/agencies" className="text-emerald-700 hover:text-emerald-800">Invite providers to your agency</Link>
          </div>
        )}
      </div>
    </>
  );
}

// Admin Dashboard Widgets
function AdminWidgets() {
  const { loading: analyticsLoading } = useDashboardAnalytics({
    timeframe: "30d",
    enabled: true,
  });

  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<{
    errors: number;
    performance: number;
    uptime: string;
  } | null>(null);

  // Fetch recent activity
  useEffect(() => {
    const fetchActivity = async () => {
      if (!getApiToken()) return;
      try {
        setActivityLoading(true);
        // Use analytics custom endpoint for recent events
        const url = `${API_BASE_URL}${API_ENDPOINTS.analyticsCustom}?limit=10&sortBy=timestamp&sortOrder=desc`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
        if (response.ok) {
          const data = await response.json();
          const events = data?.data || [];
          setRecentActivity(events.slice(0, 5).map((e: unknown) => {
            const event = e as Record<string, unknown>;
            return {
              id: event._id || event.id || '',
              type: event.eventType || 'activity',
              message: `${event.eventType || 'Activity'} - ${event.module || 'system'}`,
              timestamp: event.timestamp || new Date().toISOString(),
            };
          }));
        }
      } catch (error) {
        logger.error('Error fetching activity', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setActivityLoading(false);
      }
    };
    fetchActivity();
  }, []);

  // Fetch system health
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const url = `${API_BASE_URL}${API_ENDPOINTS.settingsAppHealth}`;
        const response = await fetch(url, { method: 'GET' });
        if (response.ok) {
          const data = await response.json();
          const health = data?.data || data;
          setSystemHealth({
            errors: health.errorCount || 0,
            performance: health.performanceScore || 100,
            uptime: health.uptime || '99.9%',
          });
        }
      } catch {
        // Silently fail - health endpoint might not be available
        setSystemHealth({ errors: 0, performance: 100, uptime: '99.9%' });
      }
    };
    fetchHealth();
  }, []);

  return (
    <>
      {/* Platform Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Platform Overview</h3>
          </div>
          <Link
            href="/admin/analytics"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Growth Chart */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-700" />
                <span className="text-sm font-medium text-blue-700">User Growth</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[40, 50, 45, 60, 55, 70, 65, 80, 75, 90].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-blue-700 mt-2">Last 30 days</p>
            </div>
            {/* Revenue Chart */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-yellow-700" />
                <span className="text-sm font-medium text-yellow-700">Revenue</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[50, 60, 55, 70, 65, 80, 75, 90, 85, 100].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-yellow-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-yellow-700 mt-2">Last 30 days</p>
            </div>
            {/* Activity Chart */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-emerald-700" />
                <span className="text-sm font-medium text-emerald-700">Activity</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[60, 70, 65, 80, 75, 85, 80, 90, 85, 95].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-emerald-700 mt-2">Last 30 days</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <Link
            href="/admin/analytics?tab=custom"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {activityLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-gray-500">No recent activity</div>
        )}
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          </div>
          <Link
            href="/admin/monitoring"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Error Monitoring */}
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Error Monitoring</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{systemHealth?.errors || 0}</p>
              <p className="text-xs text-gray-500">errors (24h)</p>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    (systemHealth?.errors || 0) > 10 ? 'bg-red-500' : 
                    (systemHealth?.errors || 0) > 5 ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min((systemHealth?.errors || 0) * 10, 100)}%` }}
                />
              </div>
            </div>
          </div>
          {/* Performance Metrics */}
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Performance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{systemHealth?.performance || 100}%</p>
              <p className="text-xs text-gray-500">uptime: {systemHealth?.uptime || '99.9%'}</p>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${systemHealth?.performance || 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Main Component
export function RoleDashboardWidgets({ containerClass = "space-y-6" }: { containerClass?: string }) {
  const { roleView, isClientView, isProviderView } = useActiveRoleView();
  const isSupplierView = roleView === "supplier";
  const isInstructorView = roleView === "instructor";
  const isAgencyView = roleView === "agency_owner" || roleView === "agency_admin";
  const isAdminView = roleView === "admin";

  if (isClientView) {
    return (
      <div className={containerClass}>
        <ClientWidgets />
      </div>
    );
  }

  if (isProviderView) {
    return (
      <div className={containerClass}>
        <ProviderWidgets />
      </div>
    );
  }

  if (isSupplierView) {
    return (
      <div className={containerClass}>
        <SupplierWidgets />
      </div>
    );
  }

  if (isInstructorView) {
    return (
      <div className={containerClass}>
        <InstructorWidgets />
      </div>
    );
  }

  if (isAgencyView) {
    return (
      <div className={containerClass}>
        <AgencyWidgets />
      </div>
    );
  }

  if (isAdminView) {
    return (
      <div className={containerClass}>
        <AdminWidgets />
      </div>
    );
  }

  return null;
}

