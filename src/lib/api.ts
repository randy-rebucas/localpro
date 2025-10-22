import { API_CONFIG } from './env';

// API configuration
export const API_BASE_URL = API_CONFIG.apiBaseUrl;

import { createAuthFetchOptions } from './auth-utils';

// Helper function to make API requests
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, 
    createAuthFetchOptions(options)
  );

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  sendCode: "/api/auth/send-code",
  verifyCode: "/api/auth/verify-code",
  me: "/api/auth/me",
  profile: "/api/auth/profile",
  profileCompleteness: "/api/auth/profile-completeness",
  uploadAvatar: "/api/auth/upload-avatar",
  uploadPortfolio: "/api/auth/upload-portfolio",
  logout: "/api/auth/logout",
  
  // Marketplace
  marketplaceServices: "/api/marketplace/services",
  marketplaceServicesNearby: "/api/marketplace/services/nearby",
  marketplaceServiceById: "/api/marketplace/services",
  marketplaceBookings: "/api/marketplace/bookings",
  marketplaceBookingStatus: "/api/marketplace/bookings",
  marketplaceBookingPhotos: "/api/marketplace/bookings",
  marketplaceBookingReview: "/api/marketplace/bookings",
  marketplacePayPalApprove: "/api/marketplace/bookings/paypal/approve",
  marketplacePayPalOrder: "/api/marketplace/bookings/paypal/order",
  // Get all user's services
  myServices: "/api/marketplace/my-services",

  // Supplies
  supplies: "/api/supplies",
  suppliesCategories: "/api/supplies/categories",
  suppliesFeatured: "/api/supplies/featured",
  suppliesNearby: "/api/supplies/nearby",
  suppliesById: "/api/supplies",
  suppliesMySupplies: "/api/supplies/my-supplies",
  suppliesMyOrders: "/api/supplies/my-orders",
  suppliesStatistics: "/api/supplies/statistics",
  
  // Academy
  academyCourses: "/api/academy/courses",
  academyCategories: "/api/academy/categories",
  academyFeatured: "/api/academy/featured",
  academyMyCourses: "/api/academy/my-courses",
  academyMyCreatedCourses: "/api/academy/my-created-courses",
  academyStatistics: "/api/academy/statistics",
  
  // Finance
  financeOverview: "/api/finance/overview",
  financeTransactions: "/api/finance/transactions",
  financeEarnings: "/api/finance/earnings",
  financeExpenses: "/api/finance/expenses",
  financeReports: "/api/finance/reports",
  financeTaxDocuments: "/api/finance/tax-documents",
  
  // Rentals
  rentals: "/api/rentals",
  rentalsCategories: "/api/rentals/categories",
  rentalsFeatured: "/api/rentals/featured",
  rentalsNearby: "/api/rentals/nearby",
  rentalsMyRentals: "/api/rentals/my-rentals",
  rentalsMyBookings: "/api/rentals/my-bookings",
  rentalsStatistics: "/api/rentals/statistics",
  
  // Ads
  ads: "/api/ads",
  adsCategories: "/api/ads/categories",
  adsFeatured: "/api/ads/featured",
  adsMyAds: "/api/ads/my-ads",
  adsStatistics: "/api/ads/statistics",
  
  // Facility Care
  facilityCare: "/api/facility-care",
  facilityCareNearby: "/api/facility-care/nearby",
  facilityCareMyServices: "/api/facility-care/my-services",
  facilityCareMyBookings: "/api/facility-care/my-bookings",
  
  // LocalPro Plus
  localProPlusPlans: "/api/localpro-plus/plans",
  localProPlusMySubscription: "/api/localpro-plus/my-subscription",
  localProPlusUsage: "/api/localpro-plus/usage",
  localProPlusAnalytics: "/api/localpro-plus/analytics",
  
  // Trust Verification
  trustVerificationVerifiedUsers: "/api/trust-verification/verified-users",
  trustVerificationRequests: "/api/trust-verification/requests",
  trustVerificationMyRequests: "/api/trust-verification/my-requests",
  trustVerificationStatistics: "/api/trust-verification/statistics",
  
  // Communication
  communicationConversations: "/api/communication/conversations",
  communicationUnreadCount: "/api/communication/unread-count",
  communicationConversationsId: "/api/communication/conversations/{id}",
  communicationConversationsIdMessages: "/api/communication/conversations/{id}/messages",
  communicationConversationsIdMessagesMessageId: "/api/communication/conversations/{id}/messages/{messageId}",
  communicationConversationsIdRead: "/api/communication/conversations/{id}/read",

  communicationSearch: "/api/communication/search",
  communicationNotifications: "/api/communication/notifications",
  communicationNotificationsCount: "/api/communication/notifications/count",
  communicationNotificationsReadAll: "/api/communication/notifications/read-all",
  
  // Analytics
  analyticsOverview: "/api/analytics/overview",
  analyticsUser: "/api/analytics/user",
  analyticsMarketplace: "/api/analytics/marketplace",
  analyticsCustom: "/api/analytics/custom",
  
  // Maps
  mapsGeocode: "/api/maps/geocode",
  mapsReverseGeocode: "/api/maps/reverse-geocode",
  mapsPlacesSearch: "/api/maps/places/search",
  mapsDistance: "/api/maps/distance",
  mapsNearby: "/api/maps/nearby",
  
  // PayPal
  paypalWebhook: "/api/paypal/webhook",
  paypalWebhookEvents: "/api/paypal/webhook/events",
  
  // PayMaya
  paymayaWebhook: "/api/paymaya/webhook",
  paymayaCheckout: "/api/paymaya/checkout",
  paymayaPayment: "/api/paymaya/payment",
  paymayaInvoice: "/api/paymaya/invoice",
  
  // Jobs
  jobs: "/api/jobs",
  jobsSearch: "/api/jobs/search",
  jobsMyApplications: "/api/jobs/my-applications",
  jobsMyJobs: "/api/jobs/my-jobs",
  
  // Referrals
  referralsValidate: "/api/referrals/validate",
  referralsTrack: "/api/referrals/track",
  referralsLeaderboard: "/api/referrals/leaderboard",
  referralsMe: "/api/referrals/me",
  referralsStats: "/api/referrals/stats",
  referralsLinks: "/api/referrals/links",
  referralsRewards: "/api/referrals/rewards",
  referralsAnalytics: "/api/referrals/analytics",
  
  // Agencies
  agencies: "/api/agencies",
  agenciesMyAgencies: "/api/agencies/my/agencies",
  
  // Settings
  settingsUser: "/api/settings/user",
  settingsApp: "/api/settings/app",
  settingsAppPublic: "/api/settings/app/public",
  settingsAppHealth: "/api/settings/app/health",
  
  // Error Monitoring
  errorMonitoringStats: "/api/error-monitoring/stats",
  errorMonitoringUnresolved: "/api/error-monitoring/unresolved",
  errorMonitoringDashboard: "/api/error-monitoring/dashboard/summary",
  
  // Audit Logs
  auditLogs: "/api/audit-logs",
  auditLogsStats: "/api/audit-logs/stats",
  auditLogsUserActivity: "/api/audit-logs/user",
  auditLogsDashboard: "/api/audit-logs/dashboard/summary",
  
  // Providers
  providers: "/api/providers",
  providersProfileMe: "/api/providers/profile/me",
  providersDashboard: "/api/providers/dashboard/overview",
  providersAnalytics: "/api/providers/analytics/performance",
  providersAdminAll: "/api/providers/admin/all",
  
  // Logs
  logsStats: "/api/logs/stats",
  logs: "/api/logs",
  logsAnalyticsErrorTrends: "/api/logs/analytics/error-trends",
  logsAnalyticsPerformance: "/api/logs/analytics/performance",
  logsUserActivity: "/api/logs/user",
  logsDashboard: "/api/logs/dashboard/summary",
  logsSearchGlobal: "/api/logs/search/global",
  
  // Search
  search: "/api/search",
  searchSuggestions: "/api/search/suggestions",
  searchPopular: "/api/search/popular",
} as const;
