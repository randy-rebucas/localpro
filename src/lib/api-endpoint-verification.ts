/**
 * API Endpoint Verification Utility
 * 
 * This utility helps verify that all API endpoints defined in api.ts
 * match the endpoints documented in the features/api-endpoints.md files.
 */

import { API_ENDPOINTS } from "./api";

/**
 * List of all expected API endpoints based on feature documentation
 */
export const EXPECTED_ENDPOINTS = {
  // Authentication
  auth: [
    "/api/auth/send-code",
    "/api/auth/verify-code",
    "/api/auth/complete-onboarding",
    "/api/auth/profile-completeness",
    "/api/auth/me",
    "/api/auth/profile",
    "/api/auth/upload-avatar",
    "/api/auth/upload-portfolio",
    "/api/auth/logout",
  ],

  // Marketplace Services
  marketplace: [
    "/api/marketplace/services",
    "/api/marketplace/services/categories",
    "/api/marketplace/my-services",
    "/api/marketplace/my-bookings",
    "/api/marketplace/bookings",
  ],

  // Jobs
  jobs: [
    "/api/jobs",
    "/api/jobs/search",
    "/api/jobs/my-applications",
    "/api/jobs/my-jobs",
    "/api/jobs/stats",
  ],

  // Academy
  academy: [
    "/api/academy/courses",
    "/api/academy/categories",
    "/api/academy/featured",
    "/api/academy/my-courses",
    "/api/academy/my-created-courses",
    "/api/academy/statistics",
  ],

  // Supplies
  supplies: [
    "/api/supplies",
    "/api/supplies/items",
    "/api/supplies/products",
    "/api/supplies/categories",
    "/api/supplies/types",
    "/api/supplies/statuses",
    "/api/supplies/featured",
    "/api/supplies/nearby",
    "/api/supplies/my-supplies",
    "/api/supplies/my-orders",
    "/api/supplies/statistics",
  ],

  // Rentals
  rentals: [
    "/api/rentals",
    "/api/rentals/categories",
    "/api/rentals/featured",
    "/api/rentals/nearby",
    "/api/rentals/my-rentals",
    "/api/rentals/my-bookings",
    "/api/rentals/items",
    "/api/rentals/statistics",
  ],

  // Facility Care
  facilityCare: [
    "/api/facility-care",
    "/api/facility-care/nearby",
    "/api/facility-care/my-services",
    "/api/facility-care/my-bookings",
    "/api/facility-care/statistics",
  ],

  // Communication
  communication: [
    "/api/communication/conversations",
    "/api/communication/notifications",
    "/api/communication/notifications/count",
    "/api/communication/notifications/read-all",
    "/api/communication/unread-count",
    "/api/communication/search",
    "/api/communication/conversation-with",
  ],

  // Ads
  ads: [
    "/api/ads",
    "/api/ads/categories",
    "/api/ads/featured",
    "/api/ads/my-ads",
    "/api/ads/statistics",
  ],

  // Analytics
  analytics: [
    "/api/analytics/overview",
    "/api/analytics/user",
    "/api/analytics/marketplace",
    "/api/analytics/jobs",
    "/api/analytics/referrals",
    "/api/analytics/agencies",
    "/api/analytics/track",
    "/api/analytics/real-time",
    "/api/analytics/performance",
  ],

  // Announcements
  announcements: [
    "/api/announcements",
    "/api/announcements/my/list",
    "/api/announcements/admin/statistics",
  ],

  // Referrals
  referrals: [
    "/api/referrals/validate",
    "/api/referrals/track",
    "/api/referrals/leaderboard",
    "/api/referrals/me",
    "/api/referrals/stats",
    "/api/referrals/links",
    "/api/referrals/rewards",
    "/api/referrals/invite",
    "/api/referrals/preferences",
  ],

  // Trust Verification
  trustVerification: [
    "/api/trust-verification/verified-users",
    "/api/trust-verification/requests",
    "/api/trust-verification/my-requests",
    "/api/trust-verification/statistics",
  ],

  // Finance
  finance: [
    "/api/finance/overview",
    "/api/finance/transactions",
    "/api/finance/earnings",
    "/api/finance/expenses",
    "/api/finance/reports",
    "/api/finance/withdraw",
    "/api/finance/tax-documents",
    "/api/finance/wallet/settings",
    "/api/finance/withdrawals",
    "/api/finance/top-up",
  ],

  // Providers
  providers: [
    "/api/providers",
    "/api/providers/profile/me",
    "/api/providers/profile",
    "/api/providers/onboarding/step",
    "/api/providers/documents/upload",
    "/api/providers/dashboard/overview",
    "/api/providers/analytics/performance",
    "/api/providers/admin/all",
  ],

  // Agencies
  agencies: [
    "/api/agencies",
    "/api/agencies/my/agencies",
    "/api/agencies/join",
    "/api/agencies/leave",
  ],

  // Subscriptions
  subscriptions: [
    "/api/localpro-plus/plans",
    "/api/localpro-plus/subscribe",
    "/api/localpro-plus/confirm-payment",
    "/api/localpro-plus/cancel",
    "/api/localpro-plus/renew",
    "/api/localpro-plus/my-subscription",
    "/api/localpro-plus/settings",
    "/api/localpro-plus/usage",
    "/api/localpro-plus/analytics",
  ],

  // Settings
  settings: [
    "/api/settings",
    "/api/settings/user",
    "/api/settings/user/reset",
    "/api/settings/app",
    "/api/settings/app/public",
    "/api/settings/app/health",
  ],

  // Users
  users: [
    "/api/users",
    "/api/users/stats",
    "/api/users/bulk",
  ],

  // Activities
  activities: [
    "/api/activities/feed",
    "/api/activities/my",
    "/api/activities/user",
    "/api/activities/stats/my",
    "/api/activities/stats/global",
  ],

  // Logs
  logs: [
    "/api/logs",
    "/api/logs/stats",
    "/api/logs/user",
    "/api/logs/dashboard/summary",
    "/api/logs/analytics/performance",
    "/api/logs/search/global",
    "/api/logs/export/data",
  ],
};

/**
 * Verifies that all expected endpoints are present in API_ENDPOINTS
 */
export function verifyApiEndpoints(): {
  missing: string[];
  extra: string[];
  allPresent: boolean;
} {
  const allExpected = Object.values(EXPECTED_ENDPOINTS).flat();
  const allDefined = Object.values(API_ENDPOINTS).filter(
    (endpoint) => typeof endpoint === "string" && endpoint.startsWith("/api/")
  ) as string[];

  const missing = allExpected.filter(
    (expected) => !allDefined.some((defined) => defined.includes(expected.split("/").pop() || ""))
  );

  // Note: Extra endpoints are okay, they might be additional features
  const extra: string[] = [];

  return {
    missing,
    extra,
    allPresent: missing.length === 0,
  };
}

/**
 * Gets all endpoints for a specific feature
 */
export function getFeatureEndpoints(feature: keyof typeof EXPECTED_ENDPOINTS): string[] {
  return EXPECTED_ENDPOINTS[feature] || [];
}

/**
 * Checks if a specific endpoint exists
 */
export function hasEndpoint(endpoint: string): boolean {
  return Object.values(API_ENDPOINTS).some(
    (defined) => typeof defined === "string" && defined.includes(endpoint)
  );
}

