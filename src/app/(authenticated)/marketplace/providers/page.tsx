"use client";

import React from "react";
import { useSession } from "@/hooks/useAuth";
import { getUserName } from "@/lib/utils/user-name";
import { ProviderMarketplace } from "@/components/marketplace/provider-marketplace";

export default function ProvidersPage() {
  const { data: session } = useSession();

  // Get user name for marketplace components
  const userName = getUserName(session);

  return (
    <>
        {/* Provider Marketplace Content */}
        <ProviderMarketplace userName={userName} />
    </>
  );
}

