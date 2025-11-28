"use client";

import React, { useMemo } from "react";
import { useSession } from "@/hooks/useAuth";
import { useRoleView } from "@/hooks/useRoleView";
import { getUserName } from "@/lib/utils/user-name";
import { getMarketplaceGreeting } from "@/components/marketplace/marketplace-greeting";
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { ProviderMarketplace } from "@/components/marketplace/provider-marketplace";
import { Broadcaster } from "@/components/broadcaster";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0">
        {/* Broadcaster - Only shown for clients */}
        <div className="container">
          <Broadcaster />
        </div>

        {/* Hero / Header Section */}
        <MarketplaceHeader
          greeting={greeting}
          description={description}
          isProviderView={isProviderView}
        >

        </MarketplaceHeader>

        {/* Render marketplace component */}
        <ProviderMarketplace userName={userName} />
      </div>
    </div>
  );
}

