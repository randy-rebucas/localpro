"use client";

import React from "react";
import { useSession } from "@/hooks/useAuth";
import { Loader2, Shield } from "lucide-react";
import { MobileAuthForm } from "@/components/auth/mobile-auth-form";
import { MarketplaceLayout } from "@/components/marketplace/marketplace-layout";

export default function Home() {
  const { data: session, status } = useSession();

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

  // Show authentication if not authenticated
  if (status === 'unauthenticated' || !session) {
    return <MobileAuthForm />;
  }

  // Show marketplace layout if authenticated
  return <MarketplaceLayout />;
}
