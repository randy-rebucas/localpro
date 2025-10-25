"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
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
    if (!roleAccess.isAdmin) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router, roleAccess.isAdmin]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading admin panel..." />
      </div>
    );
  }

  if (!session || !roleAccess.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)}
          user={session.user}
        />
        
        {/* Page content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
