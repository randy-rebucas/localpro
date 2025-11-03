import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry initialization
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: process.env.NODE_ENV === 'development',
    });
  }
}

export async function onRequestError(
  err: Error,
  request: {
    path: string;
    headers: Record<string, string | string[]>;
    method: string;
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
    [key: string]: unknown;
  }
) {
  // Capture request errors from nested React Server Components
  Sentry.captureRequestError(err, request, context);
}

