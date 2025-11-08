"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { useRoleAccess } from "@/components/role-guard";
import { logger } from "@/lib/logger";
import ErrorBoundary from "@/components/error-boundary";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";
import { MonitoringProviders } from "@/components/monitoring";
import { UnregisterServiceWorker } from "@/components/unregister-sw";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const roleAccess = useRoleAccess();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth");
      return;
    }
    
    const userRole = session?.user?.role;
    const isUserAdmin = userRole === 'admin' || roleAccess.isAdmin;
    
    logger.debug("Admin Layout Debug", {
      hasSession: !!session,
      userRole: userRole,
      isAdmin: roleAccess.isAdmin,
      isUserAdmin: isUserAdmin
    });
    
    if (!isUserAdmin) {
      logger.debug("Redirecting to marketplace - user is not admin", { userRole: userRole });
      router.push("/marketplace");
      return;
    }
  }, [session, status, router, roleAccess.isAdmin]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Loading size="xl" text="Loading admin panel..." />
      </div>
    );
  }

  // Check if user is admin
  const userRole = session?.user?.role;
  const isUserAdmin = userRole === 'admin' || roleAccess.isAdmin;
  
  if (!session || !isUserAdmin) {
    return null;
  }

  return (
    <Providers>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
          {/* Background Pattern */}
          <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmOWZhZmMiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0YzAtMS4xLS45LTItMi0ySDI2Yy0xLjEgMC0yIC45LTIgMnMwLjkgMiAyIDJoOGMxLjEgMCAyLS45IDItMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40 pointer-events-none"></div>

          {/* Main Container */}
          <div className="relative flex h-screen overflow-hidden">
            {/* Sidebar */}
            <AdminSidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)} 
            />
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 w-full lg:ml-64 h-screen">
              {/* Header */}
              <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm flex-shrink-0">
                <AdminHeader 
                  onMenuClick={() => setSidebarOpen(true)}
                  user={session.user}
                />
              </header>
              
              {/* Page Content - Only this section scrolls */}
              <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent min-h-0">
                {/* Content */}
                <div className="w-full">
                  <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 w-full">
                    {/* Content wrapper - full width */}
                    <div className="w-full">
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-6 lg:p-8 w-full">
                        {children}
                      </div>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
        <Toaster position="top-right" />
        <MonitoringProviders />
        <UnregisterServiceWorker />
      </ErrorBoundary>
    </Providers>
  );
}
