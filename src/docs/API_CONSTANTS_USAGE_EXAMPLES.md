# API Constants Usage Examples

## Overview

The enhanced `src/lib/api-auth-utils.ts` now utilizes the API constants from `src/lib/api.ts` to provide better type safety, consistency, and maintainability. This documentation covers all available functions and their usage patterns.

## Available Functions

### 1. `makeAuthenticatedRequestWithEndpoint()`
Use for simple endpoints without dynamic parameters.

```typescript
import { makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

// Example: Get notifications
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'communicationNotifications',
  { method: 'GET' }
);

// Example: Send SMS notification
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'communicationSmsNotification',
  {
    method: 'POST',
    body: JSON.stringify(data)
  }
);
```

### 2. `makeAuthenticatedRequestWithPath()`
Use for endpoints with dynamic parameters and query strings.

```typescript
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// Example: Get marketplace services with query parameters
const response = await makeAuthenticatedRequestWithPath(
  request,
  'marketplaceServices',
  [], // No path parameters
  { category: 'CLEANING', location: 'New York' }, // Query parameters
  { method: 'GET' }
);

// Example: Get specific job with ID
const response = await makeAuthenticatedRequestWithPath(
  request,
  'jobsById',
  ['123'], // Path parameter: job ID
  { include: 'applications' }, // Query parameters
  { method: 'GET' }
);

// Example: Create booking for specific service
const response = await makeAuthenticatedRequestWithPath(
  request,
  'marketplaceBookings',
  [], // No path parameters
  {}, // No query parameters
  {
    method: 'POST',
    body: JSON.stringify(bookingData)
  }
);
```

### 3. `buildApiUrl()`
Helper function to build URLs with endpoint constants.

```typescript
import { buildApiUrl } from "@/lib/api-auth-utils";

// Build URL for marketplace services with filters
const url = buildApiUrl('marketplaceServices', [], {
  category: 'CLEANING',
  location: 'New York',
  minPrice: '50',
  maxPrice: '200'
});
// Result: "https://api.example.com/api/marketplace/services?category=CLEANING&location=New+York&minPrice=50&maxPrice=200"

// Build URL for specific job applications
const url = buildApiUrl('jobsApplications', ['123'], {
  status: 'pending'
});
// Result: "https://api.example.com/api/jobs/123/applications?status=pending"
```

### 4. `handleApiRequestWithEndpoint()`
Complete request handler with session validation.

```typescript
import { handleApiRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  try {
    const response = await handleApiRequestWithEndpoint(
      request,
      'communicationNotifications',
      { method: 'GET' }
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### 5. `makePublicRequest()`
Make unauthenticated requests to public endpoints.

```typescript
import { makePublicRequest } from "@/lib/api-auth-utils";

// Example: Get public announcements
const response = await makePublicRequest(
  'announcements',
  { method: 'GET' }
);

// Example: Get public search suggestions
const response = await makePublicRequest(
  'searchSuggestions',
  { method: 'GET' }
);
```

### 6. `handleApiRoute()`
Standardized API route wrapper with error handling.

```typescript
import { handleApiRoute } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'analyticsOverview',
      { method: 'GET' }
    );
    return await response.json();
  }, "Analytics overview");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}
```

### 7. `createErrorResponse()`
Standardized error response handler.

```typescript
import { createErrorResponse } from "@/lib/api-auth-utils";

try {
  // API logic here
} catch (error) {
  const errorResponse = createErrorResponse(error, "User profile update");
  return NextResponse.json(
    { error: errorResponse.error, details: errorResponse.details },
    { status: errorResponse.status }
  );
}
```

## Route Pattern Examples

### Communication Routes

```typescript
// GET /api/communication/notifications
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'communicationNotifications',
  { method: 'GET' }
);

// POST /api/communication/notifications/sms
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'communicationSmsNotification',
  {
    method: 'POST',
    body: JSON.stringify(smsData)
  }
);

// GET /api/communication/conversations/:id/messages
const response = await makeAuthenticatedRequestWithPath(
  request,
  'communicationMessages',
  [conversationId],
  { limit: '50', offset: '0' },
  { method: 'GET' }
);
```

### Marketplace Routes

```typescript
// GET /api/marketplace/services
const response = await makeAuthenticatedRequestWithPath(
  request,
  'marketplaceServices',
  [],
  { category: 'CLEANING', location: 'New York' },
  { method: 'GET' }
);

// POST /api/marketplace/bookings
const response = await makeAuthenticatedRequestWithPath(
  request,
  'marketplaceBookings',
  [],
  {},
  {
    method: 'POST',
    body: JSON.stringify(bookingData)
  }
);

// GET /api/marketplace/my-services
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'marketplaceMyServices',
  { method: 'GET' }
);
```

### Job Routes

```typescript
// GET /api/jobs
const response = await makeAuthenticatedRequestWithPath(
  request,
  'jobs',
  [],
  { category: 'TECHNOLOGY', location: 'Remote' },
  { method: 'GET' }
);

// POST /api/jobs/:id/apply
const response = await makeAuthenticatedRequestWithPath(
  request,
  'jobsApply',
  [jobId],
  {},
  {
    method: 'POST',
    body: JSON.stringify(applicationData)
  }
);
```

### Academy Routes

```typescript
// GET /api/academy/courses
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'academyCourses',
  { method: 'GET' }
);

// POST /api/academy/courses/:id/enroll
const response = await makeAuthenticatedRequestWithPath(
  request,
  'academyEnroll',
  [courseId],
  {},
  {
    method: 'POST',
    body: JSON.stringify({ paymentMethod: 'credit_card' })
  }
);
```

### LocalPro Plus Subscription Routes

```typescript
// GET /api/localpro-plus/plans
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'localProPlusPlans',
  { method: 'GET' }
);

// POST /api/localpro-plus/subscribe
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'localProPlusSubscribe',
  {
    method: 'POST',
    body: JSON.stringify({ planId: 'premium', paymentMethod: 'credit_card' })
  }
);

// GET /api/localpro-plus/my-subscription
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'localProPlusMySubscription',
  { method: 'GET' }
);
```

### Settings Management Routes

```typescript
// GET /api/settings/user
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'settingsUser',
  { method: 'GET' }
);

// PUT /api/settings/user
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'settingsUser',
  {
    method: 'PUT',
    body: JSON.stringify({ notifications: true, theme: 'dark' })
  }
);

// GET /api/settings/app/public
const response = await makePublicRequest(
  'settingsAppPublic',
  { method: 'GET' }
);
```

### Activities & Discovery Routes

```typescript
// GET /api/activities/feed
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'activitiesFeed',
  { method: 'GET' }
);

// GET /api/activities/my
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'activitiesMy',
  { method: 'GET' }
);

// GET /api/activities/stats/my
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'activitiesStatsMy',
  { method: 'GET' }
);
```

### Analytics Routes

```typescript
// GET /api/analytics/overview
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'analyticsOverview',
  { method: 'GET' }
);

// GET /api/analytics/user
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'analyticsUser',
  { method: 'GET' }
);

// POST /api/analytics/track
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'analyticsTrack',
  {
    method: 'POST',
    body: JSON.stringify({ event: 'page_view', data: { page: '/dashboard' } })
  }
);
```

## Benefits of Using API Constants

### 1. **Type Safety**
- TypeScript autocomplete for endpoint names
- Compile-time validation of endpoint existence
- Prevents typos in endpoint URLs

### 2. **Consistency**
- Centralized endpoint management
- Consistent URL construction
- Easy to update endpoint paths

### 3. **Maintainability**
- Single source of truth for all endpoints
- Easy to refactor endpoint paths
- Better code organization

### 4. **Error Prevention**
- No more hardcoded URLs
- Automatic URL construction
- Consistent parameter handling

## Migration Guide

### Before (Manual URLs)
```typescript
// Old approach - manual URL construction
const response = await fetch(`${API_BASE_URL}/api/marketplace/services`, {
  method: 'GET',
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.user.id}`,
  }
});

// Old approach - manual query parameter handling
const queryParams = new URLSearchParams({ category: 'CLEANING', location: 'New York' });
const response = await fetch(`${API_BASE_URL}/api/marketplace/services?${queryParams}`, {
  method: 'GET',
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.user.id}`,
  }
});
```

### After (API Constants)
```typescript
// New approach - type-safe endpoint constants
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'marketplaceServices',
  { method: 'GET' }
);

// New approach - automatic query parameter handling
const response = await makeAuthenticatedRequestWithPath(
  request,
  'marketplaceServices',
  [],
  { category: 'CLEANING', location: 'New York' },
  { method: 'GET' }
);
```

### Migration Steps

1. **Replace manual fetch calls** with API constant functions
2. **Update function signatures** to use `NextRequest` instead of session objects
3. **Use endpoint constants** instead of hardcoded URLs
4. **Implement proper error handling** using `handleApiRoute` or `createErrorResponse`
5. **Test all endpoints** to ensure functionality is preserved

## Available Endpoint Constants

The `API_ENDPOINTS` object contains all available endpoints organized by category:

### Authentication & User Management
- `authSendCode`, `authVerifyCode`, `authCompleteOnboarding`
- `authProfileCompleteness`, `authMe`, `authProfile`
- `authUploadAvatar`, `authUploadPortfolio`, `authLogout`

### Marketplace Services
- `marketplaceServices`, `marketplaceServicesNearby`, `marketplaceServiceById`
- `marketplaceMyServices`, `marketplaceMyBookings`, `marketplaceBookings`
- `marketplaceBookingStatus`, `marketplaceBookingPhotos`, `marketplaceBookingReview`
- `marketplacePayPalApprove`, `marketplacePayPalOrder`

### Job Board
- `jobs`, `jobsSearch`, `jobsById`, `jobsMyApplications`
- `jobsMyJobs`, `jobsApply`, `jobsStats`, `jobsApplications`
- `jobsApplicationStatus`

### Academy & Learning
- `academyCourses`, `academyCourseById`, `academyCategories`
- `academyFeatured`, `academyMyCourses`, `academyMyCreatedCourses`
- `academyCourseThumbnail`, `academyCourseVideos`, `academyCourseVideoDelete`
- `academyEnroll`, `academyProgress`, `academyReviews`, `academyStatistics`

### Supplies & Equipment
- `supplies`, `suppliesCategories`, `suppliesFeatured`, `suppliesNearby`
- `suppliesById`, `suppliesMySupplies`, `suppliesMyOrders`
- `suppliesImages`, `suppliesImageDelete`, `suppliesOrder`
- `suppliesOrderStatus`, `suppliesReviews`

### Equipment Rentals
- `rentals`, `rentalsCategories`, `rentalsFeatured`, `rentalsNearby`
- `rentalsById`, `rentalsMyRentals`, `rentalsMyBookings`
- `rentalsImages`, `rentalsImageDelete`, `rentalsBook`
- `rentalsBookingStatus`, `rentalsReviews`, `rentalsStatistics`

### Facility Care Services
- `facilityCare`, `facilityCareNearby`, `facilityCareById`
- `facilityCareMyServices`, `facilityCareMyBookings`
- `facilityCareImages`, `facilityCareImageDelete`, `facilityCareBook`
- `facilityCareBookingStatus`, `facilityCareReviews`

### Communication & Messaging
- `communicationConversations`, `communicationConversationById`
- `communicationConversationsMessagesById`, `communicationConversationsMessages`
- `communicationConversationsRead`, `communicationMessages`
- `communicationMessageUpdate`, `communicationMessageDelete`
- `communicationRead`, `communicationNotifications`, `communicationNotificationCount`
- `communicationNotificationRead`, `communicationNotificationReadAll`
- `communicationNotificationDelete`, `communicationNotificationsReadAll`
- `communicationNotificationsRead`, `communicationNotificationsById`
- `communicationEmailNotification`, `communicationSmsNotification`
- `communicationUnreadCount`, `communicationSearch`, `communicationConversationWith`
- `communicationEvents`, `communicationTyping`, `communicationTest`

### Advertising & Promotions
- `ads`, `adsCategories`, `adsFeatured`, `adsById`
- `adsClick`, `adsMyAds`, `adsImages`, `adsImageDelete`
- `adsPromote`, `adsAnalytics`, `adsStatistics`

### Trust & Verification
- `trustVerificationVerifiedUsers`, `trustVerificationRequests`
- `trustVerificationRequestById`, `trustVerificationRequestDocuments`
- `trustVerificationDocumentDelete`, `trustVerificationMyRequests`

### Referral System
- `referralsValidate`, `referralsTrack`, `referralsLeaderboard`
- `referralsMe`, `referralsStats`, `referralsLinks`
- `referralsRewards`, `referralsInvite`, `referralsPreferences`

### Financial Management
- `financeOverview`, `financeTransactions`, `financeEarnings`
- `financeExpenses`, `financeReports`, `financeExpenseAdd`
- `financeWithdraw`, `financeTaxDocuments`, `financeWalletSettings`

### Google Maps Integration
- `mapsGeocode`, `mapsReverseGeocode`, `mapsPlacesSearch`
- `mapsPlaceById`, `mapsDistance`, `mapsNearby`
- `mapsValidateServiceArea`, `mapsAnalyzeCoverage`

### PayPal Integration
- `paypalWebhook`

### PayMaya Integration
- `paymayaWebhook`, `paymayaCheckout`, `paymayaCheckoutById`
- `paymayaPayment`, `paymayaPaymentById`, `paymayaInvoice`, `paymayaInvoiceById`

### Provider Management
- `providers`, `providersById`, `providersProfileMe`, `providersProfile`
- `providersOnboardingStep`, `providersDocumentsUpload`
- `providersDashboard`, `providersAnalytics`, `providersDashboardOverview`
- `providersAnalyticsPerformance`

### Agency Management
- `agencies`, `agenciesById`, `agenciesLogo`, `agenciesProviders`
- `agenciesProviderDelete`, `agenciesProviderStatus`, `agenciesAdmins`
- `agenciesAdminDelete`, `agenciesAnalytics`, `agenciesMyAgencies`
- `agenciesJoin`, `agenciesLeave`

### LocalPro Plus Subscriptions
- `localProPlusPlans`, `localProPlusPlanById`, `localProPlusSubscribe`
- `localProPlusConfirmPayment`, `localProPlusCancel`, `localProPlusRenew`
- `localProPlusMySubscription`, `localProPlusSettings`, `localProPlusUsage`

### Settings Management
- `settingsUser`, `settingsUserCategory`, `settingsUserReset`, `settingsUserDelete`
- `settingsApp`, `settingsAppCategory`, `settingsAppFeaturesToggle`
- `settingsAppPublic`, `settingsAppHealth`

### Analytics & Insights
- `analyticsOverview`, `analyticsUser`, `analyticsMarketplace`
- `analyticsJobs`, `analyticsReferrals`, `analyticsAgencies`, `analyticsTrack`

### Global Search
- `search`, `searchSuggestions`, `searchPopular`, `searchAdvanced`
- `searchEntities`, `searchCategories`, `searchLocations`
- `searchTrending`, `searchAnalytics`

### Announcements
- `announcements`, `announcementsById`

### Activities & Discovery
- `activitiesFeed`, `activitiesMy`, `activitiesUser`, `activitiesById`
- `activities`, `activitiesInteractions`, `activitiesStatsMy`
- `activitiesStatsGlobal`, `activitiesMetadata`, `activitiesUserById`

### Users
- `usersById`

## Best Practices

### Function Selection Guidelines

1. **Use `makeAuthenticatedRequestWithEndpoint()`** for simple endpoints without dynamic parameters
2. **Use `makeAuthenticatedRequestWithPath()`** for endpoints with dynamic parameters and query strings
3. **Use `makePublicRequest()`** for public endpoints that don't require authentication
4. **Use `buildApiUrl()`** when you need just the URL for client-side requests
5. **Use `handleApiRequestWithEndpoint()`** for complete request handling in API routes
6. **Use `handleApiRoute()`** for standardized error handling and response formatting
7. **Use `createErrorResponse()`** for consistent error handling across the application

### Error Handling Best Practices

```typescript
// Good: Use handleApiRoute for comprehensive error handling
export async function GET(request: NextRequest) {
  const result = await handleApiRoute(async () => {
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'analyticsOverview',
      { method: 'GET' }
    );
    return await response.json();
  }, "Analytics overview");

  if (result.error) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}
```

### Type Safety Best Practices

```typescript
// Good: Use endpoint constants for type safety
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'marketplaceServices', // TypeScript will autocomplete and validate this
  { method: 'GET' }
);

// Bad: Hardcoded URLs
const response = await fetch('/api/marketplace/services', options);
```

### Performance Best Practices

1. **Always validate session** before making requests
2. **Use appropriate timeout settings** (default is 30 seconds)
3. **Handle errors consistently** across all routes
4. **Use public endpoints** when authentication is not required
5. **Cache responses** when appropriate for better performance

### Security Best Practices

1. **Never expose API tokens** in client-side code
2. **Always validate user permissions** before making requests
3. **Use HTTPS** for all API communications
4. **Sanitize input parameters** before making requests
5. **Log security-relevant events** for monitoring

This approach provides a robust, type-safe, and maintainable way to handle API requests throughout the application.
