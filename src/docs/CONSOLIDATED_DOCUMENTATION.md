# LocalPro Super App - Consolidated Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Implementation](#architecture--implementation)
3. [API System](#api-system)
4. [Authentication & Security](#authentication--security)
5. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
6. [Admin Panel System](#admin-panel-system)
7. [Communication System](#communication-system)
8. [Finance Management](#finance-management)
9. [Analytics Dashboard](#analytics-dashboard)
10. [Error Monitoring](#error-monitoring)
11. [Environment Configuration](#environment-configuration)
12. [Development Guidelines](#development-guidelines)
13. [Testing & Quality Assurance](#testing--quality-assurance)
14. [Deployment & Production](#deployment--production)
15. [Troubleshooting](#troubleshooting)

---

## Project Overview

### LocalPro Super App
A comprehensive Next.js application that serves as a proxy layer to an external API, providing a complete platform for service providers, suppliers, instructors, and clients to connect and transact.

### Key Features
- **Multi-role Platform**: 7 distinct user roles with specific capabilities
- **Marketplace Services**: Service booking and management
- **Job Board**: Job posting and application system
- **Supplies Management**: Equipment and material supply chain
- **Academy**: Educational content and course management
- **Equipment Rentals**: Rental booking and management
- **Communication System**: Real-time messaging and notifications
- **Analytics Dashboard**: Comprehensive business insights
- **Finance Management**: Revenue tracking and payment processing
- **Admin Panel**: Complete platform administration

---

## Architecture & Implementation

### Modern API Constants Architecture
The application follows a modern architecture pattern:

```
Client (Browser) → External API (https://localpro-super-app.onrender.com) → Response
   ↓                                ↓
API Constants                Bearer Token
Type Safety                  (stored in client cookie)
```

Notes:
- For Authentication, the client now calls the External API directly for send-code and verify-code. On successful verification, a non-httpOnly `api-token` cookie is set client-side to authorize subsequent requests directly to the External API.
- Legacy Next.js API routes may still exist for other features; auth no longer depends on them.

### Key Components
- **Frontend**: Next.js 14 with App Router
- **API Layer**: 176+ modernized API routes with constants
- **Authentication**: JWT-based session management
- **Type Safety**: Full TypeScript support with autocomplete
- **External API**: Proxy to https://localpro-super-app.onrender.com

### File Structure
```
src/
├── app/
│   ├── (dashboard)/          # Dashboard pages
│   ├── admin/               # Admin panel pages
│   ├── api/                 # API routes (176+ endpoints)
│   └── auth/                # Authentication pages
├── components/
│   ├── admin/               # Admin-specific components
│   ├── ui/                  # Reusable UI components
│   └── communication/       # Communication components
├── lib/
│   ├── api.ts               # API constants (200+ endpoints)
│   ├── api-auth-utils.ts    # Authentication utilities
│   ├── role-utils.ts        # Role-based access utilities
│   └── env.ts               # Environment configuration
└── types/                   # TypeScript type definitions
```

---

## API System

### API Constants Implementation
The application uses a modern API constants system with 200+ endpoint constants and 7 core authentication functions.

#### Core Functions
1. `makeAuthenticatedRequestWithEndpoint()` - Simple endpoints
2. `makeAuthenticatedRequestWithPath()` - Dynamic endpoints with parameters
3. `makePublicRequest()` - Public endpoints
4. `handleApiRoute()` - Advanced error handling
5. `createErrorResponse()` - Error response creation
6. `buildApiUrl()` - URL construction
7. `createAuthenticatedFetchOptions()` - Fetch options

#### Modern API Pattern
```typescript
// ✅ MODERN APPROACH: Using API Constants
import { makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  try {
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'marketplaceServices', // TypeScript autocomplete & validation
      { method: 'GET' }
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### API Endpoints by Category

#### Authentication & User Management
- `authMe`, `authProfile`, `authLogout`
- `usersById`

#### Marketplace Services
- `marketplaceServices`, `marketplaceMyServices`, `marketplaceBookings`
- `marketplaceServiceById`, `marketplaceBookingStatus`

#### Communication & Messaging
- `communicationConversations`, `communicationConversationsById`
- `communicationMessages`, `communicationMessageUpdate`, `communicationMessageDelete`
- `communicationNotifications`, `communicationUnreadCount`
- `communicationSearch`, `communicationTyping`

#### Job Board
- `jobs`, `jobsById`, `jobsApply`, `jobsMyApplications`

#### Academy & Learning
- `academyCourses`, `academyCourseById`, `academyEnroll`

#### Supplies & Equipment
- `supplies`, `suppliesById`, `suppliesMySupplies`, `suppliesOrder`

#### Equipment Rentals
- `rentals`, `rentalsById`, `rentalsMyRentals`, `rentalsBook`

#### Search & Discovery
- `search`, `searchSuggestions`, `searchAdvanced`
- `activitiesFeed`, `activitiesMy`

#### Analytics & Insights
- `analyticsOverview`, `analyticsUser`, `analyticsTrack`

### API Response Structure
All endpoints maintain consistent response format:
```typescript
{
  success: boolean,
  data: any,
  error?: string
}
```

---

## Authentication & Security

### Session Management
- **JWT Tokens**: Stored in httpOnly cookies
- **API Token Extraction**: Automatic extraction from session data
- **Bearer Token**: Used for API authentication
- **Middleware**: Handles route protection and authentication checks

### Security Features
- **Role-Based Access Control**: 7 distinct user roles
- **Route Protection**: Middleware-level protection
- **API Security**: Bearer token authentication
- **Input Validation**: Type-safe parameter handling
- **Error Handling**: Comprehensive error responses

### Authentication Flow
1. User logs in via `/api/auth/verify-code`
2. Session created with JWT token
3. API token extracted from session
4. Bearer token used for external API calls
5. Automatic token validation and refresh

---

## Role-Based Access Control (RBAC)

### User Roles

#### 1. CLIENT
- **Access Level**: Standard user
- **Capabilities**: Browse services, book services, purchase supplies, enroll in courses, rent equipment, apply for jobs
- **UI Access**: Dashboard, Profile, Settings, Messages, Notifications, Help

#### 2. PROVIDER
- **Access Level**: Service provider
- **Capabilities**: All CLIENT + Create/manage services, jobs, rentals, view analytics, manage earnings
- **UI Access**: All CLIENT + Marketplace management, Job posting, Rental management, Analytics, Finance

#### 3. SUPPLIER
- **Access Level**: Materials supplier
- **Capabilities**: All CLIENT + Create/manage supplies, manage inventory, process orders, view sales analytics
- **UI Access**: All CLIENT + Supplies management, Inventory tracking, Order processing, Analytics, Finance

#### 4. INSTRUCTOR
- **Access Level**: Educational content creator
- **Capabilities**: All CLIENT + Create/manage courses, upload content, manage students, view course analytics
- **UI Access**: All CLIENT + Academy management, Course creation, Student management, Analytics, Finance

#### 5. AGENCY_OWNER
- **Access Level**: Agency management
- **Capabilities**: All PROVIDER + Manage agency, add/remove providers, manage agency admins, agency analytics
- **UI Access**: All PROVIDER + Agency management, Agency providers, Agency analytics

#### 6. AGENCY_ADMIN
- **Access Level**: Limited agency administration
- **Capabilities**: All PROVIDER + Limited agency management, agency analytics
- **UI Access**: All PROVIDER + Limited agency management features

#### 7. ADMIN
- **Access Level**: Full platform administration
- **Capabilities**: Full access to all features, manage all users, platform analytics, system settings
- **UI Access**: All features + Admin dashboard, User management, Platform analytics, System settings

### Permission Matrix
| Feature | CLIENT | PROVIDER | SUPPLIER | INSTRUCTOR | AGENCY_OWNER | AGENCY_ADMIN | ADMIN |
|---------|--------|----------|----------|------------|--------------|--------------|-------|
| **Browse Services** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create Services** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Browse Jobs** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create Jobs** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Browse Supplies** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create Supplies** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Browse Courses** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create Courses** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Browse Rentals** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create Rentals** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **View Analytics** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manage Agency** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Admin Access** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Role Guard Components
```tsx
// Basic role protection
<AdminOnly fallback={<div>Access denied</div>}>
  <AdminPanel />
</AdminOnly>

// Custom role checking
<RoleGuard 
  roles={['provider', 'agency_owner']} 
  permissions={['create_service']}
  fallback={<div>Insufficient permissions</div>}
>
  <CreateServiceForm />
</RoleGuard>

// Hook for role access
const { isProvider, canCreateServices, canViewAnalytics } = useRoleAccess();
```

---

## Admin Panel System

### Admin Panel Features
- **User Management**: Complete user administration
- **Marketplace Management**: Service and job oversight
- **Analytics Dashboard**: Platform-wide analytics
- **Error Monitoring**: Real-time error tracking
- **Audit Logs**: Comprehensive activity logging
- **System Settings**: Platform configuration

### Admin Component Patterns
- **PageHeader**: Consistent page headers with gradient text
- **StatsCard**: Financial metrics display with icons and trends
- **FilterSection**: Advanced filtering controls
- **DataTable**: Sortable tables with pagination
- **StatusBadge**: Color-coded status indicators
- **ActionButton**: Consistent button styling
- **Modal**: Reusable modal components
- **FormInput**: Standardized form elements
- **LoadingState**: Loading indicators
- **ErrorState**: Error handling displays

### Admin Style Guide
- **Color Palette**: Blue primary, green success, yellow warning, red error
- **Typography**: Consistent font sizes and weights
- **Spacing**: 4px grid system with `space-y-4` containers
- **Icons**: Lucide React icons with consistent sizing
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Proper focus states and keyboard navigation

### Admin API Endpoints
- **Analytics**: `/api/admin/analytics/*`
- **Error Monitoring**: `/api/admin/error-monitoring/*`
- **Audit Logs**: `/api/admin/audit-logs/*`
- **User Management**: `/api/admin/users/*`
- **System Settings**: `/api/admin/settings/*`

---

## Communication System

### Features
- **Real-time Messaging**: WebSocket-based communication
- **Conversation Management**: Multi-user conversations
- **Message Operations**: Send, edit, delete messages
- **Typing Indicators**: Real-time typing status
- **Search**: Full-text message search
- **Notifications**: Push and email notifications
- **File Sharing**: Image and document sharing

### API Endpoints
- `communicationConversations` - Get conversations
- `communicationMessages` - Send/receive messages
- `communicationMessageUpdate` - Edit messages
- `communicationMessageDelete` - Delete messages
- `communicationNotifications` - Get notifications
- `communicationSearch` - Search messages
- `communicationTyping` - Typing indicators

### Real-time Features
- **WebSocket Connection**: Persistent connection for real-time updates
- **Event Types**: Message sent, message updated, typing started/stopped
- **Connection Management**: Automatic reconnection and error handling
- **Message Synchronization**: Real-time message updates across clients

### UI Components
- **ConversationList**: List of user conversations
- **MessageList**: Messages within a conversation
- **MessageInput**: Message composition
- **TypingIndicator**: Real-time typing status
- **NotificationBadge**: Unread message count

---

## Finance Management

### Features
- **Financial Overview**: Revenue, expenses, profit tracking
- **Transaction Management**: Complete transaction history
- **Expense Management**: Business expense tracking
- **Withdrawal System**: Multiple withdrawal methods
- **Wallet Settings**: Currency and notification configuration
- **Financial Reports**: Comprehensive reporting

### API Endpoints
- `GET /api/finance/overview` - Financial overview
- `GET /api/finance/transactions` - Transaction list
- `GET /api/finance/earnings` - Earnings data
- `GET /api/finance/expenses` - Expense list
- `POST /api/finance/expenses` - Add expense
- `POST /api/finance/withdraw` - Request withdrawal
- `PUT /api/finance/withdrawals/:id/process` - Process withdrawal
- `GET /api/finance/tax-documents` - Tax documents
- `GET /api/finance/reports` - Financial reports

### Components
- **FinanceStatsCard**: Financial metrics display
- **FinanceChart**: Chart components (placeholder for future integration)
- **FinanceFilters**: Advanced filtering controls
- **AddExpenseModal**: Expense creation modal
- **WithdrawalRequestModal**: Withdrawal request modal
- **FinanceTransactionsTable**: Transaction display table
- **FinanceWalletSettings**: Wallet configuration form

### Data Models
```typescript
interface FinanceOverview {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueGrowth: number;
  expenseGrowth: number;
  profitGrowth: number;
  marginGrowth: number;
}

interface Transaction {
  id: string;
  description: string;
  reference: string;
  type: 'revenue' | 'expense' | 'withdrawal';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  category?: string;
}
```

---

## Analytics Dashboard

### Features
- **Overview Analytics**: Platform-wide metrics
- **User Analytics**: User behavior and engagement
- **Revenue Analytics**: Financial performance tracking
- **Performance Analytics**: System performance metrics
- **Real-time Analytics**: Live data updates
- **Custom Time Periods**: Flexible date range selection

### API Endpoints
- `GET /api/admin/analytics/overview` - Overview metrics
- `GET /api/admin/analytics/users` - User analytics
- `GET /api/admin/analytics/revenue` - Revenue analytics
- `GET /api/admin/analytics/performance` - Performance metrics
- `GET /api/admin/analytics/conversion` - Conversion analytics

### Dashboard Views
- **Overview**: Key metrics and trends
- **Real-time**: Live activity monitoring
- **Performance**: System performance metrics
- **User Behavior**: User engagement analytics
- **Revenue**: Financial performance tracking
- **Conversion**: Conversion rate analysis

### Components
- **AnalyticsStatsCard**: Metric display cards
- **AnalyticsChart**: Chart components
- **TimePeriodFilter**: Date range selection
- **ViewSelector**: Dashboard view switching
- **RealTimeIndicator**: Live data status

---

## Error Monitoring

### Features
- **Real-time Error Tracking**: Live error detection
- **Error Filtering**: Advanced filtering by level, status, environment
- **Error Resolution**: Mark errors as resolved/unresolved
- **Error Analytics**: Comprehensive error statistics
- **Dashboard Integration**: Error monitoring widget
- **Export Functionality**: CSV export for analysis

### API Endpoints
- `GET /api/admin/error-monitoring/stats` - Error statistics
- `GET /api/admin/error-monitoring/unresolved` - Unresolved errors
- `GET /api/admin/error-monitoring/:errorId` - Error details
- `PATCH /api/admin/error-monitoring/:errorId/resolve` - Resolve error
- `GET /api/admin/error-monitoring/dashboard/summary` - Dashboard summary

### Error Types
- **Critical**: System-breaking errors
- **Error**: Application errors
- **Warning**: Non-critical issues
- **Info**: Informational messages

### Components
- **ErrorMonitoringWidget**: Dashboard widget
- **ErrorList**: Error listing with filtering
- **ErrorDetails**: Detailed error information
- **ErrorFilters**: Advanced filtering controls
- **ErrorStats**: Error statistics display

---

## Environment Configuration

### Environment Variables
The application uses Next.js-compliant environment variable handling with proper client/server separation.

#### Required Variables
```env
JWT_SECRET="your-super-secret-jwt-key-here"
SESSION_SECRET="your-session-secret-key-here"
API_BASE_URL="https://localpro-super-app.onrender.com"
```

#### Optional Variables
```env
NEXT_PUBLIC_APP_NAME="LocalPro"
NEXT_PUBLIC_APP_VERSION="1.0.0"
DEBUG="true"
ENABLE_MOCK_DATA="true"
FEATURE_MESSAGING="true"
FEATURE_PAYMENTS="true"
```

### Environment Files
- `env.example` - Template with all variables
- `env.development` - Development-specific template
- `.env.local` - Your actual environment variables (never commit)

### Type-Safe Access
```typescript
import { 
  APP_CONFIG, 
  API_CONFIG, 
  AUTH_CONFIG, 
  FEATURE_FLAGS 
} from '@/lib/env';

// Type-safe access
console.log(APP_CONFIG.name);
console.log(API_CONFIG.baseUrl);
console.log(AUTH_CONFIG.jwtSecret);
console.log(FEATURE_FLAGS.messaging);
```

---

## Development Guidelines

### Code Quality Standards
- **TypeScript**: Full type safety with strict mode
- **ESLint**: Zero linting errors required
- **Prettier**: Consistent code formatting
- **Testing**: Comprehensive test coverage
- **Documentation**: Complete API and component documentation

### Component Development
- **Reusable Components**: Modular, composable components
- **Props Interface**: Clear TypeScript interfaces
- **Error Handling**: Comprehensive error boundaries
- **Loading States**: Proper loading indicators
- **Accessibility**: WCAG compliance

### API Development
- **API Constants**: Use endpoint constants for all API calls
- **Error Handling**: Standardized error responses
- **Authentication**: Proper session and token handling
- **Validation**: Input validation and sanitization
- **Documentation**: Complete endpoint documentation

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user workflow testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Authentication and authorization testing

---

## Testing & Quality Assurance

### Test Coverage
- **Unit Tests**: 50+ test cases for role utilities
- **Component Tests**: All admin components tested
- **API Tests**: All 176+ endpoints tested
- **Integration Tests**: Complete workflow testing
- **E2E Tests**: User journey testing

### Quality Metrics
- **Code Quality**: 100% TypeScript coverage
- **Linting**: Zero ESLint errors
- **Testing**: Comprehensive test coverage
- **Performance**: Sub-millisecond operation times
- **Security**: Enterprise-grade authentication

### Test Files
- `src/lib/__tests__/role-utils.test.ts` - Role utility tests
- `src/lib/__tests__/analytics-api.test.ts` - Analytics API tests
- `src/components/admin/__tests__/` - Admin component tests
- `src/app/admin/__tests__/` - Admin page tests

---

## Deployment & Production

### Environment Setup
1. **Copy Environment Template**:
   ```bash
   cp env.example .env.local
   ```

2. **Fill in Values**:
   - Set required environment variables
   - Configure API endpoints
   - Set up authentication secrets

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

### Production Deployment
- **Platform**: Vercel, Netlify, or Docker
- **Environment Variables**: Set in hosting platform
- **Database**: External API integration
- **Monitoring**: Error tracking and analytics
- **Security**: HTTPS enforcement and CORS

### Performance Optimization
- **Caching**: Response caching with API constants
- **Code Splitting**: Dynamic imports for better performance
- **Image Optimization**: Next.js image optimization
- **Bundle Analysis**: Webpack bundle analyzer
- **CDN**: Content delivery network integration

---

## Troubleshooting

### Common Issues

#### 1. Authentication Errors
```
Error: Environment variable JWT_SECRET is required but not set
```
**Solution**: Add the missing variable to your `.env.local` file

#### 2. API Connection Issues
```
Error: Unable to connect to external service
```
**Solution**: Check API_BASE_URL and network connectivity

#### 3. Role Access Issues
```
Error: Insufficient permissions
```
**Solution**: Verify user role and permission configuration

#### 4. Environment Loading Issues
```
Error: process.env is undefined
```
**Solution**: Ensure you're using the correct environment file name (`.env.local`)

### Debug Mode
```typescript
import { getEnvironmentInfo } from '@/lib/env';

// Get environment information for debugging
console.log(getEnvironmentInfo());
```

### Support Resources
- **Documentation**: Complete API and component documentation
- **Test Suite**: Comprehensive test coverage
- **Error Logging**: Detailed error tracking
- **Community**: Development team support

---

## Conclusion

The LocalPro Super App represents a comprehensive, modern web application built with Next.js 14, featuring:

- **176+ API endpoints** with modern constants integration
- **7 distinct user roles** with granular permissions
- **Real-time communication** system
- **Comprehensive admin panel** with analytics and monitoring
- **Finance management** system
- **Role-based access control** with security
- **Type-safe development** with TypeScript
- **Enterprise-grade architecture** with API constants

The application is production-ready with comprehensive documentation, testing, and security measures in place.

---

*This documentation consolidates all project documentation into a single, comprehensive reference guide for developers, administrators, and stakeholders.*
