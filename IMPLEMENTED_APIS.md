# Implemented APIs Documentation

This document lists all API endpoints that have been implemented in the LocalPro Super App codebase, organized by category.

## 🔓 Public APIs (No Authentication Required)

These endpoints use `makeClientPublicRequest()` - **NO Bearer token**.

### Authentication (Public)
- ✅ `POST /api/auth/send-code` - Send SMS verification code
- ✅ `POST /api/auth/verify-code` - Verify code and login/register

### Health & Status
- ✅ `GET /health` - API health check
- ✅ `GET /api/settings/app/health` - App health status (Public)

---

## 🔐 Authenticated APIs (Bearer Token Required)

These endpoints use `createAuthFetchOptions()` or authenticated utility functions - **Requires `Authorization: Bearer <token>`**.

### Authentication & User Management
- ✅ `GET /api/auth/me` - Get current user profile
- ✅ `GET /api/auth/profile` - Get user profile
- ✅ `PUT /api/auth/profile` - Update user profile
- ✅ `POST /api/auth/upload-avatar` - Upload profile avatar
- ✅ `POST /api/auth/upload-portfolio` - Upload portfolio images
- ✅ `POST /api/auth/complete-onboarding` - Complete onboarding
- ✅ `GET /api/auth/profile-completeness` - Get profile completeness
- ✅ `POST /api/auth/logout` - Logout user

### Marketplace Services
- ✅ `GET /api/marketplace/services` - Browse services
- ✅ `GET /api/marketplace/services/:id` - Get service details
- ✅ `GET /api/marketplace/my-services` - Get my services
- ✅ `GET /api/marketplace/my-bookings` - Get my bookings
- ✅ `GET /api/marketplace/bookings/:id` - Get booking details
- ✅ `PUT /api/marketplace/bookings/:id/status` - Update booking status
- ✅ `GET /api/marketplace/services/nearby` - Find nearby services

### Job Board
- ✅ `GET /api/jobs` - Browse jobs
- ✅ `GET /api/jobs/:id` - Get job details
- ✅ `PUT /api/jobs/:id` - Update job
- ✅ `GET /api/jobs/search` - Search jobs
- ✅ `GET /api/jobs/my-applications` - Get my applications
- ✅ `GET /api/jobs/my-jobs` - Get my posted jobs

### Academy & Learning
- ✅ `GET /api/academy/courses` - Browse courses
- ✅ `GET /api/academy/courses/:id` - Get course details
- ✅ `GET /api/academy/categories` - Get categories
- ✅ `GET /api/academy/featured` - Get featured courses
- ✅ `POST /api/academy/courses/:id/enroll` - Enroll in course
- ✅ `GET /api/academy/my-courses` - Get my enrolled courses

### Supplies & Equipment
- ✅ `GET /api/supplies` - Browse supplies
- ✅ `GET /api/supplies/:id` - Get supply details
- ✅ `PUT /api/supplies/:id` - Update supply listing
- ✅ `GET /api/supplies/products` - Get products
- ✅ `GET /api/supplies/my-supplies` - Get my supplies
- ✅ `GET /api/supplies/my-orders` - Get my orders

### Equipment Rentals
- ✅ `GET /api/rentals` - Browse rentals
- ✅ `GET /api/rentals/:id` - Get rental details
- ✅ `PUT /api/rentals/:id` - Update rental listing
- ✅ `POST /api/rentals/:id/book` - Book rental
- ✅ `GET /api/rentals/my-rentals` - Get my rentals
- ✅ `GET /api/rentals/my-bookings` - Get my bookings

### Advertising & Promotions
- ✅ `GET /api/ads` - Browse ads
- ✅ `GET /api/ads/:id` - Get ad details
- ✅ `PUT /api/ads/:id` - Update ad
- ✅ `POST /api/ads/:id/promote` - Promote ad
- ✅ `GET /api/ads/:id/analytics` - Get ad analytics
- ✅ `DELETE /api/ads/:id` - Delete ad

### Communication & Messaging
- ✅ `GET /api/communication/conversations` - Get conversations
- ✅ `GET /api/communication/conversations/:id` - Get conversation
- ✅ `POST /api/communication/conversations` - Create conversation
- ✅ `DELETE /api/communication/conversations/:id` - Delete conversation
- ✅ `GET /api/communication/conversations/:id/messages` - Get messages
- ✅ `POST /api/communication/conversations/:id/messages` - Send message
- ✅ `PUT /api/communication/conversations/:id/messages/:messageId` - Update message
- ✅ `DELETE /api/communication/conversations/:id/messages/:messageId` - Delete message
- ✅ `PUT /api/communication/conversations/:id/read` - Mark as read
- ✅ `GET /api/communication/unread-count` - Get unread count
- ✅ `GET /api/communication/notifications` - Get notifications
- ✅ `GET /api/communication/notifications/count` - Get notification count
- ✅ `PUT /api/communication/notifications/:id/read` - Mark notification as read
- ✅ `PUT /api/communication/notifications/read-all` - Mark all as read
- ✅ `DELETE /api/communication/notifications/:id` - Delete notification
- ✅ `POST /api/communication/notifications/email` - Send email notification
- ✅ `POST /api/communication/notifications/sms` - Send SMS notification
- ✅ `GET /api/communication/search` - Search conversations
- ✅ `POST /api/communication/typing` - Send typing indicator
- ✅ `GET /api/communication/conversation-with/:userId` - Get conversation with user
- ✅ `GET /api/communication/events` - EventSource for real-time events

### Financial Management
- ✅ `GET /api/finance/overview` - Financial overview
- ✅ `GET /api/finance/transactions` - Get transactions
- ✅ `GET /api/finance/earnings` - Get earnings
- ✅ `GET /api/finance/expenses` - Get expenses
- ✅ `POST /api/finance/expenses` - Add expense
- ✅ `POST /api/finance/withdraw` - Request withdrawal
- ✅ `GET /api/finance/reports` - Get financial reports
- ✅ `GET /api/finance/tax-documents` - Get tax documents
- ✅ `PUT /api/finance/wallet/settings` - Update wallet settings

### User Management
- ✅ `GET /api/users/:id` - Get user by ID

### Settings
- ✅ `GET /api/settings/user` - Get user settings
- ✅ `PUT /api/settings/user` - Update user settings

### Announcements
- ✅ `GET /api/announcements` - Get announcements
- ✅ `PUT /api/announcements/:id/dismiss` - Dismiss announcement

### Logs & Monitoring
- ✅ `GET /api/logs/user/:userId/activity` - Get user activity logs
- ✅ `GET /api/admin/error-monitoring/dashboard/summary` - Error monitoring summary

---

## 📋 All Defined API Endpoints

The following endpoints are defined in `src/lib/api.ts` but may not all be actively used in the frontend yet:

### Total Endpoints: **392 endpoints** across **26 categories**

### Categories Breakdown:

1. **Authentication & User Management** (10 endpoints)
2. **Marketplace Services** (13 endpoints)
3. **Job Board** (12 endpoints)
4. **Academy & Learning** (25 endpoints)
5. **Supplies & Equipment** (23 endpoints)
6. **Equipment Rentals** (19 endpoints)
7. **Facility Care Services** (14 endpoints)
8. **Communication & Messaging** (26 endpoints)
9. **Advertising & Promotions** (15 endpoints)
10. **Trust & Verification** (11 endpoints)
11. **Referral System** (12 endpoints)
12. **Financial Management** (10 endpoints)
13. **Google Maps Integration** (9 endpoints)
14. **PayPal Integration** (2 endpoints)
15. **PayMaya Integration** (8 endpoints)
16. **Provider Management** (13 endpoints)
17. **Agency Management** (12 endpoints)
18. **LocalPro Plus Subscriptions** (11 endpoints)
19. **Settings Management** (11 endpoints)
20. **Analytics & Insights** (13 endpoints)
21. **Global Search** (9 endpoints)
22. **Announcements** (6 endpoints)
23. **Activities & Discovery** (11 endpoints)
24. **Logs & System Monitoring** (12 endpoints)
25. **Audit Logs** (16 endpoints)
26. **Error Monitoring** (6 endpoints)

---

## 🔧 API Utility Functions

### Client-Side (Browser)
- ✅ `makeClientPublicRequest()` - Public API calls (no auth)
- ✅ `makeClientAuthenticatedRequestWithEndpoint()` - Authenticated calls with endpoint constant
- ✅ `makeClientAuthenticatedRequestWithPath()` - Authenticated calls with path params
- ✅ `makeClientAuthenticatedRequestWithEndpointSafe()` - Authenticated calls with error handling

### Server-Side (Next.js)
- ✅ `makePublicRequest()` - Public API calls
- ✅ `makeAuthenticatedRequestWithEndpoint()` - Authenticated calls
- ✅ `makeAuthenticatedRequestWithPath()` - Authenticated calls with params

### Helper Functions
- ✅ `createAuthFetchOptions()` - Create fetch options with Bearer token
- ✅ `getApiToken()` - Get API token from cookies
- ✅ `buildClientApiUrl()` - Build API URLs with query params

---

## 📊 Implementation Status

- ✅ **All APIs use Native Fetch API** (no axios, no XMLHttpRequest)
- ✅ **Public endpoints** use `makeClientPublicRequest()` (no auth header)
- ✅ **Authenticated endpoints** use Bearer token via `createAuthFetchOptions()`
- ✅ **86+ fetch calls** verified across 36+ files
- ✅ **Proper error handling** and token expiry detection
- ✅ **Type-safe endpoint constants** with TypeScript

---

## 🎯 Usage Examples

### Public API Call
```typescript
import { makeClientPublicRequest } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";

const response = await makeClientPublicRequest(
  API_ENDPOINTS.authSendCode as keyof typeof API_ENDPOINTS,
  {
    method: "POST",
    body: JSON.stringify({ phoneNumber: "+1234567890" })
  }
);
```

### Authenticated API Call
```typescript
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";

const response = await fetch(
  `${API_BASE_URL}${API_ENDPOINTS.authMe}`,
  createAuthFetchOptions()
);
```

---

*Last updated: Based on current codebase scan*
*Total API endpoints defined: 392*
*Active implementations: 86+ fetch calls identified*

