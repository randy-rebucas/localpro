"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { Plus, BarChart3, Sparkles } from "lucide-react";

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
    <div className="relative bg-slate-900/50 border-b border-slate-800/50 shadow-lg overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Top Bar with Greeting */}
        <div className="flex items-start justify-between mb-3">
          {/* Welcome Text */}
          <div className="flex-1 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-emerald-300 to-white bg-clip-text text-transparent">
                {greeting}
              </h1>
            </div>
            <p className="text-sm sm:text-base text-slate-400 font-medium ml-12">{description}</p>
          </div>
          
          {/* Provider Quick Actions - Only show in provider view */}
          {isProviderView && (
            <div className="flex items-center gap-2 ml-4 relative z-10">
              <Link
                href="/marketplace/create-job"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-105 transform duration-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Post Job</span>
                <span className="sm:hidden">Post</span>
              </Link>
              <Link
                href="/marketplace/my-jobs"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 text-slate-300 border-2 border-slate-700 rounded-xl hover:border-emerald-500/50 hover:bg-slate-700 hover:text-white transition-all text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transform duration-200"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">My Jobs</span>
                <span className="sm:hidden">Jobs</span>
              </Link>
            </div>
          )}
        </div>
        
        {/* Optional children (e.g., ProviderInfoBanner) */}
        {children && <div className="mt-3 relative z-10">{children}</div>}
      </div>
    </div>
  );
}
