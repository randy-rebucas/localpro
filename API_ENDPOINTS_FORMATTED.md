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
- **GET** `/api/agencies` - Get all agencies *(public)*
- **GET** `/api/agencies/:id` - Get single agency *(public)*
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
- **GET** `/api/analytics/custom` - Get custom analytics *(Admin only)*
- **POST** `/api/analytics/track` - Track event

## 📢 Announcements (`/api/announcements`)
- **GET** `/api/announcements` - Get all announcements *(public)*
- **GET** `/api/announcements/:id` - Get single announcement *(public)*
- **GET** `/api/announcements/my/list` - Get personalized announcements
- **POST** `/api/announcements` - Create announcement *(Admin/Agency only)*
- **PUT** `/api/announcements/:id` - Update announcement
- **DELETE** `/api/announcements/:id` - Delete announcement
- **POST** `/api/announcements/:id/acknowledge` - Acknowledge announcement
- **POST** `/api/announcements/:id/comments` - Add comment to announcement
- **GET** `/api/announcements/admin/statistics` - Get announcement statistics *(Admin only)*

## 🔍 Audit Logs (`/api/audit-logs`)
- **GET** `/api/audit-logs` - Get audit logs *(Admin only)*
- **GET** `/api/audit-logs/stats` - Get audit statistics *(Admin only)*
- **GET** `/api/audit-logs/user/:userId/activity` - Get user activity summary
- **GET** `/api/audit-logs/:auditId` - Get audit log details *(Admin only)*
- **GET** `/api/audit-logs/export/data` - Export audit logs *(Admin only)*
- **GET** `/api/audit-logs/dashboard/summary` - Get audit dashboard summary *(Admin only)*
- **POST** `/api/audit-logs/cleanup` - Clean up expired audit logs *(Admin only)*
- **GET** `/api/audit-logs/metadata/categories` - Get audit metadata *(Admin only)*

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
- **GET** `/api/error-monitoring` - Get error monitoring info *(public)*
- **GET** `/api/error-monitoring/stats` - Get error statistics *(Admin only)*
- **GET** `/api/error-monitoring/unresolved` - Get unresolved errors *(Admin only)*
- **GET** `/api/error-monitoring/:errorId` - Get error details *(Admin only)*
- **PATCH** `/api/error-monitoring/:errorId/resolve` - Resolve error *(Admin only)*
- **GET** `/api/error-monitoring/dashboard/summary` - Get error monitoring dashboard *(Admin only)*
## 🏥 Facility Care (`/api/facility-care`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/facility-care`</span> - Get facility care services <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/facility-care/nearby`</span> - Get nearby facility care services <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/facility-care/:id`</span> - Get single facility care service <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/facility-care`</span> - Create facility care service <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/facility-care/:id`</span> - Update facility care service <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/facility-care/:id`</span> - Delete facility care service <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/facility-care/:id/images`</span> - Upload facility care images <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/facility-care/:id/images/:imageId`</span> - Delete facility care image <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/facility-care/:id/book`</span> - Book facility care service
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/facility-care/:id/bookings/:bookingId/status`</span> - Update booking status
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/facility-care/:id/reviews`</span> - Add facility care review
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/facility-care/my-services`</span> - Get my facility care services
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/facility-care/my-bookings`</span> - Get my facility care bookings
## 💰 Finance (`/api/finance`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/finance/overview`</span> - Get financial overview
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/finance/transactions`</span> - Get transactions
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/finance/earnings`</span> - Get earnings
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/finance/expenses`</span> - Get expenses
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/finance/reports`</span> - Get financial reports
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/finance/expenses`</span> - Add expense
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/finance/withdraw`</span> - Request withdrawal
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/finance/withdrawals/:withdrawalId/process`</span> - Process withdrawal <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/finance/tax-documents`</span> - Get tax documents
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/finance/wallet/settings`</span> - Update wallet settings
## 💼 Jobs (`/api/jobs`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/jobs`</span> - Get jobs <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/jobs/search`</span> - Search jobs <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/jobs/:id`</span> - Get single job <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/jobs`</span> - Create job <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/jobs/:id`</span> - Update job <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/jobs/:id`</span> - Delete job <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/jobs/:id/logo`</span> - Upload company logo <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/jobs/:id/stats`</span> - Get job statistics <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/jobs/:id/apply`</span> - Apply for job
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/jobs/my-applications`</span> - Get my job applications
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/jobs/my-jobs`</span> - Get my jobs <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/jobs/:id/applications`</span> - Get job applications <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/jobs/:id/applications/:applicationId/status`</span> - Update application status <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
## 📝 Logs (`/api/logs`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/logs/stats`</span> - Get log statistics <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/logs`</span> - Get logs with filtering <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/logs/:logId`</span> - Get log details <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/logs/analytics/error-trends`</span> - Get error trends <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/logs/analytics/performance`</span> - Get performance metrics <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/logs/user/:userId/activity`</span> - Get user activity logs
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/logs/export/data`</span> - Export logs <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/logs/dashboard/summary`</span> - Get log dashboard summary <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/logs/search/global`</span> - Search logs globally <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/logs/cleanup`</span> - Clean up expired logs <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/logs/flush`</span> - Flush all logs <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/logs/flush`</span> - Flush all logs <span style="color: #6b7280; font-weight: bold;">alternative endpoint</span>
## 🗺️ Maps (`/api/maps`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/maps`</span> - Get maps info <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/maps/geocode`</span> - Geocode address <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/maps/reverse-geocode`</span> - Reverse geocode <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/maps/places/search`</span> - Search places <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/maps/places/:placeId`</span> - Get place details <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/maps/distance`</span> - Calculate distance <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/maps/nearby`</span> - Find nearby places <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/maps/validate-service-area`</span> - Validate service area <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/maps/analyze-coverage`</span> - Analyze service coverage
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/maps/test`</span> - Test connection <span style="color: #ef4444; font-weight: bold;">Admin only</span>
## 🛒 Marketplace (`/api/marketplace`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/marketplace/services`</span> - Get services <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/marketplace/services/nearby`</span> - Get nearby services <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/marketplace/services/:id`</span> - Get single service <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/marketplace/my-services`</span> - Get my services
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/marketplace/my-bookings`</span> - Get my bookings
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/marketplace/services`</span> - Create service <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/marketplace/services/:id`</span> - Update service <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/marketplace/services/:id`</span> - Delete service <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/marketplace/services/:id/images`</span> - Upload service images <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/marketplace/bookings`</span> - Create booking
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/marketplace/bookings`</span> - Get bookings
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/marketplace/bookings/:id/status`</span> - Update booking status
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/marketplace/bookings/:id/photos`</span> - Upload booking photos
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/marketplace/bookings/:id/review`</span> - Add review
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/marketplace/bookings/paypal/approve`</span> - Approve PayPal booking
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/marketplace/bookings/paypal/order/:orderId`</span> - Get PayPal order details
## 💳 PayMaya (`/api/paymaya`)
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/paymaya/webhook`</span> - PayMaya webhook <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/paymaya/checkout`</span> - Create checkout
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/paymaya/checkout/:checkoutId`</span> - Get checkout
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/paymaya/payment`</span> - Create payment
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/paymaya/payment/:paymentId`</span> - Get payment
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/paymaya/invoice`</span> - Create invoice
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/paymaya/invoice/:invoiceId`</span> - Get invoice
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/paymaya/config/validate`</span> - Validate configuration <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/paymaya/webhook/events`</span> - Get webhook events <span style="color: #ef4444; font-weight: bold;">Admin only</span>
## 💰 PayPal (`/api/paypal`)
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/paypal/webhook`</span> - PayPal webhook <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/paypal/webhook/events`</span> - Get webhook events <span style="color: #ef4444; font-weight: bold;">Admin only</span>
## 👥 Providers (`/api/providers`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/providers`</span> - Get providers <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/providers/:id`</span> - Get single provider <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/providers/profile/me`</span> - Get my provider profile
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/providers/profile`</span> - Create provider profile
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/providers/profile`</span> - Update provider profile
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/providers/onboarding/step`</span> - Update onboarding step
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/providers/documents/upload`</span> - Upload documents
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/providers/dashboard/overview`</span> - Get provider dashboard
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/providers/analytics/performance`</span> - Get provider analytics
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/providers/admin/all`</span> - Get all providers for admin
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/providers/admin/:id/status`</span> - Update provider status
## 🔗 Referrals (`/api/referrals`)
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/referrals/validate`</span> - Validate referral code <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/referrals/track`</span> - Track referral click <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/referrals/leaderboard`</span> - Get referral leaderboard <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/referrals/me`</span> - Get my referrals
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/referrals/stats`</span> - Get referral stats
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/referrals/links`</span> - Get referral links
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/referrals/rewards`</span> - Get referral rewards
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/referrals/invite`</span> - Send referral invitation
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/referrals/preferences`</span> - Update referral preferences
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/referrals/process`</span> - Process referral completion <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/referrals/analytics`</span> - Get referral analytics <span style="color: #ef4444; font-weight: bold;">Admin only</span>
## 🏠 Rentals (`/api/rentals`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/rentals`</span> - Get rental items <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/rentals/items`</span> - Get rental items <span style="color: #6b7280; font-weight: bold;">alias</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/rentals/items/:id`</span> - Get single rental item <span style="color: #6b7280; font-weight: bold;">alias</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/rentals/categories`</span> - Get rental categories <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/rentals/featured`</span> - Get featured rental items <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/rentals/nearby`</span> - Get nearby rental items <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/rentals/:id`</span> - Get single rental item <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/rentals`</span> - Create rental <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/rentals/items`</span> - Create rental item <span style="color: #6b7280; font-weight: bold;">alias</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/rentals/:id`</span> - Update rental <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/rentals/:id`</span> - Delete rental <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/rentals/:id/images`</span> - Upload rental images <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/rentals/:id/images/:imageId`</span> - Delete rental image <span style="color: #ef4444; font-weight: bold;">Provider/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/rentals/:id/book`</span> - Book rental
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/rentals/:id/bookings/:bookingId/status`</span> - Update booking status
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/rentals/:id/reviews`</span> - Add rental review
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/rentals/my-rentals`</span> - Get my rental items
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/rentals/my-bookings`</span> - Get my rental bookings
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/rentals/statistics`</span> - Get rental statistics <span style="color: #ef4444; font-weight: bold;">Admin only</span>
## 🔍 Search (`/api/search`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/search`</span> - Global search <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/search/suggestions`</span> - Get search suggestions <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/search/popular`</span> - Get popular searches <span style="color: #22c55e; font-weight: bold;">public</span>
## ⚙️ Settings (`/api/settings`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/settings`</span> - Get public app settings <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/settings/app/public`</span> - Get public app settings <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/settings/app/health`</span> - Get app health <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/settings/user`</span> - Get user settings
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/settings/user`</span> - Update user settings
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/settings/user/:category`</span> - Update user settings category
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/settings/user/reset`</span> - Reset user settings
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/settings/user`</span> - Delete user settings
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/settings/app`</span> - Get app settings <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/settings/app`</span> - Update app settings <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/settings/app/:category`</span> - Update app settings category <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/settings/app/features/toggle`</span> - Toggle feature flag <span style="color: #ef4444; font-weight: bold;">Admin only</span>
## 📦 Supplies (`/api/supplies`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/supplies`</span> - Get supplies <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/supplies/products`</span> - Get supplies <span style="color: #6b7280; font-weight: bold;">alias</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/supplies/products/:id`</span> - Get single supply <span style="color: #6b7280; font-weight: bold;">alias</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/supplies/categories`</span> - Get supply categories <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/supplies/featured`</span> - Get featured supplies <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/supplies/nearby`</span> - Get nearby supplies <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/supplies/:id`</span> - Get single supply <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/supplies`</span> - Create supply <span style="color: #ef4444; font-weight: bold;">Supplier/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/supplies/products`</span> - Create supply <span style="color: #6b7280; font-weight: bold;">alias</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/supplies/:id`</span> - Update supply <span style="color: #ef4444; font-weight: bold;">Supplier/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/supplies/:id`</span> - Delete supply <span style="color: #ef4444; font-weight: bold;">Supplier/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/supplies/:id/images`</span> - Upload supply images <span style="color: #ef4444; font-weight: bold;">Supplier/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/supplies/:id/images/:imageId`</span> - Delete supply image <span style="color: #ef4444; font-weight: bold;">Supplier/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/supplies/:id/order`</span> - Order supply
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/supplies/:id/orders/:orderId/status`</span> - Update order status
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/supplies/:id/reviews`</span> - Add supply review
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/supplies/my-supplies`</span> - Get my supplies
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/supplies/my-orders`</span> - Get my supply orders
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/supplies/statistics`</span> - Get supply statistics <span style="color: #ef4444; font-weight: bold;">Admin only</span>
## 🛡️ Trust Verification (`/api/trust-verification`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/trust-verification/verified-users`</span> - Get verified users <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/trust-verification/requests`</span> - Get verification requests
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/trust-verification/requests/:id`</span> - Get single verification request
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/trust-verification/requests`</span> - Create verification request
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/trust-verification/requests/:id`</span> - Update verification request
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/trust-verification/requests/:id`</span> - Delete verification request
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/trust-verification/requests/:id/documents`</span> - Upload verification documents
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/trust-verification/requests/:id/documents/:documentId`</span> - Delete verification document
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/trust-verification/my-requests`</span> - Get my verification requests
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/trust-verification/requests/:id/review`</span> - Review verification request <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/trust-verification/statistics`</span> - Get verification statistics <span style="color: #ef4444; font-weight: bold;">Admin only</span>
## 👤 User Management (`/api/users`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/users`</span> - Get all users <span style="color: #ef4444; font-weight: bold;">Admin/Agency only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/users/stats`</span> - Get user statistics <span style="color: #ef4444; font-weight: bold;">Admin/Agency only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/users/:id`</span> - Get user by ID
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/users`</span> - Create user <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/users/:id`</span> - Update user
- <span style="color: #f97316; font-weight: bold;">**PATCH**</span> <span style="color: #3b82f6;">`/api/users/:id/status`</span> - Update user status <span style="color: #ef4444; font-weight: bold;">Admin/Agency only</span>
- <span style="color: #f97316; font-weight: bold;">**PATCH**</span> <span style="color: #3b82f6;">`/api/users/:id/verification`</span> - Update user verification <span style="color: #ef4444; font-weight: bold;">Admin/Agency only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/users/:id/badges`</span> - Add user badge <span style="color: #ef4444; font-weight: bold;">Admin/Agency only</span>
- <span style="color: #f97316; font-weight: bold;">**PATCH**</span> <span style="color: #3b82f6;">`/api/users/bulk`</span> - Bulk update users <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/users/:id`</span> - Delete user <span style="color: #ef4444; font-weight: bold;">Admin only</span>
## 📢 Ads (`/api/ads`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/ads`</span> - Get ads <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/ads/categories`</span> - Get ad categories <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/ads/enum-values`</span> - Get ad enum values <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/ads/featured`</span> - Get featured ads <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/ads/:id`</span> - Get single ad <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/ads/:id/click`</span> - Track ad click <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/ads`</span> - Create ad <span style="color: #ef4444; font-weight: bold;">Advertiser/Admin only</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/ads/:id`</span> - Update ad <span style="color: #ef4444; font-weight: bold;">Advertiser/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/ads/:id`</span> - Delete ad <span style="color: #ef4444; font-weight: bold;">Advertiser/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/ads/:id/images`</span> - Upload ad images <span style="color: #ef4444; font-weight: bold;">Advertiser/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/ads/:id/images/:imageId`</span> - Delete ad image <span style="color: #ef4444; font-weight: bold;">Advertiser/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/ads/:id/promote`</span> - Promote ad <span style="color: #ef4444; font-weight: bold;">Advertiser/Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/ads/:id/analytics`</span> - Get ad analytics
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/ads/my-ads`</span> - Get my ads
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/ads/statistics`</span> - Get ad statistics <span style="color: #ef4444; font-weight: bold;">Admin only</span>
## 🎓 Academy (`/api/academy`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/academy/courses`</span> - Get courses <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/academy/courses/:id`</span> - Get single course <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/academy/courses`</span> - Create course <span style="color: #ef4444; font-weight: bold;">Instructor/Admin only</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/academy/courses/:id`</span> - Update course <span style="color: #ef4444; font-weight: bold;">Instructor/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/academy/courses/:id`</span> - Delete course <span style="color: #ef4444; font-weight: bold;">Instructor/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/academy/courses/:id/thumbnail`</span> - Upload course thumbnail <span style="color: #ef4444; font-weight: bold;">Instructor/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/academy/courses/:id/video`</span> - Upload course video <span style="color: #ef4444; font-weight: bold;">Instructor/Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/academy/courses/:id/video/:videoId`</span> - Delete course video <span style="color: #ef4444; font-weight: bold;">Instructor/Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/academy/courses/:id/enroll`</span> - Enroll in course
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/academy/courses/:id/progress`</span> - Update course progress
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/academy/courses/:id/review`</span> - Add course review
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/academy/my-courses`</span> - Get my courses
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/academy/my-created-courses`</span> - Get my created courses <span style="color: #ef4444; font-weight: bold;">Instructor/Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/academy/categories`</span> - Get course categories <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/academy/featured`</span> - Get featured courses <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/academy/statistics`</span> - Get course statistics <span style="color: #ef4444; font-weight: bold;">Admin only</span>
## 📈 Activities (`/api/activities`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/activities`</span> - Get activity feed
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/activities/user`</span> - Get user activities
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/activities/user/:userId`</span> - Get specific user activities
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/activities/:id`</span> - Get single activity
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/activities`</span> - Create activity
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/activities/:id`</span> - Update activity
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/activities/:id`</span> - Delete activity
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/activities/:id/interactions`</span> - Add interaction
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/activities/:id/interactions/:interactionId`</span> - Remove interaction
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/activities/stats`</span> - Get activity stats
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/activities/global/stats`</span> - Get global activity stats
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/activities/metadata`</span> - Get activity metadata
## 💎 LocalPro Plus (`/api/localpro-plus`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/localpro-plus/plans`</span> - Get subscription plans <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/localpro-plus/plans/:id`</span> - Get single plan <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/localpro-plus/plans`</span> - Create plan <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/localpro-plus/plans/:id`</span> - Update plan <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/localpro-plus/plans/:id`</span> - Delete plan <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/localpro-plus/subscribe`</span> - Subscribe to plan
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/localpro-plus/confirm-payment`</span> - Confirm subscription payment
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/localpro-plus/cancel`</span> - Cancel subscription
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/localpro-plus/my-subscription`</span> - Get my subscription
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/localpro-plus/settings`</span> - Update subscription settings
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/localpro-plus/usage`</span> - Get subscription usage
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/localpro-plus/renew`</span> - Renew subscription
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/localpro-plus/analytics`</span> - Get subscription analytics <span style="color: #ef4444; font-weight: bold;">Admin only</span>
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
