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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Top Bar with Greeting */}
        <div className="flex items-start justify-between mb-6 lg:mb-8">
          {/* Welcome Text */}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {greeting}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">{description}</p>
          </div>
          
          {/* Provider Quick Actions - Only show in provider view */}
          {isProviderView && (
            <div className="flex items-center gap-3 ml-4">
              <Link
                href="/marketplace/jobs/create-job"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Post Job</span>
                <span className="sm:hidden">Post</span>
              </Link>
              <Link
                href="/marketplace/jobs/my-jobs"
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">My Jobs</span>
                <span className="sm:hidden">Jobs</span>
              </Link>
            </div>
          )}
        </div>
        
        {/* Optional children (e.g., ProviderInfoBanner) */}
        {children}
      </div>
    </div>
  );
}
