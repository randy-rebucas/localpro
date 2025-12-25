
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BarChart3, Briefcase, CalendarDays, ChevronRight, Megaphone, Users, Bell, Heart, Compass } from "lucide-react";
import { useDashboardAnalytics } from "@/features/analytics/hooks/useDashboardAnalytics";
import { usePackageSwitcher } from "@/contexts/package-switcher-context";
import { useActiveRoleView } from "@/shared/hooks/useActiveRoleView";
import { getRoleDisplayName } from "@/shared/lib/role-utils";
import { getPackageEntry } from "@/shared/config/package-registry";

function formatCount(value?: number) {
  if (value === undefined || value === null) return "—";
  return value.toLocaleString();
}

export default function ActivityPage() {
  const { roleView, isClientView } = useActiveRoleView();

  const { dashboard, loading, error } = useDashboardAnalytics({ timeframe: "7d", enabled: !isClientView });
  const { activePackage, isLoading: packageLoading } = usePackageSwitcher();

  const continueLink = useMemo(() => {
    return getPackageEntry(activePackage);
  }, [activePackage]);

  const activeRoleLabel = useMemo(() => {
    try {
      return getRoleDisplayName(roleView as never);
    } catch {
      return roleView || "Client";
    }
  }, [roleView]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-50 rounded-lg">
            <BarChart3 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Recent activity</h2>
            <p className="text-sm text-gray-600">
              {isClientView ? `Recommended next steps for ${activeRoleLabel}` : "Last 7 days at a glance"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Continue */}
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">Continue</p>
              <p className="text-xs text-gray-600">
                {packageLoading ? "Loading your preference…" : continueLink ? `Jump back into ${continueLink.label}.` : "Pick a module to focus on next."}
              </p>
            </div>
            {continueLink ? (
              <Link
                href={continueLink.route}
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                Open
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link href="/settings" className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900">
                Settings
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Content */}
        {isClientView ? (
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/marketplace"
              className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <Compass className="w-4 h-4" />
                <span className="text-xs font-medium">Browse</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">Find services</div>
            </Link>
            <Link
              href="/marketplace/bookings"
              className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs font-medium">Bookings</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">View booking status</div>
            </Link>
            <Link
              href="/favorites"
              className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <Heart className="w-4 h-4" />
                <span className="text-xs font-medium">Saved</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">Revisit favorites</div>
            </Link>
            <Link
              href="/notifications"
              className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <Bell className="w-4 h-4" />
                <span className="text-xs font-medium">Updates</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">Check notifications</div>
            </Link>
          </div>
        ) : error ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            Couldn’t load activity right now.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium">New users</span>
              </div>
              <div className="mt-1 text-xl font-semibold text-gray-900">
                {loading ? "…" : formatCount(dashboard?.recentActivity?.newUsers)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs font-medium">New bookings</span>
              </div>
              <div className="mt-1 text-xl font-semibold text-gray-900">
                {loading ? "…" : formatCount(dashboard?.recentActivity?.newBookings)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Briefcase className="w-4 h-4" />
                <span className="text-xs font-medium">New jobs</span>
              </div>
              <div className="mt-1 text-xl font-semibold text-gray-900">
                {loading ? "…" : formatCount(dashboard?.recentActivity?.newJobs)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Megaphone className="w-4 h-4" />
                <span className="text-xs font-medium">New referrals</span>
              </div>
              <div className="mt-1 text-xl font-semibold text-gray-900">
                {loading ? "…" : formatCount(dashboard?.recentActivity?.newReferrals)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

