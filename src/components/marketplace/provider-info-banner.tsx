"use client";

import React from "react";
import Link from "next/link";
import { Navigation, BarChart3 } from "lucide-react";

export function ProviderInfoBanner() {
  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 mb-1">
            Managing your job postings?
          </p>
          <p className="text-xs text-blue-700 mb-3">
            View applications, update listings, and manage your job postings from your jobs dashboard.
          </p>
          <Link
            href="/marketplace/jobs/my-jobs"
            className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 hover:text-blue-900 underline"
          >
            Go to My Jobs
            <Navigation className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

