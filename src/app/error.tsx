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
    console.error("Application error:", error);
  }, [error]);

  return (
    <PageError 
      title="Something went wrong"
      message="We encountered an unexpected error. This has been logged and we'll look into it."
      onRetry={reset}
      onGoHome={() => window.location.href = '/dashboard'}
    />
  );
}
