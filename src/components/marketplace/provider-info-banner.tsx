"use client";

import React from "react";
import Link from "next/link";
import { Navigation, BarChart3 } from "lucide-react";

export function ProviderInfoBanner() {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <BarChart3 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-medium text-primary mb-0.5">
            Managing your job postings?
          </p>
          <p className="text-xs text-primary mb-2">
            View applications, update listings, and manage your job postings from your jobs dashboard.
          </p>
          <Link
            href="/marketplace/my-jobs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary underline"
          >
            Go to My Jobs
            <Navigation className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

