"use client";

import React, { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useAuth";
import { useRoleView } from "@/hooks/useRoleView";
import { useRoleAccess } from "@/components/role-guard";
import { getUserName } from "@/lib/utils/user-name";
import { JobMarketplace } from "@/components/marketplace/job-marketplace";
import { Loading } from "@/components/ui/loading";
import { UnauthorizedPage } from "@/components/unauthorized-page";

export default function BrowseJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const roleAccess = useRoleAccess();

  // Get user roles
  const userRoles = useMemo(() => session?.user?.roles || [], [session?.user?.roles]);

  // Manage role view state
  const { roleView, isProviderView } = useRoleView({ userRoles });

  // Check authorization - jobs page should only be accessible to admin and provider roles
  // No redirect needed - we'll show unauthorized page instead

  // Show loading state while checking authorization
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-green-50/30">
        <Loading size="xl" text="Loading jobs marketplace..." />
      </div>
    );
  }

  // Check authorization
  if (!session) {
    router.push("/auth");
    return null;
  }

  const hasAuthorizedRole = roleAccess.isProvider || roleAccess.isAdmin;
  const isInProviderView = roleView === 'provider' || roleView === 'admin';
  
  // Show unauthorized page if user doesn't have required role or view
  if (!hasAuthorizedRole || !isInProviderView) {
    return (
      <UnauthorizedPage
        title="Access Denied"
        message="This page is only accessible to providers and administrators. Please switch to provider view or contact support if you believe this is an error."
        backLink="/marketplace"
        backLinkText="Go to Marketplace"
      />
    );
  }

  // Get user name for marketplace component
  const userName = getUserName(session);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0">
        {/* Job Marketplace Component */}
        <JobMarketplace userName={userName} />
      </div>
    </div>
  );
}

