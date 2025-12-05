"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useAuth";
import { getUserName } from "@/lib/utils/user-name";
import { JobMarketplace } from "@/components/marketplace/job-marketplace";
import { Loading } from "@/components/ui/loading";

export default function BrowseJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loading size="xl" text="Loading jobs marketplace..." />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!session) {
    router.push("/auth");
    return null;
  }

  // Get user name for marketplace component
  const userName = getUserName(session);

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0">
        {/* Job Marketplace Component */}
        <JobMarketplace userName={userName} />
      </div>
    </div>
  );
}

