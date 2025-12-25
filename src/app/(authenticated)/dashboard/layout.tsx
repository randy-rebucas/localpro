import { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  HeaderLoadingState, 
  ServicesLoadingState, 
  StatsLoadingState,
  ActivityLoadingState,
} from "@/components/ui/loading-state";
import { LayoutDashboardIcon } from "lucide-react";
import { generateMetadata as genMeta } from "@/lib/metadata";

export const metadata: Metadata = genMeta({
  title: "Dashboard",
  description: "Access your LocalPro dashboard to manage services, view analytics, and connect with professionals.",
  keywords: ["dashboard", "analytics", "services", "management"],
});

export default function DashboardLayout({
  children,
  services,
  header,
  stats,
  activity,
}: {
  children: React.ReactNode;
  services: React.ReactNode;
  header: React.ReactNode;
  stats: React.ReactNode;
  activity: React.ReactNode;
}) {
  // Check if we have any content to display
  const hasContent = header || stats || services || activity || children;
  
  // If no content is available, show the empty state
  if (!hasContent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <EmptyState
          icon={LayoutDashboardIcon}
          title="No content available"
          description="There is no content available for this dashboard."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="space-y-8">
        {/* Header */}
        {header && (
          <Suspense fallback={<HeaderLoadingState />}>
            <div key="dashboard-header">{header}</div>
          </Suspense>
        )}

        {/* Overview row: primary metrics + right rail (announcements + activity) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 min-w-0">
            {stats && (
              <Suspense fallback={<StatsLoadingState />}>
                <div key="dashboard-stats">{stats}</div>
              </Suspense>
            )}
          </div>

          <div className="space-y-6 min-w-0">
            {children && (
              <Suspense fallback={<div className="h-40 bg-gray-100 rounded-lg animate-pulse" />}>
                {children}
              </Suspense>
            )}

            {activity && (
              <Suspense fallback={<ActivityLoadingState />}>
                <div key="dashboard-activity">{activity}</div>
              </Suspense>
            )}
          </div>
        </div>
        
        {/* Modules / Services */}
        {services && (
          <Suspense fallback={<ServicesLoadingState />}>
            <div key="dashboard-services">{services}</div>
          </Suspense>
        )}
      </div>
    </div>
  );
}
