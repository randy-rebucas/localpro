import { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  HeaderLoadingState, 
  ServicesLoadingState, 
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
}: {
  children: React.ReactNode;
  services: React.ReactNode;
  header: React.ReactNode;
}) {
  // Check if we have any content to display
  const hasContent = header || services || children;
  
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
    
        {/* Main Content (children) - for any additional content */}
        {children && (
          <Suspense fallback={<div className="h-32 bg-slate-800 rounded-lg animate-pulse" />}>
            {children}
          </Suspense>
        )}
      </div>
    </div>
  );
}
