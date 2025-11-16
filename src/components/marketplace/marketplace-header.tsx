"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { Plus, BarChart3 } from "lucide-react";

interface MarketplaceHeaderProps {
  greeting: string;
  description: string;
  isProviderView: boolean;
  children?: ReactNode;
}

export function MarketplaceHeader({
  greeting,
  description,
  isProviderView,
  children,
}: MarketplaceHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
        {/* Top Bar with Greeting */}
        <div className="flex items-start justify-between mb-3">
          {/* Welcome Text */}
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              {greeting}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">{description}</p>
          </div>
          
          {/* Provider Quick Actions - Only show in provider view */}
          {isProviderView && (
            <div className="flex items-center gap-2 ml-4">
              <Link
                href="/marketplace/jobs/create-job"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Post Job</span>
                <span className="sm:hidden">Post</span>
              </Link>
              <Link
                href="/marketplace/jobs/my-jobs"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium shadow-sm"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Jobs</span>
                <span className="sm:hidden">Jobs</span>
              </Link>
            </div>
          )}
        </div>
        
        {/* Optional children (e.g., ProviderInfoBanner) */}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}
