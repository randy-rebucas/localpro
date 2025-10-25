# LocalPro Super App - Complete API Endpoints

## 🔐 Authentication (`/api/auth`)
- **POST** `/api/auth/send-code` - Send verification code
- **POST** `/api/auth/verify-code` - Verify code
- **POST** `/api/auth/complete-onboarding` - Complete user onboarding
- **GET** `/api/auth/profile-completeness` - Get profile completeness
- **GET** `/api/auth/me` - Get current user profile
- **PUT** `/api/auth/profile` - Update user profile
- **POST** `/api/auth/upload-avatar` - Upload user avatar
- **POST** `/api/auth/upload-portfolio` - Upload portfolio images
- **POST** `/api/auth/logout` - User logout

## 🏢 Agencies (`/api/agencies`)
- **GET** `/api/agencies` - Get all agencies (public)
- **GET** `/api/agencies/:id` - Get single agency (public)
- **POST** `/api/agencies` - Create agency
- **PUT** `/api/agencies/:id` - Update agency
- **DELETE** `/api/agencies/:id` - Delete agency
- **POST** `/api/agencies/:id/logo` - Upload agency logo
- **POST** `/api/agencies/:id/providers` - Add provider to agency
- **DELETE** `/api/agencies/:id/providers/:providerId` - Remove provider from agency
- **PUT** `/api/agencies/:id/providers/:providerId/status` - Update provider status
- **POST** `/api/agencies/:id/admins` - Add admin to agency
- **DELETE** `/api/agencies/:id/admins/:adminId` - Remove admin from agency
- **GET** `/api/agencies/:id/analytics` - Get agency analytics
- **GET** `/api/agencies/my/agencies` - Get my agencies
- **POST** `/api/agencies/join` - Join agency
- **POST** `/api/agencies/leave` - Leave agency

## 📊 Analytics (`/api/analytics`)
- **GET** `/api/analytics/overview` - Get analytics overview
- **GET** `/api/analytics/user` - Get user analytics
- **GET** `/api/analytics/marketplace` - Get marketplace analytics
- **GET** `/api/analytics/jobs` - Get job analytics
- **GET** `/api/analytics/referrals` - Get referral analytics
- **GET** `/api/analytics/agencies` - Get agency analytics
- **GET** `/api/analytics/custom` - Get custom analytics (Admin only)
- **POST** `/api/analytics/track` - Track event

## 📢 Announcements (`/api/announcements`)
- **GET** `/api/announcements` - Get all announcements (public)
- **GET** `/api/announcements/:id` - Get single announcement (public)
- **GET** `/api/announcements/my/list` - Get personalized announcements
- **POST** `/api/announcements` - Create announcement (Admin/Agency only)
- **PUT** `/api/announcements/:id` - Update announcement
- **DELETE** `/api/announcements/:id` - Delete announcement
- **POST** `/api/announcements/:id/acknowledge` - Acknowledge announcement
- **POST** `/api/announcements/:id/comments` - Add comment to announcement
- **GET** `/api/announcements/admin/statistics` - Get announcement statistics (Admin only)

## 🔍 Audit Logs (`/api/audit-logs`)
- **GET** `/api/audit-logs` - Get audit logs (Admin only)
- **GET** `/api/audit-logs/stats` - Get audit statistics (Admin only)
- **GET** `/api/audit-logs/user/:userId/activity` - Get user activity summary
- **GET** `/api/audit-logs/:auditId` - Get audit log details (Admin only)
- **GET** `/api/audit-logs/export/data` - Export audit logs (Admin only)
- **GET** `/api/audit-logs/dashboard/summary` - Get audit dashboard summary (Admin only)
- **POST** `/api/audit-logs/cleanup` - Clean up expired audit logs (Admin only)
- **GET** `/api/audit-logs/metadata/categories` - Get audit metadata (Admin only)

## 💬 Communication (`/api/communication`)
- **GET** `/api/communication/conversations` - Get conversations
- **GET** `/api/communication/conversations/:id` - Get single conversation
- **POST** `/api/communication/conversations` - Create conversation
- **DELETE** `/api/communication/conversations/:id` - Delete conversation
- **POST** `/api/communication/conversations/:id/messages` - Send message
- **PUT** `/api/communication/conversations/:id/messages/:messageId` - Update message
- **DELETE** `/api/communication/conversations/:id/messages/:messageId` - Delete message
- **PUT** `/api/communication/conversations/:id/read` - Mark conversation as read
- **GET** `/api/communication/notifications` - Get user notifications
- **GET** `/api/communication/notifications/count` - Get notification count
- **PUT** `/api/communication/notifications/:notificationId/read` - Mark notification as read
- **PUT** `/api/communication/notifications/read-all` - Mark all notifications as read
- **DELETE** `/api/communication/notifications/:notificationId` - Delete notification
- **POST** `/api/communication/notifications/email` - Send email notification
- **POST** `/api/communication/notifications/sms` - Send SMS notification
- **GET** `/api/communication/unread-count` - Get unread count
- **GET** `/api/communication/search` - Search conversations
- **GET** `/api/communication/conversation-with/:userId` - Get conversation with specific user

## 🚨 Error Monitoring (`/api/error-monitoring`)
- **GET** `/api/error-monitoring` - Get error monitoring info (public)
- **GET** `/api/error-monitoring/stats` - Get error statistics (Admin only)
- **GET** `/api/error-monitoring/unresolved` - Get unresolved errors (Admin only)
- **GET** `/api/error-monitoring/:errorId` - Get error details (Admin only)
- **PATCH** `/api/error-monitoring/:errorId/resolve` - Resolve error (Admin only)
- **GET** `/api/error-monitoring/dashboard/summary` - Get error monitoring dashboard (Admin only)

## 🏥 Facility Care (`/api/facility-care`)
- **GET** `/api/facility-care` - Get facility care services (public)
- **GET** `/api/facility-care/nearby` - Get nearby facility care services (public)
- **GET** `/api/facility-care/:id` - Get single facility care service (public)
- **POST** `/api/facility-care` - Create facility care service (Provider/Admin only)
- **PUT** `/api/facility-care/:id` - Update facility care service (Provider/Admin only)
- **DELETE** `/api/facility-care/:id` - Delete facility care service (Provider/Admin only)
- **POST** `/api/facility-care/:id/images` - Upload facility care images (Provider/Admin only)
- **DELETE** `/api/facility-care/:id/images/:imageId` - Delete facility care image (Provider/Admin only)
- **POST** `/api/facility-care/:id/book` - Book facility care service
- **PUT** `/api/facility-care/:id/bookings/:bookingId/status` - Update booking status
- **POST** `/api/facility-care/:id/reviews` - Add facility care review
- **GET** `/api/facility-care/my-services` - Get my facility care services
- **GET** `/api/facility-care/my-bookings` - Get my facility care bookings

## 💰 Finance (`/api/finance`)
- **GET** `/api/finance/overview` - Get financial overview
- **GET** `/api/finance/transactions` - Get transactions
- **GET** `/api/finance/earnings` - Get earnings
- **GET** `/api/finance/expenses` - Get expenses
- **GET** `/api/finance/reports` - Get financial reports
- **POST** `/api/finance/expenses` - Add expense
- **POST** `/api/finance/withdraw` - Request withdrawal
- **PUT** `/api/finance/withdrawals/:withdrawalId/process` - Process withdrawal (Admin only)
- **GET** `/api/finance/tax-documents` - Get tax documents
- **PUT** `/api/finance/wallet/settings` - Update wallet settings

## 💼 Jobs (`/api/jobs`)
- **GET** `/api/jobs` - Get jobs (public)
- **GET** `/api/jobs/search` - Search jobs (public)
- **GET** `/api/jobs/:id` - Get single job (public)
- **POST** `/api/jobs` - Create job (Provider/Admin only)
- **PUT** `/api/jobs/:id` - Update job (Provider/Admin only)
- **DELETE** `/api/jobs/:id` - Delete job (Provider/Admin only)
- **POST** `/api/jobs/:id/logo` - Upload company logo (Provider/Admin only)
- **GET** `/api/jobs/:id/stats` - Get job statistics (Provider/Admin only)
- **POST** `/api/jobs/:id/apply` - Apply for job
- **GET** `/api/jobs/my-applications` - Get my job applications
- **GET** `/api/jobs/my-jobs` - Get my jobs (Provider/Admin only)
- **GET** `/api/jobs/:id/applications` - Get job applications (Provider/Admin only)
- **PUT** `/api/jobs/:id/applications/:applicationId/status` - Update application status (Provider/Admin only)

## 📝 Logs (`/api/logs`)
- **GET** `/api/logs/stats` - Get log statistics (Admin only)
- **GET** `/api/logs` - Get logs with filtering (Admin only)
- **GET** `/api/logs/:logId` - Get log details (Admin only)
- **GET** `/api/logs/analytics/error-trends` - Get error trends (Admin only)
- **GET** `/api/logs/analytics/performance` - Get performance metrics (Admin only)
- **GET** `/api/logs/user/:userId/activity` - Get user activity logs
- **GET** `/api/logs/export/data` - Export logs (Admin only)
- **GET** `/api/logs/dashboard/summary` - Get log dashboard summary (Admin only)
- **GET** `/api/logs/search/global` - Search logs globally (Admin only)
- **POST** `/api/logs/cleanup` - Clean up expired logs (Admin only)
- **POST** `/api/logs/flush` - Flush all logs (Admin only)
- **DELETE** `/api/logs/flush` - Flush all logs (alternative endpoint) (Admin only)

## 🗺️ Maps (`/api/maps`)
- **GET** `/api/maps` - Get maps info (public)
- **POST** `/api/maps/geocode` - Geocode address (public)
- **POST** `/api/maps/reverse-geocode` - Reverse geocode (public)
- **POST** `/api/maps/places/search` - Search places (public)
- **GET** `/api/maps/places/:placeId` - Get place details (public)
- **POST** `/api/maps/distance` - Calculate distance (public)
- **POST** `/api/maps/nearby` - Find nearby places (public)
- **POST** `/api/maps/validate-service-area` - Validate service area (public)
- **POST** `/api/maps/analyze-coverage` - Analyze service coverage
- **GET** `/api/maps/test` - Test connection (Admin only)

## 🛒 Marketplace (`/api/marketplace`)
- **GET** `/api/marketplace/services` - Get services (public)
- **GET** `/api/marketplace/services/nearby` - Get nearby services (public)
- **GET** `/api/marketplace/services/:id` - Get single service (public)
- **GET** `/api/marketplace/my-services` - Get my services
- **GET** `/api/marketplace/my-bookings` - Get my bookings
- **POST** `/api/marketplace/services` - Create service (Provider/Admin only)
- **PUT** `/api/marketplace/services/:id` - Update service (Provider/Admin only)
- **DELETE** `/api/marketplace/services/:id` - Delete service (Provider/Admin only)
- **POST** `/api/marketplace/services/:id/images` - Upload service images (Provider/Admin only)
- **POST** `/api/marketplace/bookings` - Create booking
- **GET** `/api/marketplace/bookings` - Get bookings
- **PUT** `/api/marketplace/bookings/:id/status` - Update booking status
- **POST** `/api/marketplace/bookings/:id/photos` - Upload booking photos
- **POST** `/api/marketplace/bookings/:id/review` - Add review
- **POST** `/api/marketplace/bookings/paypal/approve` - Approve PayPal booking
- **GET** `/api/marketplace/bookings/paypal/order/:orderId` - Get PayPal order details

## 💳 PayMaya (`/api/paymaya`)
- **POST** `/api/paymaya/webhook` - PayMaya webhook (public)
- **POST** `/api/paymaya/checkout` - Create checkout
- **GET** `/api/paymaya/checkout/:checkoutId` - Get checkout
- **POST** `/api/paymaya/payment` - Create payment
- **GET** `/api/paymaya/payment/:paymentId` - Get payment
- **POST** `/api/paymaya/invoice` - Create invoice
- **GET** `/api/paymaya/invoice/:invoiceId` - Get invoice
- **GET** `/api/paymaya/config/validate` - Validate configuration (Admin only)
- **GET** `/api/paymaya/webhook/events` - Get webhook events (Admin only)

## 💰 PayPal (`/api/paypal`)
- **POST** `/api/paypal/webhook` - PayPal webhook (public)
- **GET** `/api/paypal/webhook/events` - Get webhook events (Admin only)

## 👥 Providers (`/api/providers`)
- **GET** `/api/providers` - Get providers (public)
- **GET** `/api/providers/:id` - Get single provider (public)
- **GET** `/api/providers/profile/me` - Get my provider profile
- **POST** `/api/providers/profile` - Create provider profile
- **PUT** `/api/providers/profile` - Update provider profile
- **PUT** `/api/providers/onboarding/step` - Update onboarding step
- **POST** `/api/providers/documents/upload` - Upload documents
- **GET** `/api/providers/dashboard/overview` - Get provider dashboard
- **GET** `/api/providers/analytics/performance` - Get provider analytics
- **GET** `/api/providers/admin/all` - Get all providers for admin
- **PUT** `/api/providers/admin/:id/status` - Update provider status

## 🔗 Referrals (`/api/referrals`)
- **POST** `/api/referrals/validate` - Validate referral code (public)
- **POST** `/api/referrals/track` - Track referral click (public)
- **GET** `/api/referrals/leaderboard` - Get referral leaderboard (public)
- **GET** `/api/referrals/me` - Get my referrals
- **GET** `/api/referrals/stats` - Get referral stats
- **GET** `/api/referrals/links` - Get referral links
- **GET** `/api/referrals/rewards` - Get referral rewards
- **POST** `/api/referrals/invite` - Send referral invitation
- **PUT** `/api/referrals/preferences` - Update referral preferences
- **POST** `/api/referrals/process` - Process referral completion (Admin only)
- **GET** `/api/referrals/analytics` - Get referral analytics (Admin only)

## 🏠 Rentals (`/api/rentals`)
- **GET** `/api/rentals` - Get rental items (public)
- **GET** `/api/rentals/items` - Get rental items (alias) (public)
- **GET** `/api/rentals/items/:id` - Get single rental item (alias) (public)
- **GET** `/api/rentals/categories` - Get rental categories (public)
- **GET** `/api/rentals/featured` - Get featured rental items (public)
- **GET** `/api/rentals/nearby` - Get nearby rental items (public)
- **GET** `/api/rentals/:id` - Get single rental item (public)
- **POST** `/api/rentals` - Create rental (Provider/Admin only)
- **POST** `/api/rentals/items` - Create rental item (alias) (Provider/Admin only)
- **PUT** `/api/rentals/:id` - Update rental (Provider/Admin only)
- **DELETE** `/api/rentals/:id` - Delete rental (Provider/Admin only)
- **POST** `/api/rentals/:id/images` - Upload rental images (Provider/Admin only)
- **DELETE** `/api/rentals/:id/images/:imageId` - Delete rental image (Provider/Admin only)
- **POST** `/api/rentals/:id/book` - Book rental
- **PUT** `/api/rentals/:id/bookings/:bookingId/status` - Update booking status
- **POST** `/api/rentals/:id/reviews` - Add rental review
- **GET** `/api/rentals/my-rentals` - Get my rental items
- **GET** `/api/rentals/my-bookings` - Get my rental bookings
- **GET** `/api/rentals/statistics` - Get rental statistics (Admin only)

## 🔍 Search (`/api/search`)
- **GET** `/api/search` - Global search (public)
- **GET** `/api/search/suggestions` - Get search suggestions (public)
- **GET** `/api/search/popular` - Get popular searches (public)

## ⚙️ Settings (`/api/settings`)
- **GET** `/api/settings` - Get public app settings (public)
- **GET** `/api/settings/app/public` - Get public app settings (public)
- **GET** `/api/settings/app/health` - Get app health (public)
- **GET** `/api/settings/user` - Get user settings
- **PUT** `/api/settings/user` - Update user settings
- **PUT** `/api/settings/user/:category` - Update user settings category
- **POST** `/api/settings/user/reset` - Reset user settings
- **DELETE** `/api/settings/user` - Delete user settings
- **GET** `/api/settings/app` - Get app settings (Admin only)
- **PUT** `/api/settings/app` - Update app settings (Admin only)
- **PUT** `/api/settings/app/:category` - Update app settings category (Admin only)
- **POST** `/api/settings/app/features/toggle` - Toggle feature flag (Admin only)

## 📦 Supplies (`/api/supplies`)
- **GET** `/api/supplies` - Get supplies (public)
- **GET** `/api/supplies/products` - Get supplies (alias) (public)
- **GET** `/api/supplies/products/:id` - Get single supply (alias) (public)
- **GET** `/api/supplies/categories` - Get supply categories (public)
- **GET** `/api/supplies/featured` - Get featured supplies (public)
- **GET** `/api/supplies/nearby` - Get nearby supplies (public)
- **GET** `/api/supplies/:id` - Get single supply (public)
- **POST** `/api/supplies` - Create supply (Supplier/Admin only)
- **POST** `/api/supplies/products` - Create supply (alias) (Supplier/Admin only)
- **PUT** `/api/supplies/:id` - Update supply (Supplier/Admin only)
- **DELETE** `/api/supplies/:id` - Delete supply (Supplier/Admin only)
- **POST** `/api/supplies/:id/images` - Upload supply images (Supplier/Admin only)
- **DELETE** `/api/supplies/:id/images/:imageId` - Delete supply image (Supplier/Admin only)
- **POST** `/api/supplies/:id/order` - Order supply
- **PUT** `/api/supplies/:id/orders/:orderId/status` - Update order status
- **POST** `/api/supplies/:id/reviews` - Add supply review
- **GET** `/api/supplies/my-supplies` - Get my supplies
- **GET** `/api/supplies/my-orders` - Get my supply orders
- **GET** `/api/supplies/statistics` - Get supply statistics (Admin only)

## 🛡️ Trust Verification (`/api/trust-verification`)
- **GET** `/api/trust-verification/verified-users` - Get verified users (public)
- **GET** `/api/trust-verification/requests` - Get verification requests
- **GET** `/api/trust-verification/requests/:id` - Get single verification request
- **POST** `/api/trust-verification/requests` - Create verification request
- **PUT** `/api/trust-verification/requests/:id` - Update verification request
- **DELETE** `/api/trust-verification/requests/:id` - Delete verification request
- **POST** `/api/trust-verification/requests/:id/documents` - Upload verification documents
- **DELETE** `/api/trust-verification/requests/:id/documents/:documentId` - Delete verification document
- **GET** `/api/trust-verification/my-requests` - Get my verification requests
- **PUT** `/api/trust-verification/requests/:id/review` - Review verification request (Admin only)
- **GET** `/api/trust-verification/statistics` - Get verification statistics (Admin only)

## 👤 User Management (`/api/users`)
- **GET** `/api/users` - Get all users (Admin/Agency only)
- **GET** `/api/users/stats` - Get user statistics (Admin/Agency only)
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create user (Admin only)
- **PUT** `/api/users/:id` - Update user
- **PATCH** `/api/users/:id/status` - Update user status (Admin/Agency only)
- **PATCH** `/api/users/:id/verification` - Update user verification (Admin/Agency only)
- **POST** `/api/users/:id/badges` - Add user badge (Admin/Agency only)
- **PATCH** `/api/users/bulk` - Bulk update users (Admin only)
- **DELETE** `/api/users/:id` - Delete user (Admin only)

## 📢 Ads (`/api/ads`)
- **GET** `/api/ads` - Get ads (public)
- **GET** `/api/ads/categories` - Get ad categories (public)
- **GET** `/api/ads/enum-values` - Get ad enum values (public)
- **GET** `/api/ads/featured` - Get featured ads (public)
- **GET** `/api/ads/:id` - Get single ad (public)
- **POST** `/api/ads/:id/click` - Track ad click (public)
- **POST** `/api/ads` - Create ad (Advertiser/Admin only)
- **PUT** `/api/ads/:id` - Update ad (Advertiser/Admin only)
- **DELETE** `/api/ads/:id` - Delete ad (Advertiser/Admin only)
- **POST** `/api/ads/:id/images` - Upload ad images (Advertiser/Admin only)
- **DELETE** `/api/ads/:id/images/:imageId` - Delete ad image (Advertiser/Admin only)
- **POST** `/api/ads/:id/promote` - Promote ad (Advertiser/Admin only)
- **GET** `/api/ads/:id/analytics` - Get ad analytics
- **GET** `/api/ads/my-ads` - Get my ads
- **GET** `/api/ads/statistics` - Get ad statistics (Admin only)

## 🎓 Academy (`/api/academy`)
- **GET** `/api/academy/courses` - Get courses (public)
- **GET** `/api/academy/courses/:id` - Get single course (public)
- **POST** `/api/academy/courses` - Create course (Instructor/Admin only)
- **PUT** `/api/academy/courses/:id` - Update course (Instructor/Admin only)
- **DELETE** `/api/academy/courses/:id` - Delete course (Instructor/Admin only)
- **POST** `/api/academy/courses/:id/thumbnail` - Upload course thumbnail (Instructor/Admin only)
- **POST** `/api/academy/courses/:id/video` - Upload course video (Instructor/Admin only)
- **DELETE** `/api/academy/courses/:id/video/:videoId` - Delete course video (Instructor/Admin only)
- **POST** `/api/academy/courses/:id/enroll` - Enroll in course
- **PUT** `/api/academy/courses/:id/progress` - Update course progress
- **POST** `/api/academy/courses/:id/review` - Add course review
- **GET** `/api/academy/my-courses` - Get my courses
- **GET** `/api/academy/my-created-courses` - Get my created courses (Instructor/Admin only)
- **GET** `/api/academy/categories` - Get course categories (public)
- **GET** `/api/academy/featured` - Get featured courses (public)
- **GET** `/api/academy/statistics` - Get course statistics (Admin only)

## 📈 Activities (`/api/activities`)
- **GET** `/api/activities` - Get activity feed
- **GET** `/api/activities/user` - Get user activities
- **GET** `/api/activities/user/:userId` - Get specific user activities
- **GET** `/api/activities/:id` - Get single activity
- **POST** `/api/activities` - Create activity
- **PUT** `/api/activities/:id` - Update activity
- **DELETE** `/api/activities/:id` - Delete activity
- **POST** `/api/activities/:id/interactions` - Add interaction
- **DELETE** `/api/activities/:id/interactions/:interactionId` - Remove interaction
- **GET** `/api/activities/stats` - Get activity stats
- **GET** `/api/activities/global/stats` - Get global activity stats
- **GET** `/api/activities/metadata` - Get activity metadata

## 💎 LocalPro Plus (`/api/localpro-plus`)
- **GET** `/api/localpro-plus/plans` - Get subscription plans (public)
- **GET** `/api/localpro-plus/plans/:id` - Get single plan (public)
- **POST** `/api/localpro-plus/plans` - Create plan (Admin only)
- **PUT** `/api/localpro-plus/plans/:id` - Update plan (Admin only)
- **DELETE** `/api/localpro-plus/plans/:id` - Delete plan (Admin only)
- **POST** `/api/localpro-plus/subscribe` - Subscribe to plan
- **POST** `/api/localpro-plus/confirm-payment` - Confirm subscription payment
- **POST** `/api/localpro-plus/cancel` - Cancel subscription
- **GET** `/api/localpro-plus/my-subscription` - Get my subscription
- **PUT** `/api/localpro-plus/settings` - Update subscription settings
- **GET** `/api/localpro-plus/usage` - Get subscription usage
- **POST** `/api/localpro-plus/renew` - Renew subscription
- **GET** `/api/localpro-plus/analytics` - Get subscription analytics (Admin only)

---

## 🎨 Color Legend

### Role-Based Color Coding:
- 🟢 **Public** - Available to all users
- 🔵 **Authenticated** - Requires user authentication
- 🟡 **Provider** - Provider role required
- 🟠 **Agency** - Agency role required
- 🔴 **Admin** - Admin role required
- 🟣 **Specialized** - Specific role combinations (Advertiser, Instructor, Supplier, etc.)

### HTTP Method Colors:
- **GET** - 🔍 Blue (Read operations)
- **POST** - 🟢 Green (Create operations)
- **PUT** - 🟡 Yellow (Update operations)
- **PATCH** - 🟠 Orange (Partial updates)
- **DELETE** - 🔴 Red (Delete operations)
