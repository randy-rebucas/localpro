import { Suspense } from "react";
import { DashboardEmptyState } from "@/components/ui/empty-state";
import { 
  HeaderLoadingState, 
  ServicesLoadingState, 
  ActivityLoadingState, 
  AnnouncementsLoadingState 
} from "@/components/ui/loading-state";

export default function DashboardLayout({
  children,
  services,
  activity,
  header,
  announcements,
}: {
  children: React.ReactNode;
  services: React.ReactNode;
  activity: React.ReactNode;
  header: React.ReactNode;
  announcements: React.ReactNode;
}) {
  // Check if we have any content to display
  const hasContent = header || services || announcements || activity || children;
  
  // If no content is available, show the empty state
  if (!hasContent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      {header && (
        <Suspense fallback={<HeaderLoadingState />}>
          <div key="dashboard-header">{header}</div>
        </Suspense>
      )}
      
      {/* Services Section */}
      {services && (
        <Suspense fallback={<ServicesLoadingState />}>
          <div key="dashboard-services">{services}</div>
        </Suspense>
      )}
      
      {/* 2-Column Section: Announcements and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {announcements && (
          <Suspense fallback={<AnnouncementsLoadingState />}>
            <div key="dashboard-announcements">{announcements}</div>
          </Suspense>
        )}
        {activity && (
          <Suspense fallback={<ActivityLoadingState />}>
            <div key="dashboard-activity">{activity}</div>
          </Suspense>
        )}
      </div>
      
      {/* Main Content (children) - for any additional content */}
      {children && (
        <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
          {children}
        </Suspense>
      )}
    </div>
  );
}
