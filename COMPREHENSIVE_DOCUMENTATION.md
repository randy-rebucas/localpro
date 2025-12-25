# LocalPro Super App - Comprehensive Documentation

> **Version:** 1.0.0  
> **Last Updated:** December 2024  
> **Purpose:** Complete technical documentation covering tech stack, architecture, features, and implementation details

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [Authentication & Security](#authentication--security)
7. [API Integration](#api-integration)
8. [State Management](#state-management)
9. [UI/UX Framework](#uiux-framework)
10. [Performance Optimizations](#performance-optimizations)
11. [Development Workflow](#development-workflow)
12. [Deployment & Infrastructure](#deployment--infrastructure)
13. [Monitoring & Analytics](#monitoring--analytics)
14. [Feature Modules](#feature-modules)
15. [Admin Panel](#admin-panel)
16. [User Roles & Permissions](#user-roles--permissions)
17. [Environment Configuration](#environment-configuration)
18. [Testing & Quality Assurance](#testing--quality-assurance)
19. [Troubleshooting](#troubleshooting)
20. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**LocalPro Super App** is a comprehensive Next.js-based platform that serves as a multi-service marketplace connecting service providers, suppliers, instructors, and clients. The application acts as a frontend proxy layer to an external REST API, providing a complete ecosystem for professional services, e-commerce, education, rentals, and financial services.

### Key Highlights

- **Multi-role Platform**: 7 distinct user roles with role-based access control
- **20+ Feature Modules**: Marketplace, Supplies, Academy, Rentals, Jobs, Finance, and more
- **Modern Tech Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **External API Integration**: Connects to `https://localpro-super-app.onrender.com`
- **Phone-based Authentication**: SMS verification system (no email/password)
- **Comprehensive Admin Panel**: Full platform administration capabilities
- **Performance Optimized**: SWR caching, lazy loading, code splitting
- **Production Ready**: Sentry monitoring, analytics, security headers

---

## Tech Stack

### Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.9 | React framework with App Router, SSR, SSG |
| **React** | 19.1.0 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |

### State Management & Data Fetching

| Technology | Version | Purpose |
|------------|---------|---------|
| **SWR** | 2.2.5 | Data fetching, caching, and revalidation |
| **React Hook Form** | 7.53.0 | Form state management |
| **Zod** | 3.23.8 | Schema validation |

### UI Components & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **Radix UI** | Various | Accessible component primitives |
| - Dialog | 1.1.1 | Modal dialogs |
| - Dropdown Menu | 2.1.1 | Dropdown menus |
| - Toast | 1.2.1 | Toast notifications |
| - Slot | 1.1.0 | Component composition |
| **Lucide React** | 0.460.0 | Icon library |
| **React Hot Toast** | 2.4.1 | Toast notifications |
| **Recharts** | 3.3.0 | Chart library for analytics |
| **class-variance-authority** | 0.7.0 | Component variant management |
| **clsx** | 2.1.1 | Conditional class names |
| **tailwind-merge** | 2.5.4 | Tailwind class merging |

### Authentication & Security

| Technology | Version | Purpose |
|------------|---------|---------|
| **jose** | 6.1.0 | JWT signing and verification |
| **jsonwebtoken** | 9.0.2 | JWT token handling |
| **bcryptjs** | 2.4.3 | Password hashing (if needed) |
| **cookie** | 1.0.2 | Cookie parsing and serialization |

### Utilities & Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **html2canvas** | 1.4.1 | HTML to canvas conversion |
| **jspdf** | 3.0.3 | PDF generation |
| **web-vitals** | 4.2.4 | Web performance metrics |

### Monitoring & Analytics

| Technology | Version | Purpose |
|------------|---------|---------|
| **@sentry/nextjs** | 10.22.0 | Error tracking and monitoring |
| **@vercel/analytics** | 1.5.0 | Web analytics |
| **@vercel/speed-insights** | 1.2.0 | Performance insights |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.x | Code linting |
| **TypeScript** | 5.x | Type checking |
| **@axe-core/react** | 4.11.0 | Accessibility testing |

### Package Manager

- **pnpm** | 10.20.0 | Fast, disk space efficient package manager

---

## Architecture Overview

### System Architecture

```
┌─────────────────┐
│   Client (Web)   │
│   Next.js App    │
└────────┬─────────┘
         │
         │ HTTPS
         │
┌────────▼─────────────────────────┐
│   Next.js Middleware            │
│   - Authentication               │
│   - Route Protection             │
│   - Role-based Access Control    │
└────────┬─────────────────────────┘
         │
         │ API Requests
         │ (Bearer Token Auth)
         │
┌────────▼─────────────────────────┐
│   External API                  │
│   https://localpro-super-app    │
│   .onrender.com                 │
│   - REST API                    │
│   - JWT Authentication          │
│   - Database (MongoDB)           │
└─────────────────────────────────┘
```

### Application Flow

1. **User Authentication**
   - User enters phone number
   - SMS verification code sent
   - Code verified → JWT token issued
   - Session stored in encrypted cookie
   - API token extracted for external API calls

2. **Data Fetching**
   - Client components use SWR hooks
   - SWR fetcher adds Bearer token to requests
   - Requests proxied to external API
   - Responses cached and revalidated automatically

3. **Route Protection**
   - Middleware checks authentication
   - Validates user roles
   - Redirects unauthorized users
   - Caches auth checks for performance

### Key Architectural Patterns

#### 1. **Feature-Based Organization**
- Features organized in `src/features/` directory
- Each feature contains: hooks, types, components, utils
- Promotes modularity and maintainability

#### 2. **API Proxy Pattern**
- Frontend acts as proxy to external API
- All API calls go through centralized utilities
- Authentication handled transparently
- Error handling centralized

#### 3. **SWR Data Fetching**
- Replaces traditional `fetch + useEffect` patterns
- Automatic caching and revalidation
- Request deduplication
- Optimistic updates support

#### 4. **Server Components First**
- Next.js App Router with Server Components
- Client Components only when needed
- Reduced JavaScript bundle size
- Better SEO and performance

---

## Project Structure

```
localpro/
├── public/                          # Static assets
│   ├── images/                      # Image assets
│   ├── logo*.svg                    # Brand logos
│   └── manifest.json                # PWA manifest
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Authentication routes
│   │   │   └── auth/                # Login/Register pages
│   │   ├── (authenticated)/         # Protected user routes
│   │   │   ├── dashboard/           # User dashboard
│   │   │   ├── marketplace/         # Service marketplace
│   │   │   ├── supplies/            # E-commerce
│   │   │   ├── academy/             # Educational courses
│   │   │   ├── rentals/             # Equipment rentals
│   │   │   ├── jobs/                # Job board
│   │   │   ├── finance/             # Financial services
│   │   │   ├── profile/             # User profile
│   │   │   └── settings/           # User settings
│   │   ├── (public)/                # Public routes
│   │   │   └── ...                  # Landing pages, etc.
│   │   ├── admin/                   # Admin panel routes
│   │   │   ├── users/               # User management
│   │   │   ├── marketplace/        # Service management
│   │   │   ├── supplies/           # Product management
│   │   │   ├── academy/             # Course management
│   │   │   ├── analytics/           # Analytics dashboard
│   │   │   └── settings/           # System settings
│   │   ├── api/                     # API routes (if any)
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles
│   │   └── ...                      # Error, loading, not-found pages
│   │
│   ├── components/                  # React components
│   │   ├── ui/                      # Reusable UI components
│   │   ├── admin/                   # Admin-specific components
│   │   ├── marketplace/             # Marketplace components
│   │   ├── forms/                   # Form components
│   │   ├── shared/                  # Shared components
│   │   └── ...                      # Feature components
│   │
│   ├── features/                    # Feature modules
│   │   ├── auth/                    # Authentication
│   │   ├── marketplace/             # Marketplace services
│   │   ├── supplies/                # Supplies e-commerce
│   │   ├── academy/                 # Academy courses
│   │   ├── rentals/                 # Equipment rentals
│   │   ├── jobs/                    # Job board
│   │   ├── finance/                 # Financial services
│   │   ├── analytics/               # Analytics
│   │   ├── communication/           # Messaging
│   │   └── ...                      # Other features
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts               # Authentication hook
│   │   ├── useMarketplaceServices.ts # Marketplace hooks
│   │   ├── useSupplies.ts           # Supplies hooks
│   │   └── ...                      # Other hooks
│   │
│   ├── lib/                         # Utility libraries
│   │   ├── api.ts                   # API configuration
│   │   ├── auth-utils.ts            # Auth utilities
│   │   ├── swr-config.ts            # SWR configuration
│   │   ├── session.ts               # Session management
│   │   ├── logger.ts                # Logging utilities
│   │   └── ...                      # Other utilities
│   │
│   ├── types/                       # TypeScript types
│   │   ├── user.ts                  # User types
│   │   ├── marketplace.ts           # Marketplace types
│   │   └── ...                      # Other types
│   │
│   ├── contexts/                    # React contexts
│   │   ├── session-context.tsx     # Session context
│   │   └── role-view-context.tsx   # Role view context
│   │
│   ├── providers/                   # React providers
│   │   └── swr-provider.tsx        # SWR provider
│   │
│   ├── shared/                      # Shared utilities
│   │   ├── components/              # Shared components
│   │   ├── hooks/                   # Shared hooks
│   │   ├── lib/                     # Shared libraries
│   │   └── types/                   # Shared types
│   │
│   ├── middleware.ts                # Next.js middleware
│   └── instrumentation.ts            # Sentry instrumentation
│
├── docs/                            # Documentation
│   ├── HOOKS_MIGRATION_GUIDE.md    # SWR migration guide
│   ├── API_ENDPOINTS_WITH_ROLES.md  # API documentation
│   └── ...                          # Other docs
│
├── features/                        # Feature documentation
│   ├── academy/                     # Academy docs
│   ├── marketplace/                 # Marketplace docs
│   └── ...                          # Other feature docs
│
├── package.json                     # Dependencies
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts               # Tailwind config
├── next.config.ts                    # Next.js config
├── eslint.config.mjs                # ESLint config
└── README.md                         # Project README
```

---

## Core Features

### 1. Authentication & User Management

**Phone-Based Authentication**
- SMS verification code system
- No email/password authentication
- JWT token-based sessions
- Encrypted session cookies
- Automatic token refresh

**User Profile Management**
- Profile creation and editing
- Avatar upload
- Portfolio image gallery
- Profile completion tracking
- Onboarding flow

**Key Endpoints:**
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-code` - Verify code and login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/upload-avatar` - Upload avatar
- `POST /api/auth/upload-portfolio` - Upload portfolio

### 2. Marketplace Services

**Service Discovery**
- Browse services by category
- Location-based search
- Price range filtering
- Rating and review filtering
- Advanced search with AI

**Service Management (Providers)**
- Create service listings
- Upload service images
- Manage pricing and availability
- Track bookings and reviews
- Analytics dashboard

**Booking System**
- Schedule service appointments
- Payment processing (PayPal, PayMaya)
- Photo sharing during service
- Review and rating system
- Booking status tracking

**Key Endpoints:**
- `GET /api/marketplace/services` - List services
- `GET /api/marketplace/services/:id` - Get service details
- `POST /api/marketplace/services` - Create service
- `POST /api/marketplace/bookings` - Create booking
- `GET /api/marketplace/my-bookings` - Get user bookings

### 3. Supplies & E-Commerce

**Product Catalog**
- Browse supplies by category
- Featured products
- Nearby suppliers
- Product search and filtering
- Product reviews

**Order Management**
- Add to cart
- Checkout process
- Order tracking
- Order history
- Supplier order management

**Key Endpoints:**
- `GET /api/supplies` - List supplies
- `GET /api/supplies/:id` - Get product details
- `POST /api/supplies/:id/order` - Place order
- `GET /api/supplies/my-orders` - Get user orders

### 4. Academy (Education)

**Course Management**
- Browse courses by category
- Featured courses
- Course search
- Course details and curriculum
- Video content management

**Enrollment System**
- Enroll in courses
- Track learning progress
- Course completion certificates
- Instructor course creation
- Student analytics

**Key Endpoints:**
- `GET /api/academy/courses` - List courses
- `GET /api/academy/courses/:id` - Get course details
- `POST /api/academy/courses/:id/enroll` - Enroll in course
- `PUT /api/academy/courses/:id/progress` - Update progress

### 5. Equipment Rentals

**Rental Listings**
- Browse rental items
- Category filtering
- Location-based search
- Availability calendar
- Pricing information

**Booking System**
- Book rental items
- Date range selection
- Booking management
- Review system

**Key Endpoints:**
- `GET /api/rentals` - List rentals
- `POST /api/rentals/:id/book` - Book rental
- `GET /api/rentals/my-bookings` - Get user bookings

### 6. Job Board

**Job Listings**
- Browse job postings
- Category filtering
- Location-based search
- Salary range filtering
- Company information

**Application System**
- Apply for jobs
- Application tracking
- Application status updates
- Provider job management

**Key Endpoints:**
- `GET /api/jobs` - List jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/my-applications` - Get user applications

### 7. Finance & Wallet

**Financial Overview**
- Earnings tracking
- Expense management
- Transaction history
- Financial reports
- Tax documents

**Payment Processing**
- Wallet top-up
- Withdrawal requests
- Payment history
- Payment method management

**Key Endpoints:**
- `GET /api/finance/overview` - Get financial overview
- `GET /api/finance/transactions` - Get transactions
- `POST /api/finance/withdraw` - Request withdrawal
- `POST /api/finance/top-up` - Request top-up

### 8. LocalPro Plus (Subscriptions)

**Subscription Plans**
- Browse subscription plans
- Plan details and features
- Pricing information
- Subscription management

**Subscription Management**
- Subscribe to plans
- Payment processing
- Subscription renewal
- Cancel subscription
- Usage tracking

**Key Endpoints:**
- `GET /api/localpro-plus/plans` - List plans
- `POST /api/localpro-plus/subscribe/:planId` - Subscribe
- `GET /api/localpro-plus/my-subscription` - Get subscription

### 9. Facility Care Services

**Service Management**
- Facility service listings
- Recurring service contracts
- Booking management
- Service reviews

**Key Endpoints:**
- `GET /api/facility-care` - List services
- `POST /api/facility-care/:id/book` - Book service

### 10. Advertising Platform

**Ad Management**
- Create advertisements
- Ad categories
- Featured ads
- Ad analytics
- Click tracking

**Key Endpoints:**
- `GET /api/ads` - List ads
- `POST /api/ads` - Create ad
- `GET /api/ads/:id/analytics` - Get ad analytics

### 11. Communication System

**Messaging**
- Real-time conversations
- Message history
- File attachments
- Typing indicators
- Read receipts

**Notifications**
- Push notifications
- Email notifications
- SMS notifications
- Notification preferences
- Unread count tracking

**Key Endpoints:**
- `GET /api/communication/conversations` - Get conversations
- `POST /api/communication/conversations/:id/messages` - Send message
- `GET /api/communication/notifications` - Get notifications

### 12. Agencies

**Agency Management**
- Create agencies
- Add providers to agencies
- Agency analytics
- Provider management
- Agency verification

**Key Endpoints:**
- `GET /api/agencies` - List agencies
- `POST /api/agencies` - Create agency
- `POST /api/agencies/:id/providers` - Add provider

### 13. Analytics & Insights

**Dashboard Analytics**
- User analytics
- Marketplace analytics
- Financial analytics
- Custom analytics
- Real-time metrics

**Key Endpoints:**
- `GET /api/analytics/overview` - Get overview
- `GET /api/analytics/dashboard` - Get dashboard
- `GET /api/analytics/realtime` - Get real-time data

### 14. Trust Verification

**Verification System**
- Submit verification requests
- Document upload
- Verification status tracking
- Verified user badges

**Key Endpoints:**
- `POST /api/trust-verification/requests` - Create request
- `GET /api/trust-verification/my-requests` - Get requests

### 15. Referrals

**Referral System**
- Generate referral links
- Track referrals
- Referral rewards
- Leaderboard
- Analytics

**Key Endpoints:**
- `GET /api/referrals/links` - Get referral links
- `GET /api/referrals/me` - Get my referrals
- `GET /api/referrals/leaderboard` - Get leaderboard

### 16. Activity Feed

**Social Features**
- Activity timeline
- User activities
- Activity interactions
- Activity statistics

**Key Endpoints:**
- `GET /api/activities/feed` - Get activity feed
- `GET /api/activities/my` - Get my activities

### 17. Announcements

**Platform Announcements**
- Browse announcements
- Announcement details
- Acknowledge announcements
- Comments on announcements

**Key Endpoints:**
- `GET /api/announcements` - List announcements
- `POST /api/announcements/:id/acknowledge` - Acknowledge

### 18. Search

**Global Search**
- Search across all entities
- Search suggestions
- Popular searches
- Advanced search
- Search analytics

**Key Endpoints:**
- `GET /api/search` - Global search
- `GET /api/search/suggestions` - Get suggestions

### 19. Maps & Location

**Location Services**
- Geocoding
- Reverse geocoding
- Place search
- Distance calculation
- Nearby places
- Service area validation

**Key Endpoints:**
- `POST /api/maps/geocode` - Geocode address
- `POST /api/maps/nearby` - Find nearby places

### 20. AI Features

**AI-Powered Features**
- Natural language search
- Service recommendations
- Price estimator
- Service matcher
- Review sentiment analysis
- Booking assistant
- Description generator
- Pricing optimizer
- Demand forecast
- Review insights
- Response assistant
- Listing optimizer
- Scheduling assistant
- Bio generator
- Form prefiller

**Key Endpoints:**
- `POST /api/ai/marketplace/natural-language-search`
- `POST /api/ai/marketplace/recommendations`
- `POST /api/ai/marketplace/price-estimator`

---

## Authentication & Security

### Authentication Flow

1. **User enters phone number** → `POST /api/auth/send-code`
2. **SMS code sent** → User receives verification code
3. **User enters code** → `POST /api/auth/verify-code`
4. **Code verified** → JWT token issued by external API
5. **Session created** → Encrypted session cookie stored
6. **API token extracted** → Used for subsequent API calls

### Session Management

**Session Storage:**
- Encrypted JWT tokens in httpOnly cookies
- Session data includes: userId, roles, apiToken
- Session expiration: 7 days (configurable)
- Automatic session refresh

**Session Structure:**
```typescript
interface SessionData {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  roles: string[];        // Multi-role support
  phone: string;
  apiToken?: string;       // External API token
  // ... other user data
}
```

### Security Features

**1. Middleware Protection**
- Route-level authentication checks
- Role-based access control
- Automatic redirects for unauthorized users
- Cached authentication checks (5 minutes)

**2. API Security**
- Bearer token authentication
- Token validation on every request
- Automatic token refresh
- Secure cookie handling

**3. Security Headers**
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Referrer-Policy
- Permissions-Policy

**4. Input Validation**
- Zod schema validation
- Type-safe API parameters
- Sanitized user inputs
- SQL injection prevention (via API)

**5. Error Handling**
- Secure error messages
- No sensitive data in errors
- Comprehensive logging
- Sentry error tracking

---

## API Integration

### API Configuration

**Base URL:**
- Production: `https://localpro-super-app.onrender.com`
- Development: `http://localhost:5000` (if local API available)

**Authentication:**
- Bearer token in `Authorization` header
- Token extracted from session cookie
- Automatic token injection via `createAuthHeaders()`

### API Request Flow

```typescript
// 1. Create authenticated fetch options
const options = createAuthFetchOptions({
  method: 'POST',
  body: JSON.stringify(data)
});

// 2. Make request
const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

// 3. Handle response
const data = await response.json();
```

### SWR Integration

**SWR Fetcher:**
- Automatic authentication
- Error handling
- Request deduplication
- Caching and revalidation

**Example:**
```typescript
const { data, error, isLoading } = useSWR(
  createSWRKey(API_ENDPOINTS.marketplaceServices, { page: 1 }),
  swrFetcher
);
```

### API Endpoints

**600+ API Endpoints** organized by feature:
- Authentication: 8 endpoints
- Marketplace: 50+ endpoints
- Supplies: 30+ endpoints
- Academy: 25+ endpoints
- Jobs: 20+ endpoints
- Finance: 15+ endpoints
- Communication: 30+ endpoints
- Analytics: 20+ endpoints
- Admin: 100+ endpoints
- And many more...

See `docs/API_ENDPOINTS_WITH_ROLES.md` for complete list.

---

## State Management

### SWR (Stale-While-Revalidate)

**Primary Data Fetching Library:**
- Automatic caching
- Request deduplication
- Background revalidation
- Error retry logic
- Optimistic updates

**Configuration:**
```typescript
{
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateOnMount: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  keepPreviousData: true
}
```

### React Context

**Session Context:**
- User session data
- Authentication state
- User profile

**Role View Context:**
- Current role view
- Role switching

### Local State

**React Hook Form:**
- Form state management
- Validation
- Error handling

**useState/useReducer:**
- Component-level state
- UI state management

---

## UI/UX Framework

### Design System

**Tailwind CSS:**
- Utility-first CSS
- Custom color palette (primary, secondary)
- Custom animations
- Responsive design

**Component Library:**
- Radix UI primitives
- Custom UI components
- Accessible components
- Consistent styling

### Typography

**Fonts:**
- Geist Sans (primary)
- Geist Mono (monospace)
- Google Fonts integration

### Icons

**Lucide React:**
- 1000+ icons
- Tree-shakeable
- Consistent style

### Responsive Design

**Breakpoints:**
- Mobile-first approach
- Tablet optimizations
- Desktop layouts
- Large screen support

### Accessibility

**Features:**
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast compliance

---

## Performance Optimizations

### Code Splitting

**Route-Based Splitting:**
- Automatic code splitting by route
- Dynamic imports for heavy components
- Lazy loading for non-critical features

**Component Splitting:**
- Lazy-loaded components
- Dynamic imports
- Reduced initial bundle size

### Image Optimization

**Next.js Image:**
- Automatic image optimization
- Lazy loading
- Responsive images
- WebP format support

**Remote Patterns:**
- Configured for API images
- Unsplash integration
- Cloudinary support

### Caching Strategy

**SWR Caching:**
- Automatic response caching
- Stale-while-revalidate
- Background updates
- Cache invalidation

**Browser Caching:**
- Static asset caching
- API response caching
- Service worker (if enabled)

### Bundle Optimization

**Package Imports:**
- Optimized imports for large libraries
- Tree-shaking enabled
- Dead code elimination

**Optimized Libraries:**
- lucide-react
- @radix-ui components
- recharts

### Performance Monitoring

**Web Vitals:**
- Core Web Vitals tracking
- Performance metrics
- Real User Monitoring (RUM)

**Vercel Analytics:**
- Page view tracking
- Performance insights
- User behavior

---

## Development Workflow

### Getting Started

**1. Prerequisites:**
```bash
- Node.js 18+
- pnpm 10.20.0+
```

**2. Installation:**
```bash
git clone <repository-url>
cd localpro-super-app
pnpm install
```

**3. Environment Setup:**
```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

**4. Development Server:**
```bash
pnpm dev
# Open http://localhost:3000
```

### Scripts

```json
{
  "dev": "next dev",           // Development server
  "build": "next build",       // Production build
  "start": "next start",       // Production server
  "lint": "eslint .",          // Lint code
  "lint:fix": "eslint . --fix" // Fix linting issues
}
```

### Code Organization

**Feature-Based Structure:**
- Each feature in `src/features/`
- Hooks in `src/hooks/`
- Components in `src/components/`
- Types in `src/types/`
- Utils in `src/lib/`

### TypeScript

**Strict Mode:**
- Type checking enabled
- No implicit any
- Strict null checks
- Type-safe API calls

### Linting

**ESLint:**
- Next.js recommended rules
- TypeScript rules
- React rules
- Custom rules

---

## Deployment & Infrastructure

### Deployment Platform

**Vercel (Recommended):**
- Automatic deployments
- Preview deployments
- Edge network
- Analytics integration

**Alternative Platforms:**
- Netlify
- AWS Amplify
- Self-hosted (Node.js server)

### Environment Variables

**Required Variables:**
- `SESSION_SECRET` - Session encryption key
- `NEXT_PUBLIC_API_BASE_URL` - API base URL
- `NEXT_PUBLIC_SITE_URL` - Site URL

**Optional Variables:**
- `NEXT_PUBLIC_GTM_ID` - Google Tag Manager
- `SENTRY_DSN` - Sentry error tracking
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Maps integration

### Build Configuration

**Next.js Config:**
- Image optimization
- Security headers
- Compression enabled
- Source maps (production disabled)

### Monitoring

**Sentry:**
- Error tracking
- Performance monitoring
- Release tracking
- User context

**Vercel Analytics:**
- Web analytics
- Performance insights
- Speed insights

---

## Monitoring & Analytics

### Error Tracking

**Sentry Integration:**
- Automatic error capture
- Source maps for debugging
- User context tracking
- Release tracking
- Performance monitoring

### Analytics

**Vercel Analytics:**
- Page view tracking
- Performance metrics
- User behavior

**Google Tag Manager:**
- Custom event tracking
- Conversion tracking
- User segmentation

### Performance Monitoring

**Web Vitals:**
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

### Logging

**Client-Side Logging:**
- Console logging (development)
- Error logging
- Performance logging
- User action logging

---

## Feature Modules

### Module Structure

Each feature module follows this structure:

```
features/{feature-name}/
├── README.md              # Feature overview
├── api-endpoints.md       # API documentation
├── data-entities.md       # Data models
├── usage-examples.md      # Code examples
└── best-practices.md      # Guidelines
```

### Available Modules

1. **Academy** - Educational courses and certifications
2. **Activity** - Activity feed and social features
3. **Ads** - Advertising platform
4. **Agencies** - Multi-provider organizations
5. **Analytics** - Analytics and insights
6. **Announcements** - Platform announcements
7. **App Settings** - Application settings
8. **Bookings** - Service bookings
9. **Communication** - Messaging and notifications
10. **Courses** - Course management
11. **Facility Care** - Facility services
12. **Finance** - Financial services
13. **Jobs** - Job board
14. **Logs** - System logging
15. **Providers** - Service providers
16. **Referrals** - Referral system
17. **Rentals** - Equipment rentals
18. **Services** - Marketplace services
19. **Subscriptions** - LocalPro Plus
20. **Supplies** - E-commerce
21. **Trust Verification** - User verification
22. **User Settings** - User preferences
23. **Users** - User management

---

## Admin Panel

### Admin Routes

**Dashboard:** `/admin`
- Overview statistics
- Recent activity
- System health

**User Management:** `/admin/users`
- User list and search
- User details
- Role management
- User status updates

**Agencies:** `/admin/agencies`
- Agency list
- Agency verification
- Provider management

**Marketplace:** `/admin/marketplace`
- Service management
- Category management
- Provider management

**Supplies:** `/admin/supplies`
- Product management
- Inventory tracking
- Order management

**Academy:** `/admin/academy`
- Course management
- Instructor management
- Enrollment tracking

**Rentals:** `/admin/rentals`
- Rental item management
- Booking management

**Ads:** `/admin/ads`
- Ad management
- Ad approval
- Analytics

**Finance:** `/admin/finance`
- Financial overview
- Withdrawal processing
- Top-up processing

**Subscriptions:** `/admin/subscriptions`
- Subscription management
- Plan management

**Communication:** `/admin/communication`
- Platform messaging
- Notification management

**Broadcaster:** `/admin/broadcaster`
- Mass communication
- Announcement broadcasting

**Announcements:** `/admin/announcements`
- Create announcements
- Manage announcements

**Bookings:** `/admin/bookings`
- View all bookings
- Booking management

**Activity Logs:** `/admin/activity`
- Activity monitoring
- User action tracking

**Settings:** `/admin/settings`
- System configuration
- Feature flags

---

## User Roles & Permissions

### Role Definitions

**1. CLIENT**
- Standard user
- Browse and book services
- Purchase supplies
- Enroll in courses
- Apply for jobs
- Rent equipment

**2. PROVIDER**
- Service provider
- All CLIENT capabilities
- Create/manage services
- Create/manage jobs
- Create/manage rentals
- View analytics
- Manage earnings

**3. SUPPLIER**
- Materials supplier
- All CLIENT capabilities
- Create/manage supplies
- Manage inventory
- Process orders
- View sales analytics

**4. INSTRUCTOR**
- Academy instructor
- All CLIENT capabilities
- Create/manage courses
- Manage enrollments
- View course analytics

**5. AGENCY_ADMIN**
- Agency administrator
- All PROVIDER capabilities
- Manage agency providers
- View agency analytics
- Agency settings

**6. AGENCY_OWNER**
- Agency owner
- All AGENCY_ADMIN capabilities
- Full agency control
- Financial management

**7. ADMIN**
- Platform administrator
- Full system access
- User management
- System configuration
- All feature access

### Role-Based Access Control

**Route Protection:**
- Middleware-level protection
- Role-based route access
- Automatic redirects

**API Protection:**
- Endpoint-level role checks
- Bearer token validation
- Role-based permissions

**Component Protection:**
- Role guards
- Conditional rendering
- Feature flags

---

## Environment Configuration

### Required Variables

```bash
# Session Management
SESSION_SECRET=your-super-secret-key

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://localpro-super-app.onrender.com
```

### Optional Variables

```bash
# Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
SENTRY_DSN=https://...

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://localpro.ph
NEXT_PUBLIC_APP_NAME=LocalPro
```

See `env.example` for complete list.

---

## Testing & Quality Assurance

### Code Quality

**TypeScript:**
- Strict type checking
- Type safety
- Compile-time error detection

**ESLint:**
- Code linting
- Best practices enforcement
- Consistent code style

**Accessibility:**
- @axe-core/react integration
- ARIA compliance
- Keyboard navigation

### Testing Strategy

**Manual Testing:**
- Feature testing
- Cross-browser testing
- Mobile device testing

**Automated Testing:**
- Unit tests (if implemented)
- Integration tests (if implemented)
- E2E tests (if implemented)

---

## Troubleshooting

### Common Issues

**1. Authentication Errors**
- Check session cookie
- Verify API token
- Check token expiration

**2. API Connection Issues**
- Verify API_BASE_URL
- Check network connectivity
- Verify CORS settings

**3. Build Errors**
- Check TypeScript errors
- Verify environment variables
- Check dependencies

**4. Performance Issues**
- Check bundle size
- Verify image optimization
- Check API response times

---

## Future Enhancements

### Planned Features

1. **Progressive Web App (PWA)**
   - Offline support
   - Push notifications
   - Install prompt

2. **Real-Time Features**
   - WebSocket integration
   - Live chat
   - Real-time updates

3. **Advanced Analytics**
   - Custom dashboards
   - Export capabilities
   - Advanced filtering

4. **Mobile App**
   - React Native app
   - Native features
   - Push notifications

5. **Internationalization**
   - Multi-language support
   - Localization
   - Currency conversion

---

## Additional Resources

### Documentation

- `README.md` - Project overview
- `docs/HOOKS_MIGRATION_GUIDE.md` - SWR migration guide
- `docs/API_ENDPOINTS_WITH_ROLES.md` - Complete API documentation
- `features/*/README.md` - Feature-specific documentation

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [SWR Documentation](https://swr.vercel.app)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com)

---

## Support & Contact

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check documentation in `docs/` directory

---

**Document Version:** 1.0.0  
**Last Updated:** December 2024  
**Maintained By:** LocalPro Development Team

