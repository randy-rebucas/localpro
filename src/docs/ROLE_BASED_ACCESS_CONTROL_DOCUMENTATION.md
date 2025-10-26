# Role-Based Access Control (RBAC) Documentation

## Overview

The LocalPro Super App implements a comprehensive role-based access control system with 7 distinct user roles, each with specific capabilities and access levels. This document outlines the complete RBAC implementation, including endpoints, permissions, and functionalities for each role.

## User Roles

### 1. CLIENT
**Description**: Regular users who can book services, purchase supplies, and use basic platform features.

**Capabilities**:
- Browse and search marketplace services
- Book services and manage bookings
- Purchase supplies and materials
- Enroll in academy courses
- Rent equipment and vehicles
- Apply for jobs
- Manage personal profile and settings
- View analytics for their own activities
- Use communication features (messages, notifications)
- Access LocalPro Plus subscription features

**Access Level**: Standard user access to all client-facing features

### 2. PROVIDER
**Description**: Service providers who offer marketplace services and manage their business.

**Capabilities**:
- All CLIENT capabilities PLUS:
- Create and manage marketplace services
- Manage service bookings and customer interactions
- Create and manage job postings
- Create and manage rental listings
- Access provider dashboard and analytics
- Manage provider profile and verification
- View earnings and financial reports
- Access provider-specific settings

**Access Level**: Business role with service provider privileges

### 3. SUPPLIER
**Description**: Materials and equipment suppliers who provide supplies to the platform.

**Capabilities**:
- All CLIENT capabilities PLUS:
- Create and manage supply listings
- Manage inventory and stock levels
- Process supply orders
- Access supplier dashboard and analytics
- Manage supplier profile and verification
- View sales and financial reports
- Access supplier-specific settings

**Access Level**: Business role with supplier privileges

### 4. INSTRUCTOR
**Description**: Educational content creators who create and manage academy courses.

**Capabilities**:
- All CLIENT capabilities PLUS:
- Create and manage academy courses
- Upload course content and videos
- Manage student enrollments
- Access instructor dashboard and analytics
- Manage instructor profile and verification
- View course performance and earnings
- Access instructor-specific settings

**Access Level**: Business role with educational content creation privileges

### 5. AGENCY_OWNER
**Description**: Agency owners who manage agencies and their providers.

**Capabilities**:
- All PROVIDER capabilities PLUS:
- Manage agency profile and settings
- Add/remove agency providers
- Manage agency admins
- Access agency-wide analytics and reports
- Manage agency finances and payments
- Oversee agency operations
- Access administrative features for their agency

**Access Level**: Administrative role with agency management privileges

### 6. AGENCY_ADMIN
**Description**: Agency administrators with limited agency management capabilities.

**Capabilities**:
- All PROVIDER capabilities PLUS:
- Manage agency providers (limited compared to owner)
- Access agency analytics and reports
- Manage agency operations (limited permissions)
- Access administrative features for their agency (limited)

**Access Level**: Administrative role with limited agency management privileges

### 7. ADMIN
**Description**: Platform administrators with full system access.

**Capabilities**:
- Full access to all features and data
- Manage all users, providers, suppliers, instructors
- Access platform-wide analytics and reports
- Manage system settings and configuration
- Oversee all platform operations
- Access admin dashboard with comprehensive controls
- Manage platform finances and transactions
- Monitor system health and performance
- Manage announcements and communications

**Access Level**: Full administrative access to entire platform

## API Endpoints by Role

### Public Endpoints (No Authentication Required)
- `GET /` - Home page
- `GET /about` - About page
- `GET /contact` - Contact page
- `GET /help` - Help page
- `GET /privacy` - Privacy policy
- `GET /terms` - Terms of service
- `GET /api/health` - Health check
- `GET /api/test` - Test endpoint

### Authentication Endpoints
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-code` - Verify code and login
- `GET /api/auth/me` - Get current user (Authenticated)
- `GET /api/auth/profile` - Get user profile (Authenticated)
- `POST /api/auth/upload-avatar` - Upload avatar (Authenticated)
- `POST /api/auth/upload-portfolio` - Upload portfolio (Authenticated)
- `POST /api/auth/logout` - Logout (Authenticated)
- `POST /api/auth/token` - Generate Bearer token (Authenticated)
- `GET /api/auth/token` - Validate Bearer token (Authenticated)

### Marketplace Endpoints

#### All Authenticated Users
- `GET /api/marketplace/services` - Get all services
- `GET /api/marketplace/services/nearby` - Get nearby services
- `GET /api/marketplace/services/[id]` - Get specific service
- `GET /api/marketplace/my-bookings` - Get my bookings
- `POST /api/marketplace/bookings` - Create booking
- `GET /api/marketplace/bookings/[id]` - Get booking details
- `PUT /api/marketplace/bookings/[id]` - Update booking status

#### Provider/Admin Only
- `POST /api/marketplace/services` - Create service
- `PUT /api/marketplace/services/[id]` - Update service
- `DELETE /api/marketplace/services/[id]` - Delete service
- `GET /api/marketplace/my-services` - Get my services

### Job Board Endpoints

#### All Authenticated Users
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/search` - Search jobs
- `GET /api/jobs/[id]` - Get specific job
- `POST /api/jobs/[id]/apply` - Apply for job
- `GET /api/jobs/my-applications` - Get my applications

#### Provider/Admin Only
- `POST /api/jobs` - Create job
- `PUT /api/jobs/[id]` - Update job
- `DELETE /api/jobs/[id]` - Delete job
- `GET /api/jobs/my-jobs` - Get my jobs
- `GET /api/jobs/[id]/applications` - Get job applications
- `PUT /api/jobs/[id]/applications/[applicationId]/status` - Update application status

### Supplies Endpoints

#### All Authenticated Users
- `GET /api/supplies` - Get all supplies
- `GET /api/supplies/[id]` - Get specific supply
- `GET /api/supplies/my-orders` - Get my orders
- `POST /api/supplies/[id]/order` - Order supply

#### Supplier/Admin Only
- `POST /api/supplies` - Create supply
- `PUT /api/supplies/[id]` - Update supply
- `DELETE /api/supplies/[id]` - Delete supply
- `GET /api/supplies/my-supplies` - Get my supplies

### Academy Endpoints

#### All Authenticated Users
- `GET /api/academy/courses` - Get all courses
- `GET /api/academy/courses/[id]` - Get specific course
- `GET /api/academy/my-courses` - Get my enrolled courses
- `POST /api/academy/courses/[id]/enroll` - Enroll in course

#### Instructor/Admin Only
- `POST /api/academy/courses` - Create course
- `PUT /api/academy/courses/[id]` - Update course
- `DELETE /api/academy/courses/[id]` - Delete course
- `GET /api/academy/my-created-courses` - Get my created courses

### Rentals Endpoints

#### All Authenticated Users
- `GET /api/rentals` - Get all rentals
- `GET /api/rentals/[id]` - Get specific rental
- `GET /api/rentals/my-bookings` - Get my bookings
- `POST /api/rentals/[id]/book` - Book rental

#### Provider/Admin Only
- `POST /api/rentals` - Create rental
- `PUT /api/rentals/[id]` - Update rental
- `DELETE /api/rentals/[id]` - Delete rental
- `GET /api/rentals/my-rentals` - Get my rentals

### Finance Endpoints (All Authenticated Users)
- `GET /api/finance/overview` - Get finance overview
- `GET /api/finance/transactions` - Get transactions
- `GET /api/finance/earnings` - Get earnings
- `GET /api/finance/expenses` - Get expenses
- `POST /api/finance/withdraw` - Request withdrawal
- `GET /api/finance/wallet` - Get wallet details

### Analytics Endpoints (All Authenticated Users)
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/user` - Get user analytics
- `GET /api/analytics/marketplace` - Get marketplace analytics
- `POST /api/analytics/track` - Track analytics event

### Admin-Only Endpoints
- `GET /api/providers/admin/all` - Get all providers
- `PUT /api/providers/admin/[id]/status` - Update provider status
- `GET /api/settings/app` - Get app settings
- `PUT /api/settings/app` - Update app settings
- `GET /api/analytics/` - Get platform analytics

## Role-Based UI Access

### Dashboard Modules by Role

#### All Roles
- Dashboard overview
- Profile management
- Settings
- Messages
- Notifications
- Help & Support

#### Business Roles (Provider, Supplier, Instructor, Agency roles)
- Analytics dashboard
- Financial reports
- Performance metrics
- Business insights

#### Service Providers (Provider, Agency roles)
- Marketplace services
- Job postings
- Rental listings
- Service bookings management

#### Suppliers
- Supplies management
- Inventory tracking
- Order processing
- Supplier analytics

#### Instructors
- Academy courses
- Student management
- Course analytics
- Educational content creation

#### Administrative Roles (Agency Owner, Agency Admin, Admin)
- Admin panel access
- User management
- System configuration
- Platform oversight

#### Admin Only
- Full admin dashboard
- System monitoring
- Platform analytics
- User administration
- Financial management
- Content moderation

## LocalPro Plus Subscription Tiers

### Starter (₱199/month)
- Access to job listings
- Wallet tools
- Basic profile visibility
- Email support
- Mobile app access

### Pro (₱499/month) - Most Popular
- Priority listing placement
- Advanced analytics dashboard
- Professional badge
- Enhanced profile visibility
- Priority customer support
- Performance insights
- Custom branding options

### Elite (₱999/month)
- Premium visibility boost
- Leads guarantee program
- Everything in Pro
- Dedicated account manager
- Advanced analytics & insights
- Custom integrations
- Priority booking placement
- 24/7 phone support

### Business Partner (Custom pricing)
- Enterprise features
- Custom integrations
- White-label solutions
- Advanced security features
- Multi-location management
- Team collaboration tools
- 24/7 phone support
- Custom training sessions

## Implementation Details

### Middleware Protection
The system uses Next.js middleware to protect routes based on:
1. Authentication status
2. User role
3. Bearer token validation
4. Route pattern matching

### Route Protection Levels
1. **Public**: No authentication required
2. **Protected**: Requires authentication
3. **Bearer Token**: Requires Bearer token authentication
4. **Admin**: Requires admin role with Bearer token

### Role Checking Utilities
- `isProvider`: Check if user is a service provider
- `isSupplier`: Check if user is a supplier
- `isInstructor`: Check if user is an instructor
- `isAgencyOwner`: Check if user is an agency owner
- `isAgencyAdmin`: Check if user is an agency admin
- `isAdmin`: Check if user is an admin
- `isBusinessRole`: Check if user has business role
- `isServiceProvider`: Check if user provides services
- `isAdministrative`: Check if user has administrative privileges

## Security Considerations

1. **Authentication**: JWT-based session management with encryption
2. **Authorization**: Role-based access control with middleware protection
3. **Token Security**: Bearer token authentication for sensitive operations
4. **Session Management**: Secure session handling with fingerprinting
5. **Route Protection**: Comprehensive middleware for all protected routes

## Future Enhancements

1. **Granular Permissions**: More specific permission levels within roles
2. **Role Hierarchies**: Parent-child role relationships
3. **Dynamic Permissions**: Runtime permission assignment
4. **Audit Logging**: Track role-based actions and changes
5. **Permission Inheritance**: Automatic permission inheritance from parent roles
