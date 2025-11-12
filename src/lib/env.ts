/**
 * Environment Configuration Utility
 * Centralized environment variable management with validation and type safety
 * Following Next.js App Router best practices for environment variables
 * 
 * @see https://nextjs.org/docs/app/guides/environment-variables
 */
import { logger } from './logger';

// Environment variable validation helpers
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
}

function getOptionalEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

function getNumberEnvVar(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    logger.warn(`Invalid number for ${key}`, { value, defaultValue });
    return defaultValue;
  }
  return parsed;
}

// Helper to check if we're on the client side
const isClient = typeof window !== 'undefined';

// Helper to get environment-appropriate API URL
// Development: Use relative paths (same domain as frontend)
// Production: https://localpro-super-app.onrender.com
function getApiBaseUrl(): string {
  const nodeEnv = process.env.NODE_ENV;
  return nodeEnv === 'production' 
    ? 'https://localpro-super-app.onrender.com' 
    : 'http://localhost:5000'; // Empty string for relative paths in development
}

// Helper to get server-only environment variables
function getServerEnvVar(key: string, defaultValue?: string): string | undefined {
  if (isClient) {
    // Silently return default value on client side to avoid warnings
    return defaultValue;
  }
  return getOptionalEnvVar(key, defaultValue);
}

// ===========================================
// CLIENT-SIDE CONFIGURATION (NEXT_PUBLIC_*)
// These variables are available in both server and client code
// ===========================================
export const CLIENT_CONFIG = {
  // Public app configuration
  appName: getOptionalEnvVar('NEXT_PUBLIC_APP_NAME', 'LocalPro'),
  appVersion: getOptionalEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
  appUrl: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  debug: getBooleanEnvVar('NEXT_PUBLIC_DEBUG_MODE', false),
  
  // Public API endpoints (safe to expose)
  apiBaseUrl: getOptionalEnvVar('NEXT_PUBLIC_API_BASE_URL', getApiBaseUrl()),
  
  // Client-side API configuration
  apiTimeout: getNumberEnvVar('NEXT_PUBLIC_API_TIMEOUT', 10000),
  
  // External services (public keys only)
  googleMapsApiKey: getOptionalEnvVar('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', ''),
 
  // Analytics (public)
  googleAnalyticsId: getOptionalEnvVar('NEXT_PUBLIC_GA_ID'),
  googleTagManagerId: getOptionalEnvVar('NEXT_PUBLIC_GTM_ID'),
} as const;

// ===========================================
// SERVER-SIDE CONFIGURATION
// These variables are only available on the server
// ===========================================
export const SERVER_CONFIG = {
  // Environment
  nodeEnv: getOptionalEnvVar('NODE_ENV', 'development'),
  
  // API Configuration (server-side)
  apiBaseUrl: getServerEnvVar('API_BASE_URL', getApiBaseUrl()),
  apiEndpoint: getServerEnvVar('API_ENDPOINT', getApiBaseUrl()),
  apiTimeout: getNumberEnvVar('API_TIMEOUT', 10000),
  apiRetryAttempts: getNumberEnvVar('API_RETRY_ATTEMPTS', 3),
  apiRetryDelay: getNumberEnvVar('API_RETRY_DELAY', 1000),
} as const;

// ===========================================
// AUTHENTICATION & SECURITY (SERVER-ONLY)
// ===========================================
export const AUTH_CONFIG = {
  jwtSecret: getServerEnvVar('JWT_SECRET', 'fallback-jwt-secret-key'),
  sessionSecret: getServerEnvVar('SESSION_SECRET', 'fallback-session-secret'),
  sessionMaxAge: getNumberEnvVar('SESSION_MAX_AGE', 604800), // 7 days
  encryptionKey: getServerEnvVar('ENCRYPTION_KEY', 'fallback-encryption-key'),
} as const;

// ===========================================
// EXTERNAL SERVICES (SERVER-ONLY)
// ===========================================
export const EXTERNAL_SERVICES = {
  googleMaps: {
    serverApiKey: getServerEnvVar('GOOGLE_MAPS_API_KEY'),
  },
  // Note: Firebase public config is in CLIENT_CONFIG
} as const;

// ===========================================
// PAYMENT GATEWAYS (SERVER-ONLY)
// ===========================================
export const PAYMENT_CONFIG = {
  paypal: {
    clientId: getServerEnvVar('PAYPAL_CLIENT_ID'),
    clientSecret: getServerEnvVar('PAYPAL_CLIENT_SECRET'),
    webhookId: getServerEnvVar('PAYPAL_WEBHOOK_ID'),
    mode: getOptionalEnvVar('PAYPAL_MODE', 'sandbox'),
  },
  paymaya: {
    publicKey: getServerEnvVar('PAYMAYA_PUBLIC_KEY'),
    secretKey: getServerEnvVar('PAYMAYA_SECRET_KEY'),
    webhookSecret: getServerEnvVar('PAYMAYA_WEBHOOK_SECRET'),
    mode: getOptionalEnvVar('PAYMAYA_MODE', 'sandbox'),
  },
} as const;

// ===========================================
// COMMUNICATION SERVICES (SERVER-ONLY)
// ===========================================
export const COMMUNICATION_CONFIG = {
  sms: {
    apiKey: getServerEnvVar('SMS_API_KEY'),
    apiUrl: getServerEnvVar('SMS_API_URL'),
    senderId: getOptionalEnvVar('SMS_SENDER_ID', 'LocalPro'),
  },
  email: {
    apiKey: getServerEnvVar('EMAIL_SERVICE_API_KEY'),
    from: getOptionalEnvVar('EMAIL_FROM', 'noreply@localpro.com'),
    apiUrl: getServerEnvVar('EMAIL_SERVICE_URL'),
  },
} as const;

// ===========================================
// FILE STORAGE (SERVER-ONLY)
// ===========================================
export const STORAGE_CONFIG = {
  aws: {
    accessKeyId: getServerEnvVar('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getServerEnvVar('AWS_SECRET_ACCESS_KEY'),
    region: getOptionalEnvVar('AWS_REGION', 'us-east-1'),
    bucket: getServerEnvVar('AWS_S3_BUCKET'),
  },
  cloudinary: {
    cloudName: getServerEnvVar('CLOUDINARY_CLOUD_NAME'),
    apiKey: getServerEnvVar('CLOUDINARY_API_KEY'),
    apiSecret: getServerEnvVar('CLOUDINARY_API_SECRET'),
  },
} as const;

// ===========================================
// ANALYTICS & MONITORING
// ===========================================
export const ANALYTICS_CONFIG = {
  // Google Analytics is in CLIENT_CONFIG
  sentry: {
    dsn: getServerEnvVar('SENTRY_DSN'),
    org: getServerEnvVar('SENTRY_ORG'),
    project: getServerEnvVar('SENTRY_PROJECT'),
  },
} as const;

// ===========================================
// DEVELOPMENT & DEBUGGING
// ===========================================
export const DEV_CONFIG = {
  debug: getBooleanEnvVar('DEBUG', false),
  verboseLogging: getBooleanEnvVar('VERBOSE_LOGGING', false),
  enableMockData: getBooleanEnvVar('ENABLE_MOCK_DATA', true),
} as const;

// ===========================================
// SECURITY HEADERS (SERVER-ONLY)
// ===========================================
export const SECURITY_CONFIG = {
  cors: {
    origin: getOptionalEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: getBooleanEnvVar('CORS_CREDENTIALS', true),
  },
  rateLimit: {
    max: getNumberEnvVar('RATE_LIMIT_MAX', 100),
    window: getNumberEnvVar('RATE_LIMIT_WINDOW', 900000), // 15 minutes
  },
} as const;

// ===========================================
// FEATURE FLAGS
// ===========================================
export const FEATURE_FLAGS = {
  messaging: getBooleanEnvVar('FEATURE_MESSAGING', true),
  payments: getBooleanEnvVar('FEATURE_PAYMENTS', true),
  analytics: getBooleanEnvVar('FEATURE_ANALYTICS', true),
  notifications: getBooleanEnvVar('FEATURE_NOTIFICATIONS', true),
  fileUpload: getBooleanEnvVar('FEATURE_FILE_UPLOAD', true),
} as const;

// ===========================================
// NOTIFICATION SERVICES (SERVER-ONLY)
// ===========================================
export const NOTIFICATION_CONFIG = {
  fcm: {
    serverKey: getServerEnvVar('FCM_SERVER_KEY'),
    projectId: getServerEnvVar('FCM_PROJECT_ID'),
  },
  webhooks: {
    secret: getServerEnvVar('WEBHOOK_SECRET'),
    notificationUrl: getServerEnvVar('NOTIFICATION_WEBHOOK_URL'),
  },
} as const;

// ===========================================
// BACKWARD COMPATIBILITY
// ===========================================
// Legacy exports for backward compatibility
export const APP_CONFIG = CLIENT_CONFIG;
export const API_CONFIG = SERVER_CONFIG;

// ===========================================
// VALIDATION HELPERS
// ===========================================
export function validateRequiredEnvVars(): void {
  // Skip validation during build/prerender
  // Check multiple indicators that we're in a build context
  const isBuildTime = 
    process.env.NEXT_PHASE === 'phase-production-build' || 
    process.env.NEXT_PHASE === 'phase-development-build' ||
    process.env.NEXT_PHASE === 'phase-production-export' ||
    typeof process.env.__NEXT_PRERENDER_MANIFEST !== 'undefined' ||
    (typeof process.env.NEXT_RUNTIME === 'undefined' && 
     typeof process.env.NEXT_PHASE !== 'undefined'); // Build phase set but runtime not set
  
  if (isBuildTime) {
    return; // Silently skip during build
  }

  const requiredVars = [
    'JWT_SECRET',
    'SESSION_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error('Missing required environment variables', undefined, { missingVars });
    logger.error('Please check your .env.local file and ensure all required variables are set', undefined, { 
      documentationUrl: 'https://nextjs.org/docs/pages/guides/environment-variables' 
    });
  }
}

export function getEnvironmentInfo(): Record<string, unknown> {
  return {
    client: {
      appName: CLIENT_CONFIG.appName,
      appVersion: CLIENT_CONFIG.appVersion,
      debug: CLIENT_CONFIG.debug,
    },
    server: {
      nodeEnv: SERVER_CONFIG.nodeEnv,
      apiBaseUrl: SERVER_CONFIG.apiBaseUrl,
      apiTimeout: SERVER_CONFIG.apiTimeout,
    },
    features: FEATURE_FLAGS,
    environment: SERVER_CONFIG.nodeEnv,
  };
}

// ===========================================
// NEXT.JS APP ROUTER ENVIRONMENT VARIABLE LOAD ORDER
// ===========================================
// Following Next.js App Router best practices:
// 1. process.env
// 2. .env.$(NODE_ENV).local
// 3. .env.local (Not checked when NODE_ENV is test)
// 4. .env.$(NODE_ENV)
// 5. .env
//
// For App Router, runtime environment variables are supported
// and evaluated during dynamic rendering on the server.

// Validate environment on import (server-side only)
// Skip validation during build/prerender to avoid blocking static generation
// Only validate at runtime, not during static generation
if (typeof window === 'undefined') {
  try {
    // The validation function itself now handles build-time checks
    validateRequiredEnvVars();
  } catch (error) {
    // Silently ignore validation errors during build to prevent build failures
    // Errors will be caught and logged at runtime instead
    if (process.env.NODE_ENV !== 'production' && typeof process.env.NEXT_PHASE === 'undefined') {
      // Only log in development if we're not in a build phase
      console.warn('Environment validation skipped:', error);
    }
  }
}
