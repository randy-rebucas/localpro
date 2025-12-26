"use client";

import React from "react";
import { useSession } from "@/hooks/useAuth";
import { getUserName } from "@/lib/utils/user-name";
import { ServiceMarketplace } from "@/components/marketplace/service-marketplace";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Briefcase } from "lucide-react";
import { Users } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { Calendar } from "lucide-react";
import { Headphones } from "lucide-react";
import { useActiveRoleView } from "@/shared/hooks/useActiveRoleView";
import { Broadcaster } from "@/components/broadcaster";

export default function MarketplacePage() {
  const { data: session } = useSession();
  const { isProviderView } = useActiveRoleView();

  // Get user name for marketplace components
  const userName = getUserName(session);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0">
        {/* Broadcaster - Only shown for clients */}
        <Broadcaster />

        {/* Header Section - Following Reference Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Marketplace — Services & Providers
              </h1>
              <p className="text-gray-600">
                Find skilled professionals, post services, and connect with trusted service providers.
              </p>
            </div>
            {isProviderView && (
              <Link
                href="/marketplace/create-service"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent rounded-lg hover:from-accent hover:to-accent transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                Post Service
              </Link>
            )}
          </div>

          {/* Quick Links - Following Reference Layout */}
          {/* Reference: Browse Services | Find Providers | My Services (provider) | My Bookings | Support */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Briefcase className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Browse Services</span>
            </Link>
            <Link
              href="/marketplace/providers"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Users className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Find Providers</span>
            </Link>
            {isProviderView && (
              <Link
                href="/marketplace/my-services"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
              >
                <BarChart3 className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">My Services</span>
              </Link>
            )}
            <Link
              href="/marketplace/my-bookings"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Calendar className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">My Bookings</span>
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Headphones className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Support</span>
            </Link>
          </div>
        </div>
        {/* Main Marketplace Content - Following Reference Layout */}
        {/* ServiceMarketplace component handles: Filters Sidebar (left) + Main Content (right) */}
        {/* Main Content includes: Search + View Toggle + Service Grid/List + Pagination */}
        <ServiceMarketplace userName={userName} />
      </div>
    </div>
  );
}

