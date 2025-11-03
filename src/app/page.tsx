"use client";

import React from "react";
import { SessionProvider } from "@/contexts/session-context";
import { useSession } from "@/hooks/useAuth";
import { getApiToken } from "@/lib/auth-utils";
import { Loader2, Shield } from "lucide-react";
import { MobileAuthForm } from "@/components/auth/mobile-auth-form";
import { MarketplaceLayout } from "@/components/marketplace/marketplace-layout";

function HomeContent() {
  const { data: session, status } = useSession();
  const apiToken = getApiToken();

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="text-white w-10 h-10" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If there's an API token, allow access to marketplace even if session fetch failed
  // This allows marketplace browsing with a token even if /api/auth/me fails
  const hasValidToken = !!apiToken;

  // Show authentication if not authenticated and no token exists
  if ((status === 'unauthenticated' || !session) && !hasValidToken) {
    return <MobileAuthForm />;
  }

  // Show marketplace layout if authenticated or has valid token
  return <MarketplaceLayout />;
}

export default function Home() {
  return (
    <SessionProvider>
      <HomeContent />
    </SessionProvider>
  );
}
