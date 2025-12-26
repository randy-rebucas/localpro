"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface AdminErrorStateProps {
  error: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export function AdminErrorState({ 
  error, 
  onRetry, 
  retryText = "Try Again",
  className = ""
}: AdminErrorStateProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
}
