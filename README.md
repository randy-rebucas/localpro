# LocalPro Super App

A comprehensive super app platform that integrates multiple professional services including marketplace, supplies, education, finance, rentals, and more.

## Features

### Core Modules

1. **Marketplace** - Demand services (Cleaning, Plumbing, Electrical, Moving)
2. **Supplies & Materials** - Resources and goods (Cleaning supplies, Tools, Subscription kits)
3. **Academy** - Educational and certification services (Partner with TES, Run courses, Certification)
4. **Rentals** - Equipment and vehicle rentals (Tool and vehicle rentals)
5. **LocalPro Plus** - Premium tier subscription service (Premium subscriptions, Providers, Clients)
6. **FacilityCare** - Facility-related services (Janitorial contracts, Landscaping maintenance, Pest control subscriptions)
7. **Ads** - Advertising opportunities (Advertising for hardware stores, Suppliers, Training schools)
8. **Finance** - Financial services (Salary advance, Micro-loans, Partner with fintech.company)

### Admin Panel

The admin panel provides comprehensive management capabilities for platform administrators:

| Module | Path | Description |
|--------|------|-------------|
| **Dashboard** | `/admin` | Overview statistics, recent activity, system health |
| **User Management** | `/admin/users` | Manage users, roles, and permissions |
| **Agencies** | `/admin/agencies` | Manage agencies, verify, view providers |
| **Marketplace** | `/admin/marketplace` | Manage services, categories, and providers |
| **Supplies** | `/admin/supplies` | Manage products, inventory, and orders |
| **Academy** | `/admin/academy` | Manage courses, instructors, and enrollments |
| **Rentals** | `/admin/rentals` | Manage rental items and bookings |
| **Ads** | `/admin/ads` | Manage advertisements and promotions |
| **Finance** | `/admin/finance` | Financial overview, withdrawals, top-ups |
| **Subscriptions** | `/admin/subscriptions` | Manage LocalPro Plus subscriptions |
| **Communication** | `/admin/communication` | Platform messaging and notifications |
| **Broadcaster** | `/admin/broadcaster` | Mass communication tools |
| **Announcements** | `/admin/announcements` | Create and manage platform announcements |
| **Bookings** | `/admin/bookings` | View and manage all marketplace bookings |
| **Activity Logs** | `/admin/activity` | Monitor platform activity and user actions |
| **Settings** | `/admin/settings` | System configuration and feature flags |

### Technical Features

- **Authentication**: Mobile-only authentication with phone verification
- **REST API**: Comprehensive API endpoints for all services
- **External API Integration**: Connects to https://localpro-super-app.onrender.com
- **UI**: Modern, responsive design with Tailwind CSS
- **Type Safety**: Full TypeScript support
- **Form Validation**: Zod schema validation
- **State Management**: SWR for data fetching
- **Role-Based Access Control**: Admin, Provider, Client, Supplier, Instructor roles

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend API**: External API at https://localpro-super-app.onrender.com
- **Authentication**: Custom JWT-based session management
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd localpro-super-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with the following variables:
   ```bash
   # Session Management
   SESSION_SECRET=your-super-secret-key-change-this-in-production
   
   # API Configuration (Development uses http://localhost:5000)
   # Production automatically uses https://localpro-super-app.onrender.com
   # API_BASE_URL=http://localhost:5000  # Optional: override default
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### API Configuration

The application is configured to use the external API at `https://localpro-super-app.onrender.com`. All API requests are automatically proxied to this endpoint.

## API Documentation

### Postman Collection

A comprehensive Postman collection is available for testing all API endpoints:

- **File**: `LocalPro-Admin-API.postman_collection.json`
- **Full API Docs**: `docs/API_ENDPOINTS_WITH_ROLES.md`

#### Import into Postman:
1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `LocalPro-Admin-API.postman_collection.json`
4. Set environment variables:
   - `base_url`: Your API URL (e.g., `https://localpro-super-app.onrender.com`)
   - `auth_token`: Your JWT authentication token

#### Collection Contents:
- **Admin - Agencies**: 12 requests for agency management
- **Admin - Announcements**: 9 requests for announcement CRUD
- **Admin - Bookings**: 9 requests for booking management
- **Admin - Activities**: 12 requests for activity monitoring
- **Admin - Facility Care**: 13 requests for facility services
- **Admin - Users**: 10 requests for user management
- **Admin - Providers**: 3 requests for provider management
- **Admin - App Settings**: 5 requests for configuration
- **Admin - Finance**: 2 requests for financial operations
- **Admin - Audit Logs**: 8 requests for audit trail
- **Admin - Logs**: 10 requests for system logs
- **Admin - Error Monitoring**: 5 requests for error tracking
- **Admin - Subscriptions**: 6 requests for subscription management
- **Admin - Trust Verification**: 2 requests for verification

## API Endpoints

### Authentication
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-code` - Verify code
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/upload-avatar` - Upload user avatar
- `POST /api/auth/upload-portfolio` - Upload portfolio images
- `POST /api/auth/logout` - User logout

### Marketplace
- `GET /api/marketplace/services` - Get all services
- `GET /api/marketplace/services/nearby` - Get nearby services
- `GET /api/marketplace/services/:id` - Get specific service
- `POST /api/marketplace/services` - Create service (Provider/Admin)
- `PUT /api/marketplace/services/:id` - Update service (Provider/Admin)
- `DELETE /api/marketplace/services/:id` - Delete service (Provider/Admin)
- `POST /api/marketplace/services/:id/images` - Upload service images
- `POST /api/marketplace/bookings` - Create booking
- `GET /api/marketplace/bookings` - Get user bookings
- `GET /api/marketplace/bookings/:id` - Get booking details
- `PUT /api/marketplace/bookings/:id/status` - Update booking status
- `POST /api/marketplace/bookings/:id/photos` - Upload booking photos
- `POST /api/marketplace/bookings/:id/review` - Add review
- `POST /api/marketplace/bookings/paypal/approve` - Approve PayPal booking
- `GET /api/marketplace/bookings/paypal/order/:orderId` - Get PayPal order details

### Agencies
- `GET /api/agencies` - Get all agencies
- `GET /api/agencies/:id` - Get agency details
- `POST /api/agencies` - Create agency
- `PUT /api/agencies/:id` - Update agency
- `DELETE /api/agencies/:id` - Delete agency
- `POST /api/agencies/:id/logo` - Upload agency logo
- `POST /api/agencies/:id/providers` - Add provider to agency
- `DELETE /api/agencies/:id/providers/:providerId` - Remove provider
- `PUT /api/agencies/:id/providers/:providerId/status` - Update provider status
- `POST /api/agencies/:id/admins` - Add admin to agency
- `DELETE /api/agencies/:id/admins/:adminId` - Remove admin
- `GET /api/agencies/:id/analytics` - Get agency analytics
- `GET /api/agencies/my/agencies` - Get my agencies
- `POST /api/agencies/join` - Join agency
- `POST /api/agencies/leave` - Leave agency

### Announcements
- `GET /api/announcements` - Get announcements (Public)
- `GET /api/announcements/:id` - Get announcement details
- `GET /api/announcements/my/list` - Get my announcements
- `POST /api/announcements` - Create announcement (Admin)
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement
- `POST /api/announcements/:id/acknowledge` - Acknowledge announcement
- `POST /api/announcements/:id/comments` - Add comment
- `GET /api/announcements/admin/statistics` - Get statistics (Admin)

### Activities
- `GET /api/activities/feed` - Get activity feed
- `GET /api/activities/my` - Get my activities
- `GET /api/activities/user/:userId` - Get user activities
- `GET /api/activities/:id` - Get activity details
- `POST /api/activities` - Create activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity
- `POST /api/activities/:id/interactions` - Add interaction
- `DELETE /api/activities/:id/interactions` - Remove interaction
- `GET /api/activities/stats/my` - Get my activity stats
- `GET /api/activities/stats/global` - Get global stats (Admin)
- `GET /api/activities/metadata` - Get activity metadata

### Supplies
- `GET /api/supplies` - Get all supplies
- `GET /api/supplies/categories` - Get supply categories
- `GET /api/supplies/featured` - Get featured supplies
- `GET /api/supplies/nearby` - Get nearby supplies
- `GET /api/supplies/:id` - Get specific supply
- `POST /api/supplies` - Create supply (Supplier/Admin)
- `PUT /api/supplies/:id` - Update supply (Supplier/Admin)
- `DELETE /api/supplies/:id` - Delete supply (Supplier/Admin)
- `POST /api/supplies/:id/images` - Upload supply images
- `DELETE /api/supplies/:id/images/:imageId` - Delete supply image
- `POST /api/supplies/:id/order` - Order supply
- `PUT /api/supplies/:id/orders/:orderId/status` - Update order status
- `POST /api/supplies/:id/reviews` - Add supply review
- `GET /api/supplies/my-supplies` - Get my supplies
- `GET /api/supplies/my-orders` - Get my supply orders
- `GET /api/supplies/statistics` - Get supply statistics (Admin)

### Academy
- `GET /api/academy/courses` - Get all courses
- `GET /api/academy/courses/:id` - Get specific course
- `GET /api/academy/categories` - Get course categories
- `GET /api/academy/featured` - Get featured courses
- `POST /api/academy/courses` - Create course (Instructor/Admin)
- `PUT /api/academy/courses/:id` - Update course (Instructor/Admin)
- `DELETE /api/academy/courses/:id` - Delete course (Instructor/Admin)
- `POST /api/academy/courses/:id/thumbnail` - Upload course thumbnail
- `POST /api/academy/courses/:id/videos` - Upload course video
- `DELETE /api/academy/courses/:id/videos/:videoId` - Delete course video
- `POST /api/academy/courses/:id/enroll` - Enroll in course
- `PUT /api/academy/courses/:id/progress` - Update course progress
- `POST /api/academy/courses/:id/reviews` - Add course review
- `GET /api/academy/my-courses` - Get my enrolled courses
- `GET /api/academy/my-created-courses` - Get my created courses
- `GET /api/academy/statistics` - Get course statistics (Admin)

### Finance
- `GET /api/finance/overview` - Get financial overview
- `GET /api/finance/transactions` - Get transactions
- `GET /api/finance/earnings` - Get earnings
- `GET /api/finance/expenses` - Get expenses
- `GET /api/finance/reports` - Get financial reports
- `POST /api/finance/expenses` - Add expense
- `POST /api/finance/withdraw` - Request withdrawal
- `PUT /api/finance/withdrawals/:withdrawalId/process` - Process withdrawal (Admin)
- `GET /api/finance/tax-documents` - Get tax documents
- `PUT /api/finance/wallet/settings` - Update wallet settings
- `POST /api/finance/top-up` - Request top-up
- `PUT /api/finance/top-ups/:topUpId/process` - Process top-up (Admin)

### Facility Care
- `GET /api/facility-care` - Get facility care services
- `GET /api/facility-care/nearby` - Get nearby services
- `GET /api/facility-care/:id` - Get service details
- `POST /api/facility-care` - Create service (Provider/Admin)
- `PUT /api/facility-care/:id` - Update service
- `DELETE /api/facility-care/:id` - Delete service
- `POST /api/facility-care/:id/images` - Upload images
- `DELETE /api/facility-care/:id/images/:imageId` - Delete image
- `POST /api/facility-care/:id/book` - Book service
- `PUT /api/facility-care/:id/bookings/:bookingId/status` - Update booking status
- `POST /api/facility-care/:id/reviews` - Add review
- `GET /api/facility-care/my-services` - Get my services
- `GET /api/facility-care/my-bookings` - Get my bookings

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/user` - Get user analytics
- `GET /api/analytics/marketplace` - Get marketplace analytics
- `GET /api/analytics/custom` - Get custom analytics (Admin)
- `POST /api/analytics/track` - Track event

### Rentals
- `GET /api/rentals` - Get all rentals
- `GET /api/rentals/categories` - Get rental categories
- `GET /api/rentals/featured` - Get featured rentals
- `GET /api/rentals/nearby` - Get nearby rentals
- `GET /api/rentals/:id` - Get specific rental
- `POST /api/rentals` - Create rental (Provider/Admin)
- `PUT /api/rentals/:id` - Update rental (Provider/Admin)
- `DELETE /api/rentals/:id` - Delete rental (Provider/Admin)
- `POST /api/rentals/:id/images` - Upload rental images
- `DELETE /api/rentals/:id/images/:imageId` - Delete rental image
- `POST /api/rentals/:id/book` - Book rental
- `PUT /api/rentals/:id/bookings/:bookingId/status` - Update booking status
- `POST /api/rentals/:id/reviews` - Add rental review
- `GET /api/rentals/my-rentals` - Get my rentals
- `GET /api/rentals/my-bookings` - Get my rental bookings
- `GET /api/rentals/statistics` - Get rental statistics (Admin)

### Ads
- `GET /api/ads` - Get all ads
- `GET /api/ads/categories` - Get ad categories
- `GET /api/ads/featured` - Get featured ads
- `GET /api/ads/:id` - Get specific ad
- `POST /api/ads/:id/click` - Track ad click
- `POST /api/ads` - Create ad (Advertiser/Admin)
- `PUT /api/ads/:id` - Update ad (Advertiser/Admin)
- `DELETE /api/ads/:id` - Delete ad (Advertiser/Admin)
- `POST /api/ads/:id/images` - Upload ad images
- `DELETE /api/ads/:id/images/:imageId` - Delete ad image
- `POST /api/ads/:id/promote` - Promote ad
- `GET /api/ads/:id/analytics` - Get ad analytics
- `GET /api/ads/my-ads` - Get my ads
- `GET /api/ads/statistics` - Get ad statistics (Admin)

### Communication
- `GET /api/communication/conversations` - Get conversations
- `GET /api/communication/conversations/:id` - Get specific conversation
- `POST /api/communication/conversations` - Create conversation
- `DELETE /api/communication/conversations/:id` - Delete conversation
- `GET /api/communication/conversations/:id/messages` - Get messages
- `POST /api/communication/conversations/:id/messages` - Send message
- `PUT /api/communication/conversations/:id/messages/:messageId` - Update message
- `DELETE /api/communication/conversations/:id/messages/:messageId` - Delete message
- `PUT /api/communication/conversations/:id/read` - Mark as read
- `GET /api/communication/notifications` - Get notifications
- `GET /api/communication/notifications/count` - Get notification count
- `PUT /api/communication/notifications/:notificationId/read` - Mark notification read
- `PUT /api/communication/notifications/read-all` - Mark all read
- `DELETE /api/communication/notifications/:notificationId` - Delete notification
- `GET /api/communication/unread-count` - Get unread count
- `GET /api/communication/search` - Search conversations

### Maps
- `POST /api/maps/geocode` - Geocode address
- `POST /api/maps/reverse-geocode` - Reverse geocode
- `POST /api/maps/places/search` - Search places
- `GET /api/maps/places/:placeId` - Get place details
- `POST /api/maps/distance` - Calculate distance
- `POST /api/maps/nearby` - Find nearby places
- `POST /api/maps/validate-service-area` - Validate service area
- `POST /api/maps/analyze-coverage` - Analyze service coverage
- `GET /api/maps/test` - Test connection (Admin)

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/search` - Search jobs
- `GET /api/jobs/:id` - Get specific job
- `POST /api/jobs` - Create job (Provider/Admin)
- `PUT /api/jobs/:id` - Update job (Provider/Admin)
- `DELETE /api/jobs/:id` - Delete job (Provider/Admin)
- `POST /api/jobs/:id/logo` - Upload company logo
- `GET /api/jobs/:id/stats` - Get job statistics
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/my-applications` - Get my applications
- `GET /api/jobs/my-jobs` - Get my jobs (Provider/Admin)
- `GET /api/jobs/:id/applications` - Get job applications (Provider/Admin)
- `PUT /api/jobs/:id/applications/:applicationId/status` - Update application status (Provider/Admin)

### Providers
- `GET /api/providers` - Get all providers
- `GET /api/providers/:id` - Get specific provider
- `GET /api/providers/profile/me` - Get my provider profile
- `POST /api/providers/profile` - Create provider profile
- `PUT /api/providers/profile` - Update provider profile
- `PUT /api/providers/onboarding/step` - Update onboarding step
- `POST /api/providers/documents/upload` - Upload documents
- `GET /api/providers/dashboard/overview` - Get provider dashboard
- `GET /api/providers/analytics/performance` - Get provider analytics
- `GET /api/providers/admin/all` - Get all providers for admin
- `PUT /api/providers/admin/:id/status` - Update provider status (Admin)

### Users (Admin)
- `GET /api/users` - Get all users
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/status` - Update user status
- `PATCH /api/users/:id/verification` - Update verification
- `POST /api/users/:id/badges` - Add badge
- `PATCH /api/users/bulk` - Bulk update users
- `DELETE /api/users/:id` - Delete user

### Settings
- `GET /api/settings/user` - Get user settings
- `PUT /api/settings/user` - Update user settings
- `PUT /api/settings/user/:category` - Update settings category
- `POST /api/settings/user/reset` - Reset user settings
- `DELETE /api/settings/user` - Delete user settings
- `GET /api/settings/app` - Get app settings
- `PUT /api/settings/app` - Update app settings (Admin)
- `PUT /api/settings/app/:category` - Update app settings category (Admin)
- `POST /api/settings/app/features/toggle` - Toggle feature flag (Admin)
- `GET /api/settings/app/public` - Get public app settings
- `GET /api/settings/app/health` - Get app health

### LocalPro Plus (Subscriptions)
- `GET /api/localpro-plus/plans` - Get subscription plans
- `GET /api/localpro-plus/plans/:id` - Get plan details
- `POST /api/localpro-plus/plans` - Create plan (Admin)
- `PUT /api/localpro-plus/plans/:id` - Update plan (Admin)
- `DELETE /api/localpro-plus/plans/:id` - Delete plan (Admin)
- `POST /api/localpro-plus/subscribe/:planId` - Subscribe to plan
- `POST /api/localpro-plus/confirm-payment` - Confirm payment
- `POST /api/localpro-plus/cancel` - Cancel subscription
- `POST /api/localpro-plus/renew` - Renew subscription
- `GET /api/localpro-plus/my-subscription` - Get my subscription
- `PUT /api/localpro-plus/settings` - Update subscription settings
- `GET /api/localpro-plus/usage` - Get subscription usage
- `GET /api/localpro-plus/analytics` - Get analytics (Admin)
- `POST /api/localpro-plus/admin/subscriptions` - Create manual subscription (Admin)
- `GET /api/localpro-plus/admin/subscriptions` - Get all subscriptions (Admin)
- `GET /api/localpro-plus/admin/subscriptions/user/:userId` - Get subscription by user
- `PUT /api/localpro-plus/admin/subscriptions/:subscriptionId` - Update subscription (Admin)
- `DELETE /api/localpro-plus/admin/subscriptions/:subscriptionId` - Delete subscription (Admin)

### Referrals
- `POST /api/referrals/validate` - Validate referral code
- `POST /api/referrals/track` - Track referral click
- `GET /api/referrals/leaderboard` - Get referral leaderboard
- `GET /api/referrals/me` - Get my referrals
- `GET /api/referrals/stats` - Get referral stats
- `GET /api/referrals/links` - Get referral links
- `GET /api/referrals/rewards` - Get referral rewards
- `POST /api/referrals/invite` - Send referral invitation
- `PUT /api/referrals/preferences` - Update referral preferences
- `POST /api/referrals/process` - Process referral (Admin)
- `GET /api/referrals/analytics` - Get referral analytics (Admin)

### Trust Verification
- `GET /api/trust-verification/verified-users` - Get verified users
- `GET /api/trust-verification/requests` - Get verification requests
- `GET /api/trust-verification/requests/:id` - Get request details
- `POST /api/trust-verification/requests` - Create verification request
- `PUT /api/trust-verification/requests/:id` - Update request
- `DELETE /api/trust-verification/requests/:id` - Delete request
- `POST /api/trust-verification/requests/:id/documents` - Upload documents
- `DELETE /api/trust-verification/requests/:id/documents/:documentId` - Delete document
- `GET /api/trust-verification/my-requests` - Get my requests
- `PUT /api/trust-verification/requests/:id/review` - Review request (Admin)
- `GET /api/trust-verification/statistics` - Get statistics (Admin)

### Monitoring & Logs (Admin)
- `GET /api/monitoring/health` - Health check
- `GET /api/monitoring/system-health` - Comprehensive system health
- `GET /api/monitoring/metrics` - Prometheus metrics
- `GET /api/audit-logs` - Get audit logs
- `GET /api/audit-logs/stats` - Get audit statistics
- `GET /api/logs` - Get system logs
- `GET /api/logs/stats` - Get log statistics
- `GET /api/error-monitoring/stats` - Get error statistics
- `GET /api/error-monitoring/unresolved` - Get unresolved errors

## User Roles

| Role | Description |
|------|-------------|
| **CLIENT** | Regular users who can book services, purchase supplies, etc. |
| **PROVIDER** | Service providers who offer marketplace services |
| **SUPPLIER** | Users who sell supplies and products |
| **INSTRUCTOR** | Academy course instructors |
| **AGENCY_ADMIN** | Agency administrator |
| **AGENCY_OWNER** | Agency owner |
| **ADMIN** | Platform administrators with full access |

## API Integration

The application integrates with the external API at `https://localpro-super-app.onrender.com` which provides:

- **User Management**: Authentication and user profiles
- **Marketplace Services & Bookings**: Service marketplace functionality
- **Supplies Products & Orders**: E-commerce for supplies
- **Academy Courses & Enrollments**: Educational platform
- **Rental Items & Rentals**: Equipment rental system
- **Subscriptions**: Premium service management
- **Facility Contracts**: Facility management services
- **Advertisements**: Advertising platform
- **Loans & Salary Advances**: Financial services
- **Agencies**: Multi-provider agency management
- **Announcements**: Platform-wide announcements
- **Activity Tracking**: User activity monitoring

## Development

### Project Structure

```
src/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Authentication pages
│   │   └── auth/                 # Login/Register
│   ├── (authenticated)/          # Protected user pages
│   │   ├── academy/              # Academy module
│   │   ├── ads/                  # Advertisements
│   │   ├── communication/        # Messaging
│   │   ├── dashboard/            # User dashboard
│   │   ├── facility-care/        # Facility services
│   │   ├── finance/              # Financial services
│   │   ├── jobs/                 # Job listings
│   │   ├── marketplace/          # Service marketplace
│   │   ├── profile/              # User profile
│   │   ├── rentals/              # Equipment rentals
│   │   ├── settings/             # User settings
│   │   └── supplies/             # Supplies store
│   ├── admin/                    # Admin panel
│   │   ├── academy/              # Manage courses
│   │   ├── activity/             # Activity logs
│   │   ├── ads/                  # Manage ads
│   │   ├── agencies/             # Manage agencies
│   │   ├── announcements/        # Manage announcements
│   │   ├── bookings/             # Manage bookings
│   │   ├── broadcaster/          # Mass communication
│   │   ├── communication/        # Platform messaging
│   │   ├── finance/              # Financial management
│   │   ├── marketplace/          # Manage services
│   │   ├── rentals/              # Manage rentals
│   │   ├── settings/             # System settings
│   │   ├── subscriptions/        # Manage subscriptions
│   │   ├── supplies/             # Manage products
│   │   └── users/                # User management
│   └── api/                      # API routes
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── ui/                       # Reusable UI components
│   └── ...                       # Feature components
├── contexts/                     # React contexts
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
│   ├── api.ts                    # API configuration
│   ├── auth-utils.ts             # Authentication utilities
│   ├── logger.ts                 # Logging utilities
│   └── ...                       # Other utilities
├── types/                        # TypeScript type definitions
└── data/                         # Static data
```

### Key Components

- **Dashboard**: Main application interface with service modules
- **Authentication**: Phone-only sign in with SMS verification
- **User Profile**: Complete profile management with avatar and portfolio upload
- **Admin Panel**: Comprehensive administrative interface
- **Verification Modal**: Phone verification system
- **Service Modules**: Individual components for each service area

### Feature Documentation

Detailed documentation for each feature is available in the `features/` directory:

```
features/
├── academy/                # Academy feature docs
├── activity/               # Activity tracking docs
├── ads/                    # Advertising docs
├── agencies/               # Agency management docs
├── analytics/              # Analytics docs
├── announcements/          # Announcements docs
├── bookings/               # Bookings docs
├── communication/          # Messaging docs
├── facility-care/          # Facility care docs
├── finance/                # Finance docs
├── jobs/                   # Jobs docs
├── providers/              # Provider docs
├── referrals/              # Referral docs
├── rentals/                # Rentals docs
├── services/               # Services docs
├── subscriptions/          # Subscription docs
├── supplies/               # Supplies docs
├── trust-verification/     # Verification docs
├── user-settings/          # User settings docs
└── users/                  # User management docs
```

Each feature folder contains:
- `api-endpoints.md` - API endpoint documentation
- `data-entities.md` - Data model documentation
- `best-practices.md` - Implementation guidelines
- `usage-examples.md` - Code examples
- `README.md` - Feature overview

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
