"use client";

import React, { useMemo } from "react";
import { useSession } from "@/hooks/useAuth";
import { useRoleView } from "@/hooks/useRoleView";
import { getUserName } from "@/lib/utils/user-name";
import { getMarketplaceGreeting } from "@/components/marketplace/marketplace-greeting";
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { ProviderInfoBanner } from "@/components/marketplace/provider-info-banner";
import { JobMarketplace } from "@/components/marketplace/job-marketplace";
import { ProviderMarketplace } from "@/components/marketplace/provider-marketplace";

export default function MarketplacePage() {
  const { data: session } = useSession();
  
  // Get user roles
  const userRoles = useMemo(() => session?.user?.roles || [], [session?.user?.roles]);
  
  // Manage role view state
  const { isClientView, isProviderView } = useRoleView({ userRoles });

  // Get greeting and description based on role view
  const { greeting, description } = getMarketplaceGreeting(session, isClientView, isProviderView);
  
  // Get user name for marketplace components
  const userName = getUserName(session);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero / Header Section */}
      <MarketplaceHeader
        greeting={greeting}
        description={description}
        isProviderView={isProviderView}
      >
        {/* Provider View Info Banner */}
        {isProviderView && <ProviderInfoBanner />}
      </MarketplaceHeader>

      {/* Render appropriate marketplace component based on roleView */}
      {isClientView ? (
        <ProviderMarketplace userName={userName} />
      ) : isProviderView ? (
        <JobMarketplace userName={userName} />
      ) : null}
    </div>
  );
}

