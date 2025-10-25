# LocalPro Super App - Complete API Endpoints

## 🔐 Authentication (`/api/auth`)
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/auth/send-code`</span> - Send verification code
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/auth/verify-code`</span> - Verify code
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/auth/complete-onboarding`</span> - Complete user onboarding
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/auth/profile-completeness`</span> - Get profile completeness
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/auth/me`</span> - Get current user profile
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/auth/profile`</span> - Update user profile
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/auth/upload-avatar`</span> - Upload user avatar
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/auth/upload-portfolio`</span> - Upload portfolio images
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/auth/logout`</span> - User logout

## 🏢 Agencies (`/api/agencies`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #22c55e;">`/api/agencies`</span> - Get all agencies <span style="color: #22c55e; font-weight: bold;">(public)</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #22c55e;">`/api/agencies/:id`</span> - Get single agency <span style="color: #22c55e; font-weight: bold;">(public)</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/agencies`</span> - Create agency
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/agencies/:id`</span> - Update agency
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/agencies/:id`</span> - Delete agency
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/agencies/:id/logo`</span> - Upload agency logo
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/agencies/:id/providers`</span> - Add provider to agency
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/agencies/:id/providers/:providerId`</span> - Remove provider from agency
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/agencies/:id/providers/:providerId/status`</span> - Update provider status
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/agencies/:id/admins`</span> - Add admin to agency
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/agencies/:id/admins/:adminId`</span> - Remove admin from agency
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/agencies/:id/analytics`</span> - Get agency analytics
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/agencies/my/agencies`</span> - Get my agencies
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/agencies/join`</span> - Join agency
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/agencies/leave`</span> - Leave agency

## 📊 Analytics (`/api/analytics`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/analytics/overview`</span> - Get analytics overview
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/analytics/user`</span> - Get user analytics
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/analytics/marketplace`</span> - Get marketplace analytics
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/analytics/jobs`</span> - Get job analytics
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/analytics/referrals`</span> - Get referral analytics
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/analytics/agencies`</span> - Get agency analytics
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/analytics/custom`</span> - Get custom analytics <span style="color: #ef4444; font-weight: bold;">(Admin only)</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/analytics/track`</span> - Track event

## 📢 Announcements (`/api/announcements`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #22c55e;">`/api/announcements`</span> - Get all announcements <span style="color: #22c55e; font-weight: bold;">(public)</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #22c55e;">`/api/announcements/:id`</span> - Get single announcement <span style="color: #22c55e; font-weight: bold;">(public)</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/announcements/my/list`</span> - Get personalized announcements
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/announcements`</span> - Create announcement <span style="color: #ef4444; font-weight: bold;">(Admin/Agency only)</span>
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/announcements/:id`</span> - Update announcement
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/announcements/:id`</span> - Delete announcement
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/announcements/:id/acknowledge`</span> - Acknowledge announcement
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/announcements/:id/comments`</span> - Add comment to announcement
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/announcements/admin/statistics`</span> - Get announcement statistics <span style="color: #ef4444; font-weight: bold;">(Admin only)</span>

## 🔍 Audit Logs (`/api/audit-logs`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/audit-logs`</span> - Get audit logs <span style="color: #ef4444; font-weight: bold;">(Admin only)</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/audit-logs/stats`</span> - Get audit statistics <span style="color: #ef4444; font-weight: bold;">(Admin only)</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/audit-logs/user/:userId/activity`</span> - Get user activity summary
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/audit-logs/:auditId`</span> - Get audit log details <span style="color: #ef4444; font-weight: bold;">(Admin only)</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/audit-logs/export/data`</span> - Export audit logs <span style="color: #ef4444; font-weight: bold;">(Admin only)</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/audit-logs/dashboard/summary`</span> - Get audit dashboard summary <span style="color: #ef4444; font-weight: bold;">(Admin only)</span>
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/audit-logs/cleanup`</span> - Clean up expired audit logs <span style="color: #ef4444; font-weight: bold;">(Admin only)</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/audit-logs/metadata/categories`</span> - Get audit metadata <span style="color: #ef4444; font-weight: bold;">(Admin only)</span>

## 💬 Communication (`/api/communication`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/communication/conversations`</span> - Get conversations
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/communication/conversations/:id`</span> - Get single conversation
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/communication/conversations`</span> - Create conversation
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/communication/conversations/:id`</span> - Delete conversation
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/communication/conversations/:id/messages`</span> - Send message
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/communication/conversations/:id/messages/:messageId`</span> - Update message
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/communication/conversations/:id/messages/:messageId`</span> - Delete message
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/communication/conversations/:id/read`</span> - Mark conversation as read
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/communication/notifications`</span> - Get user notifications
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/communication/notifications/count`</span> - Get notification count
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/communication/notifications/:notificationId/read`</span> - Mark notification as read
- <span style="color: #eab308; font-weight: bold;">**PUT**</span> <span style="color: #3b82f6;">`/api/communication/notifications/read-all`</span> - Mark all notifications as read
- <span style="color: #ef4444; font-weight: bold;">**DELETE**</span> <span style="color: #3b82f6;">`/api/communication/notifications/:notificationId`</span> - Delete notification
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/communication/notifications/email`</span> - Send email notification
- <span style="color: #22c55e; font-weight: bold;">**POST**</span> <span style="color: #3b82f6;">`/api/communication/notifications/sms`</span> - Send SMS notification
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/communication/unread-count`</span> - Get unread count
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/communication/search`</span> - Search conversations
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/communication/conversation-with/:userId`</span> - Get conversation with specific user

## 🚨 Error Monitoring (`/api/error-monitoring`)
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/error-monitoring`</span> - Get error monitoring info <span style="color: #22c55e; font-weight: bold;">public</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/error-monitoring/stats`</span> - Get error statistics <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/error-monitoring/unresolved`</span> - Get unresolved errors <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/error-monitoring/:errorId`</span> - Get error details <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #f97316; font-weight: bold;">**PATCH**</span> <span style="color: #3b82f6;">`/api/error-monitoring/:errorId/resolve`</span> - Resolve error <span style="color: #ef4444; font-weight: bold;">Admin only</span>
- <span style="color: #3b82f6; font-weight: bold;">**GET**</span> <span style="color: #3b82f6;">`/api/error-monitoring/dashboard/summary`</span> - Get error monitoring dashboard <span style="color: #ef4444; font-weight: bold;">Admin only</span>
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
