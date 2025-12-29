# Environment Variables Reference

This document lists all environment variables used or referenced in the LocalPro application.

## Client-Side Variables (NEXT_PUBLIC_*)

These variables are exposed to the browser and can be accessed in both server and client code.

### Application Configuration
- `NEXT_PUBLIC_APP_NAME` - Application name (default: "LocalPro")
- `NEXT_PUBLIC_APP_VERSION` - Application version (default: "1.0.0")
- `NEXT_PUBLIC_APP_URL` - Application URL (default: "http://localhost:3000")
- `NEXT_PUBLIC_DEBUG_MODE` - Enable debug mode (default: "false")

### API Configuration
- `NEXT_PUBLIC_API_BASE_URL` - Public API base URL
  - Production: "https://localpro-super-app.onrender.com"
  - Development: "http://localhost:5000"
- `NEXT_PUBLIC_API_TIMEOUT` - API timeout in milliseconds (default: 10000)

### External Services
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key for location services
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase authentication domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID

### Analytics & Tracking
- `NEXT_PUBLIC_GA_ID` - Google Analytics tracking ID (format: "G-XXXXXXXXXX")
- `NEXT_PUBLIC_GTM_ID` - Google Tag Manager container ID (format: "GTM-XXXXXXX")

### SEO & Site Verification
- `NEXT_PUBLIC_SITE_URL` - Canonical site URL (default: "https://www.localpro.asia")
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` - Google Search Console verification code
- `NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION` - Facebook domain verification code
- `NEXT_PUBLIC_BING_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_WEBSITE_VERIFICATION` - Bing Webmaster verification code

### Error Tracking & Monitoring
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for error tracking (client-side)

### Logging
- `NEXT_PUBLIC_LOG_LEVEL` - Log level for client-side logging (optional)

---

## Server-Side Only Variables

These variables are only available on the server and should never be exposed to the client.

### Environment
- `NODE_ENV` - Node.js environment ("development", "production", "test")

### API Configuration
- `API_BASE_URL` - Server-side API base URL
  - Production: "https://localpro-super-app.onrender.com"
  - Development: "http://localhost:5000"
- `API_ENDPOINT` - API endpoint URL (same as API_BASE_URL)
- `API_TIMEOUT` - API timeout in milliseconds (default: 10000)
- `API_RETRY_ATTEMPTS` - Number of retry attempts for failed API calls (default: 3)
- `API_RETRY_DELAY` - Delay between retries in milliseconds (default: 1000)

### Authentication & Security
- `JWT_SECRET` - Secret key for JWT token encryption (REQUIRED)
- `SESSION_SECRET` - Secret key for session encryption (REQUIRED)
- `SESSION_MAX_AGE` - Session maximum age in seconds (default: 604800 = 7 days)
- `ENCRYPTION_KEY` - Key for password/token encryption (32 characters recommended)

### External Services (Server-Side)
- `GOOGLE_MAPS_API_KEY` - Server-side Google Maps API key

### Payment Gateways

#### PayPal
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret
- `PAYPAL_WEBHOOK_ID` - PayPal webhook ID
- `PAYPAL_MODE` - PayPal mode: "sandbox" or "live" (default: "sandbox")

#### PayMaya
- `PAYMAYA_PUBLIC_KEY` - PayMaya public key
- `PAYMAYA_SECRET_KEY` - PayMaya secret key
- `PAYMAYA_WEBHOOK_SECRET` - PayMaya webhook secret
- `PAYMAYA_MODE` - PayMaya mode: "sandbox" or "live" (default: "sandbox")

### Communication Services

#### SMS
- `SMS_API_KEY` - SMS service API key
- `SMS_API_URL` - SMS service API URL
- `SMS_SENDER_ID` - SMS sender ID (default: "LocalPro")

#### Email
- `EMAIL_SERVICE_API_KEY` - Email service API key
- `EMAIL_FROM` - Default sender email address (default: "noreply@localpro.com")
- `EMAIL_SERVICE_URL` - Email service API URL

### File Storage

#### AWS S3
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_REGION` - AWS region (default: "us-east-1")
- `AWS_S3_BUCKET` - S3 bucket name

#### Cloudinary
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### Analytics & Monitoring

#### Sentry (Server-Side)
- `SENTRY_DSN` - Sentry DSN for server-side error tracking
- `SENTRY_ORG` - Sentry organization slug
- `SENTRY_PROJECT` - Sentry project name

### Development & Debugging
- `DEBUG` - Enable debug mode (default: "false")
- `VERBOSE_LOGGING` - Enable verbose logging (default: "false")
- `ENABLE_MOCK_DATA` - Enable mock data for development (default: "true")

### Security Headers
- `CORS_ORIGIN` - CORS allowed origin (default: "http://localhost:3000")
- `CORS_CREDENTIALS` - Allow credentials in CORS (default: "true")
- `RATE_LIMIT_MAX` - Maximum requests per window (default: 100)
- `RATE_LIMIT_WINDOW` - Rate limit window in milliseconds (default: 900000 = 15 minutes)

### Feature Flags
- `FEATURE_MESSAGING` - Enable messaging feature (default: "true")
- `FEATURE_PAYMENTS` - Enable payments feature (default: "true")
- `FEATURE_ANALYTICS` - Enable analytics feature (default: "true")
- `FEATURE_NOTIFICATIONS` - Enable notifications feature (default: "true")
- `FEATURE_FILE_UPLOAD` - Enable file upload feature (default: "true")

### Notification Services
- `FCM_SERVER_KEY` - Firebase Cloud Messaging server key
- `FCM_PROJECT_ID` - Firebase Cloud Messaging project ID
- `WEBHOOK_SECRET` - Webhook secret for verification
- `NOTIFICATION_WEBHOOK_URL` - Webhook URL for notifications

### Database (Referenced in Documentation)
- `DATABASE_URL` - PostgreSQL database connection string
- `DB_POOL_MIN` - Minimum database connection pool size (default: 2)
- `DB_POOL_MAX` - Maximum database connection pool size (default: 10)

### Redis (Referenced in Documentation)
- `REDIS_URL` - Redis connection URL
- `REDIS_HOST` - Redis host (default: "localhost")
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password

### MongoDB (Referenced in Documentation)
- `MONGODB_URI` - MongoDB connection URI (default: "mongodb://localhost:27017/localpro")

### Other Service-Specific Variables (Referenced in Documentation)
- `FRONTEND_URL` - Frontend URL for referral links
- `MONITORING_ENABLED` - Enable monitoring (default: "false")
- `MAX_IMAGES_PER_ITEM` - Maximum images per rental item (default: 10)
- `RENTALS_CACHE_TIMEOUT` - Rentals cache timeout in seconds (default: 300)
- `MAX_BOOKING_DURATION` - Maximum booking duration in days (default: 30)

### SEO (Alternative Variable Names)
- `GOOGLE_VERIFICATION_ID` - Alternative name for Google verification (used in metadata.ts)

---

## Next.js Built-In Variables

These are automatically set by Next.js and should not be manually configured:

- `NEXT_PHASE` - Next.js build phase
  - "phase-production-build"
  - "phase-development-build"
  - "phase-production-export"
- `NEXT_RUNTIME` - Next.js runtime environment
- `__NEXT_PRERENDER_MANIFEST` - Internal Next.js variable for prerendering

---

## CI/CD & Testing Variables

### Continuous Integration
- `CI` - Indicates if running in CI environment (used by Playwright and Sentry)

### E2E Testing (Playwright)
- `E2E_BASE_URL` - Base URL for E2E tests (default: "http://localhost:3000")
- `E2E_CLIENT_PHONE` - Client phone number for E2E auth tests (optional)
- `E2E_MOCK_SMS_CODE` - Mock SMS code for E2E auth tests (optional)

---

## Variable Usage Locations

### Centralized Configuration Files
- `src/lib/env.ts` - Main environment variable configuration
- `src/shared/lib/env.ts` - Shared environment variable configuration (duplicate)

### Configuration Files
- `next.config.ts` - Next.js configuration
- `sentry.server.config.ts` - Sentry server configuration
- `src/instrumentation.ts` - Sentry instrumentation
- `src/instrumentation-client.ts` - Sentry client instrumentation
- `playwright.config.ts` - Playwright E2E test configuration

### Usage in Code
- `src/app/layout.tsx` - SEO verification meta tags
- `src/lib/seo-config.ts` - SEO configuration
- `src/shared/lib/seo-config.ts` - Shared SEO configuration
- `src/lib/logger.ts` - Logging configuration
- `src/shared/lib/logger.ts` - Shared logging configuration
- `src/lib/session.ts` - Session configuration
- `src/middleware.ts` - Middleware configuration
- Various hooks and components for API calls and feature flags

---

## Required Variables

The following variables are marked as required and will cause errors if not set:

- `JWT_SECRET` - Required for authentication
- `SESSION_SECRET` - Required for session management

---

## Notes

1. **Client vs Server**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never use this prefix for sensitive data like API keys, secrets, or tokens.

2. **Default Values**: Many variables have default values defined in `src/lib/env.ts`. Check that file for the complete list of defaults.

3. **Environment Files**: 
   - `.env.local` - Local development (gitignored)
   - `.env.development` - Development defaults
   - `.env.production` - Production defaults
   - `env.example` - Example template
   - `env.e2e` - E2E test configuration (gitignored)

4. **Validation**: Environment variables are validated on server startup (not during build) via `validateRequiredEnvVars()` in `src/lib/env.ts`.

5. **Documentation References**: Some variables are referenced in documentation files but may not be actively used in the codebase. These are marked as "Referenced in Documentation" above.

