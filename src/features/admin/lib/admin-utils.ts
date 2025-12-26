/**
 * Admin Utilities
 * 
 * Utility functions for admin operations, permissions, and data processing
 */

import type { SessionData } from "@/lib/session";
import { hasRole, hasAnyRole, type UserRole } from "@/shared/lib/role-utils";

/**
 * Check if user has admin access
 */
export function hasAdminAccess(session: SessionData | null): boolean {
  return hasRole(session, "admin");
}

/**
 * Check if user can access admin panel
 */
export function canAccessAdminPanel(session: SessionData | null): boolean {
  return hasAnyRole(session, ["admin", "agency_owner", "agency_admin"]);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(session: SessionData | null): boolean {
  return hasAnyRole(session, ["admin", "agency_owner", "agency_admin"]);
}

/**
 * Check if user can manage platform settings
 */
export function canManagePlatform(session: SessionData | null): boolean {
  return hasRole(session, "admin");
}

/**
 * Check if user can view all analytics
 */
export function canViewAllAnalytics(session: SessionData | null): boolean {
  return hasRole(session, "admin");
}

/**
 * Check if user can manage finances
 */
export function canManageFinances(session: SessionData | null): boolean {
  return hasRole(session, "admin");
}

/**
 * Format admin statistics for display
 */
export interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalServices: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  pendingVerifications: number;
}

export function formatAdminStats(data: Partial<AdminStats>): AdminStats {
  return {
    totalUsers: data.totalUsers ?? 0,
    totalProviders: data.totalProviders ?? 0,
    totalServices: data.totalServices ?? 0,
    totalBookings: data.totalBookings ?? 0,
    totalRevenue: data.totalRevenue ?? 0,
    activeUsers: data.activeUsers ?? 0,
    pendingVerifications: data.pendingVerifications ?? 0,
  };
}

/**
 * Calculate growth percentage
 */
export function calculateGrowth(current: number, previous: number): {
  value: number;
  percentage: number;
  trend: "up" | "down" | "stable";
} {
  if (previous === 0) {
    return {
      value: current,
      percentage: current > 0 ? 100 : 0,
      trend: current > 0 ? "up" : "stable",
    };
  }

  const change = current - previous;
  const percentage = (change / previous) * 100;

  return {
    value: change,
    percentage: Math.abs(percentage),
    trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
  };
}

/**
 * Format currency for admin display
 */
export function formatAdminCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format large numbers for admin display
 */
export function formatAdminNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Get status color for admin badges
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    active: "bg-accent/10 text-accent",
    inactive: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    suspended: "bg-red-100 text-red-800",
    approved: "bg-accent/10 text-accent",
    rejected: "bg-red-100 text-red-800",
    completed: "bg-primary/10 text-primary",
    cancelled: "bg-gray-100 text-gray-800",
  };

  return statusColors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
}

/**
 * Format date range for admin queries
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

export function getDateRange(timeframe: "today" | "week" | "month" | "quarter" | "year" | "custom", customRange?: DateRange): DateRange {
  const now = new Date();
  let startDate: Date;
  const endDate: Date = new Date(now);

  switch (timeframe) {
    case "today":
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "year":
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "custom":
      if (customRange) {
        return customRange;
      }
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

/**
 * Validate admin action permissions
 */
export interface AdminAction {
  action: string;
  resource: string;
  requiredRole?: UserRole[];
}

export function validateAdminAction(session: SessionData | null, action: AdminAction): boolean {
  if (!session) return false;

  // Admin can do everything
  if (hasRole(session, "admin")) return true;

  // Check specific role requirements
  if (action.requiredRole) {
    return hasAnyRole(session, action.requiredRole);
  }

  return false;
}

/**
 * Format user status for admin display
 */
export function formatUserStatus(status: string): {
  label: string;
  color: string;
  badge: string;
} {
  const statusMap: Record<string, { label: string; color: string; badge: string }> = {
    active: {
      label: "Active",
      color: "text-accent",
      badge: "bg-accent/10 text-accent",
    },
    inactive: {
      label: "Inactive",
      color: "text-gray-600",
      badge: "bg-gray-100 text-gray-800",
    },
    suspended: {
      label: "Suspended",
      color: "text-red-600",
      badge: "bg-red-100 text-red-800",
    },
    pending_verification: {
      label: "Pending Verification",
      color: "text-yellow-600",
      badge: "bg-yellow-100 text-yellow-800",
    },
    banned: {
      label: "Banned",
      color: "text-red-600",
      badge: "bg-red-100 text-red-800",
    },
  };

  return statusMap[status.toLowerCase()] || {
    label: status,
    color: "text-gray-600",
    badge: "bg-gray-100 text-gray-800",
  };
}

/**
 * Calculate dashboard metrics
 */
export interface DashboardMetrics {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  activeProviders: number;
  conversionRate: number;
  averageOrderValue: number;
}

export function calculateDashboardMetrics(data: {
  revenue?: number;
  bookings?: number;
  users?: number;
  providers?: number;
  views?: number;
  completedBookings?: number;
}): DashboardMetrics {
  const conversionRate = data.views && data.completedBookings
    ? (data.completedBookings / data.views) * 100
    : 0;

  const averageOrderValue = data.bookings && data.revenue
    ? data.revenue / data.bookings
    : 0;

  return {
    totalRevenue: data.revenue ?? 0,
    totalBookings: data.bookings ?? 0,
    totalUsers: data.users ?? 0,
    activeProviders: data.providers ?? 0,
    conversionRate: Math.round(conversionRate * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
  };
}

/**
 * Export admin data to CSV
 */
export function exportToCSV(data: Array<Record<string, unknown>>, filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "object") return JSON.stringify(value);
          return String(value).replace(/"/g, '""');
        })
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export admin data to JSON
 */
export function exportToJSON(data: unknown, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format admin table data
 */
export function formatTableData<T extends object>(
  data: T[],
  columns: Array<{ key: keyof T; label: string; format?: (value: unknown) => string }>
): Array<Record<string, string>> {
  return data.map((row) => {
    const formatted: Record<string, string> = {};
    columns.forEach((column) => {
      const value = row[column.key];
      formatted[column.label] = column.format
        ? column.format(value)
        : value?.toString() ?? "";
    });
    return formatted;
  });
}

/**
 * Filter admin data by search query
 */
export function filterAdminData<T extends object>(
  data: T[],
  searchQuery: string,
  searchFields: Array<keyof T>
): T[] {
  if (!searchQuery.trim()) return data;

  const query = searchQuery.toLowerCase();
  return data.filter((item) =>
    searchFields.some((field) => {
      const value = item[field];
      return value?.toString().toLowerCase().includes(query);
    })
  );
}

/**
 * Sort admin data
 */
export function sortAdminData<T extends object>(
  data: T[],
  sortBy: keyof T,
  sortOrder: "asc" | "desc" = "asc"
): T[] {
  return [...data].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    if (sortOrder === "asc") {
      return aStr.localeCompare(bStr);
    }
    return bStr.localeCompare(aStr);
  });
}

/**
 * Paginate admin data
 */
export function paginateAdminData<T>(
  data: T[],
  page: number,
  pageSize: number
): {
  data: T[];
  pagination: {
    current: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} {
  const total = data.length;
  const pages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    pagination: {
      current: page,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
}

