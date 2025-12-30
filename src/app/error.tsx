"use client";

export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { PageError } from "@/components/ui/error";
import { logger } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error("Application error", error, { digest: error.digest });
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
