"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function ServicesError() {
  return (
    <div className="mb-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
          <h3 className="text-lg font-semibold text-red-800">Failed to load services</h3>
        </div>
        <p className="text-red-700 mb-4">
          We couldn&apos;t load the service modules. This might be a temporary issue.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center text-red-600 hover:text-red-700 font-medium"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try again
        </button>
      </div>
    </div>
  );
}
