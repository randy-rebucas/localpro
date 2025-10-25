"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "../../components/admin/admin-header";
import { useRoleAccess } from "@/components/role-guard";

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
    
    // Debug logging to understand the role issue
    console.log("Admin Layout Debug:", {
      session: session,
      userRole: session?.user?.role,
      roleAccess: roleAccess,
      isAdmin: roleAccess.isAdmin
    });
    
    // Temporary bypass for development - allow access if user has any role
    // TODO: Remove this in production and ensure proper admin role assignment
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasAnyRole = session?.user?.role && session.user.role !== 'client';
    
    if (!roleAccess.isAdmin && !(isDevelopment && hasAnyRole)) {
      console.log("Redirecting to dashboard - user is not admin");
      router.push("/dashboard");
      return;
    }
  }, [session, status, router, roleAccess.isAdmin, roleAccess]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading admin panel..." />
      </div>
    );
  }

  // Temporary bypass for development
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasAnyRole = session?.user?.role && session.user.role !== 'client';
  
  if (!session || (!roleAccess.isAdmin && !(isDevelopment && hasAnyRole))) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)}
          user={session.user}
        />
        
        {/* Page content - scrollable area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="py-4">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
