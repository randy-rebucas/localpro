"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { PageError } from "@/components/ui/error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture React rendering errors and send to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <PageError 
          title="Something went wrong"
          message="We encountered an unexpected error. This has been logged and we'll look into it."
          onRetry={reset}
          onGoHome={() => window.location.href = '/'}
        />
      </body>
    </html>
  );
}

