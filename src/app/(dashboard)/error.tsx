"use client";

import { useEffect } from "react";
import { PageError } from "@/components/ui/error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <PageError 
      title="Something went wrong"
      message="An error occurred while loading the dashboard. Please try again."
      onRetry={reset}
      onGoHome={() => window.location.href = '/dashboard'}
    />
  );
}
