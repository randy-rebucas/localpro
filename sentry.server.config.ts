import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Performance monitoring
  beforeSend(event, hint) {
    // Filter out non-critical errors
    const error = hint.originalException;
    if (error instanceof Error) {
      // Filter out common server errors
      if (error.message.includes('ECONNRESET')) {
        return null;
      }
      if (error.message.includes('ENOTFOUND')) {
        return null;
      }
    }
    
    return event;
  },
});
