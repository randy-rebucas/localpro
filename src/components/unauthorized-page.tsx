"use client";

import React from "react";
import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";

interface UnauthorizedPageProps {
  title?: string;
  message?: string;
  backLink?: string;
  backLinkText?: string;
}

export function UnauthorizedPage({
  title = "Access Denied",
  message = "You don't have permission to access this page.",
  backLink = "/marketplace",
  backLinkText = "Go to Marketplace",
}: UnauthorizedPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-hidden flex items-center justify-center">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-8 backdrop-blur-sm text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
            <ShieldX className="w-10 h-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-3">
            {title}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8 text-base">
            {message}
          </p>

          {/* Back Link */}
          <Link
            href={backLink}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLinkText}
          </Link>
        </div>
      </div>
    </div>
  );
}

