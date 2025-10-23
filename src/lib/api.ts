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
  apiHealth: "/health",
  
  // Authentication & User Management
  authSendCode: "/api/auth/send-code",
  authVerifyCode: "/api/auth/verify-code",
  authCompleteOnboarding: "/api/auth/complete-onboarding",
  authProfileCompleteness: "/api/auth/profile-completeness",
  authMe: "/api/auth/me",
  authProfile: "/api/auth/profile",
  authUploadAvatar: "/api/auth/upload-avatar",
  authUploadPortfolio: "/api/auth/upload-portfolio",
  authLogout: "/api/auth/logout",
  
  // Marketplace Services
  marketplaceServices: "/api/marketplace/services",
  marketplaceServicesNearby: "/api/marketplace/services/nearby",
  marketplaceServiceById: "/api/marketplace/services",
  marketplaceMyServices: "/api/marketplace/my-services",
  marketplaceMyBookings: "/api/marketplace/my-bookings",
  marketplaceBookings: "/api/marketplace/bookings",
  marketplaceBookingStatus: "/api/marketplace/bookings",
  marketplaceBookingPhotos: "/api/marketplace/bookings",
  marketplaceBookingReview: "/api/marketplace/bookings",
  marketplacePayPalApprove: "/api/marketplace/bookings/paypal/approve",
  marketplacePayPalOrder: "/api/marketplace/bookings/paypal/order",
  
  // Job Board
  jobs: "/api/jobs",
  jobsSearch: "/api/jobs/search",
  jobsById: "/api/jobs",
  jobsMyApplications: "/api/jobs/my-applications",
  jobsMyJobs: "/api/jobs/my-jobs",
  jobsApply: "/api/jobs",
  jobsStats: "/api/jobs",
  jobsApplications: "/api/jobs",
  jobsApplicationStatus: "/api/jobs",
  
  // Academy & Learning
  academyCourses: "/api/academy/courses",
  academyCourseById: "/api/academy/courses",
  academyCategories: "/api/academy/categories",
  academyFeatured: "/api/academy/featured",
  academyMyCourses: "/api/academy/my-courses",
  academyMyCreatedCourses: "/api/academy/my-created-courses",
  academyCourseThumbnail: "/api/academy/courses",
  academyCourseVideos: "/api/academy/courses",
  academyCourseVideoDelete: "/api/academy/courses",
  academyEnroll: "/api/academy/courses",
  academyProgress: "/api/academy/courses",
  academyReviews: "/api/academy/courses",
  academyCoursesEnroll: "/api/academy/courses/[id]/enroll",
  academyCoursesProgress: "/api/academy/courses/[id]/progress",
  academyCoursesReviews: "/api/academy/courses/[id]/reviews",
  academyCoursesThumbnail: "/api/academy/courses/[id]/thumbnail",
  academyCoursesVideosById: "/api/academy/courses/[id]/videos/[videoId]",
  academyCoursesVideos: "/api/academy/courses/[id]/videos",
  academyCoursesById: "/api/academy/courses/[id]",
  academyStatistics: "/api/academy/statistics",
  
  // Supplies & Equipment
  supplies: "/api/supplies",
  suppliesCategories: "/api/supplies/categories",
  suppliesFeatured: "/api/supplies/featured",
  suppliesNearby: "/api/supplies/nearby",
  suppliesById: "/api/supplies",
  suppliesMySupplies: "/api/supplies/my-supplies",
  suppliesMyOrders: "/api/supplies/my-orders",
  suppliesImages: "/api/supplies",
  suppliesImageDelete: "/api/supplies",
  suppliesOrder: "/api/supplies",
  suppliesOrderStatus: "/api/supplies",
  suppliesReviews: "/api/supplies",
  
  // Equipment Rentals
  rentals: "/api/rentals",
  rentalsCategories: "/api/rentals/categories",
  rentalsFeatured: "/api/rentals/featured",
  rentalsNearby: "/api/rentals/nearby",
  rentalsById: "/api/rentals",
  rentalsMyRentals: "/api/rentals/my-rentals",
  rentalsMyBookings: "/api/rentals/my-bookings",
  rentalsImages: "/api/rentals",
  rentalsImageDelete: "/api/rentals",
  rentalsBook: "/api/rentals",
  rentalsBookingStatus: "/api/rentals",
  rentalsReviews: "/api/rentals",
  rentalsStatistics: "/api/rentals/statistics",
  
  // Facility Care Services
  facilityCare: "/api/facility-care",
  facilityCareNearby: "/api/facility-care/nearby",
  facilityCareById: "/api/facility-care",
  facilityCareMyServices: "/api/facility-care/my-services",
  facilityCareMyBookings: "/api/facility-care/my-bookings",
  facilityCareImages: "/api/facility-care",
  facilityCareImageDelete: "/api/facility-care",
  facilityCareBook: "/api/facility-care",
  facilityCareBookingStatus: "/api/facility-care",
  facilityCareReviews: "/api/facility-care",
  
  // Communication & Messaging
  communicationConversations: "/api/communication/conversations",
  communicationConversationById: "/api/communication/conversations",
  communicationConversationsMessagesById: "/api/communication/conversations/[id]/messages/[messageId]",
  communicationConversationsMessages: "/api/communication/conversations/[id]/messages",
  communicationConversationsRead: "/api/communication/conversations/[id]/read",
  communicationConversationsById: "/api/communication/conversations/[id]",
  communicationMessages: "/api/communication/conversations",
  communicationMessageUpdate: "/api/communication/conversations",
  communicationMessageDelete: "/api/communication/conversations",
  communicationRead: "/api/communication/conversations",
  communicationNotifications: "/api/communication/notifications",
  communicationNotificationCount: "/api/communication/notifications/count",
  communicationNotificationRead: "/api/communication/notifications",
  communicationNotificationReadAll: "/api/communication/notifications/read-all",
  communicationNotificationDelete: "/api/communication/notifications",
  communicationNotificationsReadAll: "/api/communication/notifications/read-all",
  communicationNotificationsRead: "/api/communication/notifications/[id]/read",
  communicationNotificationsById: "/api/communication/notifications/[id]",
  communicationEmailNotification: "/api/communication/notifications/email",
  communicationSmsNotification: "/api/communication/notifications/sms",
  communicationUnreadCount: "/api/communication/unread-count",
  communicationSearch: "/api/communication/search",
  communicationConversationWith: "/api/communication/conversation-with",
  communicationEvents: "/api/communication/events",
  communicationTyping: "/api/communication/typing",
  communicationTest: "/api/communication/test",
  
  // Advertising & Promotions
  ads: "/api/ads",
  adsCategories: "/api/ads/categories",
  adsFeatured: "/api/ads/featured",
  adsById: "/api/ads",
  adsClick: "/api/ads",
  adsMyAds: "/api/ads/my-ads",
  adsImages: "/api/ads",
  adsImageDelete: "/api/ads",
  adsPromote: "/api/ads",
  adsAnalytics: "/api/ads",
  adsStatistics: "/api/ads/statistics",
  analyticsCustom: "/api/analytics/custom",
  
  // Trust & Verification
  trustVerificationVerifiedUsers: "/api/trust-verification/verified-users",
  trustVerificationRequests: "/api/trust-verification/requests",
  trustVerificationRequestById: "/api/trust-verification/requests",
  trustVerificationRequestDocuments: "/api/trust-verification/requests",
  trustVerificationDocumentDelete: "/api/trust-verification/requests",
  trustVerificationMyRequests: "/api/trust-verification/my-requests",
  
  // Referral System
  referralsValidate: "/api/referrals/validate",
  referralsTrack: "/api/referrals/track",
  referralsLeaderboard: "/api/referrals/leaderboard",
  referralsMe: "/api/referrals/me",
  referralsStats: "/api/referrals/stats",
  referralsLinks: "/api/referrals/links",
  referralsRewards: "/api/referrals/rewards",
  referralsInvite: "/api/referrals/invite",
  referralsPreferences: "/api/referrals/preferences",
  
  // Financial Management
  financeOverview: "/api/finance/overview",
  financeTransactions: "/api/finance/transactions",
  financeEarnings: "/api/finance/earnings",
  financeExpenses: "/api/finance/expenses",
  financeReports: "/api/finance/reports",
  financeExpenseAdd: "/api/finance/expenses",
  financeWithdraw: "/api/finance/withdraw",
  financeTaxDocuments: "/api/finance/tax-documents",
  financeWalletSettings: "/api/finance/wallet/settings",
  
  // Google Maps Integration
  mapsGeocode: "/api/maps/geocode",
  mapsReverseGeocode: "/api/maps/reverse-geocode",
  mapsPlacesSearch: "/api/maps/places/search",
  mapsPlaceById: "/api/maps/places",
  mapsDistance: "/api/maps/distance",
  mapsNearby: "/api/maps/nearby",
  mapsValidateServiceArea: "/api/maps/validate-service-area",
  mapsAnalyzeCoverage: "/api/maps/analyze-coverage",
  
  // PayPal Integration
  paypalWebhook: "/api/paypal/webhook",
  
  // PayMaya Integration
  paymayaWebhook: "/api/paymaya/webhook",
  paymayaCheckout: "/api/paymaya/checkout",
  paymayaCheckoutById: "/api/paymaya/checkout",
  paymayaPayment: "/api/paymaya/payment",
  paymayaPaymentById: "/api/paymaya/payment",
  paymayaInvoice: "/api/paymaya/invoice",
  paymayaInvoiceById: "/api/paymaya/invoice",
  
  // Provider Management
  providers: "/api/providers",
  providersById: "/api/providers",
  providersProfileMe: "/api/providers/profile/me",
  providersProfile: "/api/providers/profile",
  providersOnboardingStep: "/api/providers/onboarding/step",
  providersDocumentsUpload: "/api/providers/documents/upload",
  providersDashboard: "/api/providers/dashboard/overview",
  providersAnalytics: "/api/providers/analytics/performance",
  providersDashboardOverview: "/api/providers/dashboard/overview",
  providersAnalyticsPerformance: "/api/providers/analytics/performance",
  
  // Agency Management
  agencies: "/api/agencies",
  agenciesById: "/api/agencies",
  agenciesLogo: "/api/agencies",
  agenciesProviders: "/api/agencies",
  agenciesProviderDelete: "/api/agencies",
  agenciesProviderStatus: "/api/agencies",
  agenciesAdmins: "/api/agencies",
  agenciesAdminDelete: "/api/agencies",
  agenciesAnalytics: "/api/agencies",
  agenciesMyAgencies: "/api/agencies/my/agencies",
  agenciesJoin: "/api/agencies/join",
  agenciesLeave: "/api/agencies/leave",
  
  // LocalPro Plus Subscriptions
  localProPlusPlans: "/api/localpro-plus/plans",
  localProPlusPlanById: "/api/localpro-plus/plans",
  localProPlusSubscribe: "/api/localpro-plus/subscribe",
  localProPlusConfirmPayment: "/api/localpro-plus/confirm-payment",
  localProPlusCancel: "/api/localpro-plus/cancel",
  localProPlusRenew: "/api/localpro-plus/renew",
  localProPlusMySubscription: "/api/localpro-plus/my-subscription",
  localProPlusSettings: "/api/localpro-plus/settings",
  localProPlusUsage: "/api/localpro-plus/usage",
  
  // Settings Management
  settingsUser: "/api/settings/user",
  settingsUserCategory: "/api/settings/user",
  settingsUserReset: "/api/settings/user/reset",
  settingsUserDelete: "/api/settings/user",
  settingsApp: "/api/settings/app",
  settingsAppCategory: "/api/settings/app",
  settingsAppFeaturesToggle: "/api/settings/app/features/toggle",
  settingsAppPublic: "/api/settings/app/public",
  settingsAppHealth: "/api/settings/app/health",
  
  // Analytics & Insights
  analyticsOverview: "/api/analytics/overview",
  analyticsUser: "/api/analytics/user",
  analyticsMarketplace: "/api/analytics/marketplace",
  analyticsJobs: "/api/analytics/jobs",
  analyticsReferrals: "/api/analytics/referrals",
  analyticsAgencies: "/api/analytics/agencies",
  analyticsTrack: "/api/analytics/track",
  
  // Global Search
  search: "/api/search",
  searchSuggestions: "/api/search/suggestions",
  searchPopular: "/api/search/popular",
  searchAdvanced: "/api/search/advanced",
  searchEntities: "/api/search/entities",
  searchCategories: "/api/search/categories",
  searchLocations: "/api/search/locations",
  searchTrending: "/api/search/trending",
  searchAnalytics: "/api/search/analytics",
  
  // Announcements
  announcements: "/api/announcements",
  announcementsById: "/api/announcements",
  
  // Activities & Discovery
  activitiesFeed: "/api/activities/feed",
  activitiesMy: "/api/activities/my",
  activitiesUser: "/api/activities/user",
  activitiesById: "/api/activities",
  activities: "/api/activities",
  activitiesInteractions: "/api/activities",
  activitiesStatsMy: "/api/activities/stats/my",
  activitiesStatsGlobal: "/api/activities/stats/global",
  activitiesMetadata: "/api/activities/metadata",
  activitiesUserById: "/api/activities/user/[userId]",

  usersById: "/api/users",
} as const;
