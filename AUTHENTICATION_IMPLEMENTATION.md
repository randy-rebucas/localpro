# Authentication Implementation Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication Methods](#authentication-methods)
3. [Token Management](#token-management)
4. [Session Management](#session-management)
5. [Security Features](#security-features)
6. [API Integration](#api-integration)
7. [Route Protection](#route-protection)
8. [User Flows](#user-flows)
9. [Error Handling](#error-handling)
10. [Code Structure](#code-structure)
11. [Configuration](#configuration)

---

## Overview

The authentication system implements a secure, multi-method authentication flow supporting both phone number and email-based authentication. The system uses JWT tokens (access and refresh tokens) for stateless authentication, with automatic token refresh and session management.

### Key Features
- **Dual Authentication Methods**: Phone OTP and Email/Password with OTP
- **JWT Token-Based**: Access tokens and refresh tokens
- **Automatic Token Refresh**: Tokens are refreshed before expiration
- **Session Tracking**: User activity tracking with timeout detection
- **CSRF Protection**: Cross-site request forgery protection
- **Rate Limiting**: Client-side request throttling
- **Secure Cookie Storage**: HttpOnly-like protection via SameSite and Secure flags

---

## Authentication Methods

### 1. Phone Number Authentication

**Flow:**
1. User selects "Phone" tab (default is "Email")
2. User enters phone number
3. System sends 6-digit OTP via SMS
4. User enters OTP code in 6 separate input fields
5. System verifies code and returns access/refresh tokens
6. User redirected based on profile completion status

**Implementation:**
- **Component**: `src/app/login/page.tsx`
- **Default State**: Email method is default (`authMethod: "email"`)
- **Phone Step**: `step: "phone"` → `step: "code"`
- **API Endpoints**:
  - `POST /api/auth/send-code` - Send OTP to phone
  - `POST /api/auth/verify-code` - Verify OTP and authenticate

**Code Example:**
```typescript
// Send verification code
const response = await authApi.sendCode(phoneNumber);

// Verify code
const response = await authApi.verifyCode(code, phoneNumber);
// Returns: { success, token, refreshToken, user, isNewUser }
```

**Features:**
- Phone number validation using `libphonenumber-js`
- 60-second countdown timer for resend
- Automatic user registration for new phone numbers
- "Change Phone Number" button to go back to phone entry
- Separate form handling for phone OTP (`codeForm`)

**OTP Input Features:**
- 6 individual input fields (one per digit)
- Auto-focus on first input when step changes
- Auto-advance to next input on digit entry
- Paste support: paste 6-digit code into first input, automatically distributes
- Keyboard navigation:
  - Arrow keys to move between inputs
  - Backspace to clear and move to previous input
- Real-time validation: clears errors when valid code entered
- Visual feedback: large (w-12 h-12), centered, semibold text
- `autoComplete="one-time-code"` on first input for SMS autofill
- Separate form instances for phone (`codeForm`) and email (`emailOtpForm`)

### 2. Email/Password Authentication

**Flow:**
1. User enters email address (default step: `email-check`)
2. System checks if email exists and has password
3. **If email exists with password:**
   - User enters password (`step: "email-login"`)
   - System sends OTP to email
   - User verifies OTP (`step: "email-otp"`)
4. **If email exists without password:**
   - User sets password with confirmation (`step: "email-setup-password"`)
   - System automatically logs in with new password
   - System sends OTP to email
   - User verifies OTP (`step: "email-otp"`)
5. **If email doesn't exist:**
   - User registers with email, password, first name, last name (`step: "email-register"`)
   - System sends OTP to email
   - User verifies OTP (`step: "email-otp"`)
6. System returns access/refresh tokens
7. User redirected based on profile completion status

**Implementation:**
- **Component**: `src/app/login/page.tsx`
- **Default State**: Email method is default (`authMethod: "email"`, `step: "email-check"`)
- **Steps**: `email-check` → `email-login` | `email-setup-password` | `email-register` → `email-otp`
- **API Endpoints**:
  - `POST /api/auth/check-email` - Check email status
  - `POST /api/auth/login-email` - Login with email/password
  - `POST /api/auth/register-email` - Register new user
  - `POST /api/auth/set-password` - Set password for existing user
  - `POST /api/auth/verify-email-otp` - Verify email OTP

**Code Example:**
```typescript
// Check email status
const status = await authApi.checkEmailStatus({ email });
// Returns: { success, exists, hasPassword }

// Login with email/password
await authApi.loginEmail({ email, password });

// Register new user
await authApi.registerEmail({ email, password, firstName, lastName });

// Verify email OTP
const response = await authApi.verifyEmailOtp({ email, otpCode });
// Returns: { success, token, refreshToken, user, isNewUser }
```

**Features:**
- Email validation with Zod schema
- Password strength requirements (minimum 8 characters)
- Password confirmation matching with validation
- Automatic OTP sending after password verification
- Support for users with email but no password set
- "Use a different email" button on login/register steps
- "Switch to Phone Login" option in password setup step
- "Change Email" button on OTP verification step
- Separate form handling for email OTP (`emailOtpForm`)
- Email resend shows message to go back and login again (no direct resend for email OTP)

---

## Token Management

### Access Token
- **Storage**: Cookie (`auth_token`)
- **Expiration**: Set by backend (typically 15-30 minutes)
- **Usage**: Included in `Authorization: Bearer <token>` header for all API requests
- **Auto-Refresh**: Automatically refreshed 5 minutes before expiration

### Refresh Token
- **Storage**: Cookie (`refresh_token`)
- **Expiration**: Set by backend (typically 30 days)
- **Usage**: Used to obtain new access tokens when current token expires
- **Security**: Never sent with regular API requests, only to refresh endpoint

### Token Refresh Flow

**Implementation**: `src/lib/utils/token-refresh.ts`

```typescript
// Initialize token tracking after login
initializeTokenTracking(accessToken, refreshToken);

// Get valid token (auto-refreshes if needed)
const token = await getValidToken();
```

**How It Works:**
1. Token expiry is decoded from JWT payload
2. Timer is set to refresh 5 minutes before expiration
3. When token expires or is about to expire:
   - Refresh token is sent to `/api/auth/refresh`
   - New access and refresh tokens are received
   - Tokens are stored in cookies
   - New expiry timer is set

**Automatic Refresh:**
- Tokens are checked before each API request
- If token is expiring soon (< 5 minutes), it's refreshed automatically
- Failed refresh attempts redirect to login

### Post-Authentication Initialization

After successful authentication (both phone and email flows), the following initialization sequence occurs:

```typescript
// 1. Store tokens in cookies
setAuthToken(response.token);
setRefreshToken(response.refreshToken);

// 2. Initialize token refresh tracking
initializeTokenTracking(response.token, response.refreshToken);

// 3. Initialize session tracking
initializeSession();

// 4. Store user data in localStorage
localStorage.setItem("user", JSON.stringify(response.user));
if (response.isNewUser) {
  localStorage.setItem("isNewUser", "true");
}

// 5. Redirect based on profile completion
if (response.isNewUser || !response.user.firstName || !response.user.lastName) {
  router.push("/onboarding");
} else {
  router.push("/dashboard");
}
```

**Initialization Order:**
1. Token storage (cookies) - Immediate persistence
2. Token refresh tracking - Automatic refresh setup
3. Session tracking - Activity monitoring
4. User data storage (localStorage) - Client-side access
5. Navigation - Redirect to appropriate page

### Token Storage

**Implementation**: `src/lib/utils/cookies.ts`

```typescript
// Set tokens
setAuthToken(token);
setRefreshToken(refreshToken);

// Get tokens
const token = getAuthToken();
const refreshToken = getRefreshToken();

// Remove tokens
removeAllTokens();
```

**Cookie Configuration:**
- **Expiration**: 30 days
- **Path**: `/` (available site-wide)
- **SameSite**: `Strict` (production) / `Lax` (development)
- **Secure**: Enabled in production (HTTPS only)

### User Data Storage

**Implementation**: `localStorage` (client-side only)

After successful authentication:
```typescript
// Store user object
localStorage.setItem("user", JSON.stringify(response.user));

// Store new user flag for onboarding flow
if (response.isNewUser) {
  localStorage.setItem("isNewUser", "true");
} else {
  localStorage.removeItem("isNewUser");
}
```

**Stored Data:**
- `user` - Complete user object (JSON stringified)
- `isNewUser` - Boolean flag for onboarding redirect logic

**Usage:**
- Client-side user data access
- Onboarding flow detection
- Profile completion checks

---

## Session Management

**Implementation**: `src/lib/utils/session-manager.ts`

### Features
- **Activity Tracking**: Tracks user interactions (mouse, keyboard, scroll, touch)
- **Session Timeout**: 30 minutes of inactivity
- **Session Duration**: Tracks total session time
- **Auto-Logout**: Redirects to login on session expiry

### Usage

```typescript
// Initialize session tracking (called after login)
initializeSession();

// Track activity manually (usually automatic)
trackActivity();

// Check if session expired
if (isSessionExpired()) {
  // Redirect to login
}

// Get session duration
const duration = getSessionDuration(); // milliseconds

// Clear session data
clearSession();
```

### Activity Events Tracked
- `mousedown`
- `mousemove`
- `keypress`
- `scroll`
- `touchstart`
- `click`

### Session Expiry Check
- Runs every 60 seconds
- Checks if last activity was more than 30 minutes ago
- Redirects to `/login?session=expired` if expired

---

## Security Features

### 1. CSRF Protection

**Implementation**: `src/lib/utils/csrf.ts`

- CSRF tokens generated for state-changing requests (POST, PUT, PATCH, DELETE)
- Token stored in `sessionStorage`
- Token sent in `X-CSRF-Token` header
- Only applied to same-origin requests

```typescript
// Get CSRF token (auto-generated if not exists)
const token = getCsrfToken();

// Clear CSRF token
clearCsrfToken();
```

### 2. Rate Limiting

**Implementation**: `src/lib/utils/rate-limiter.ts`

- Client-side request throttling
- Prevents excessive API calls
- Configurable per endpoint

### 3. Cookie Security

- **SameSite**: Prevents CSRF attacks
- **Secure Flag**: HTTPS-only in production
- **HttpOnly-like**: Cookies managed server-side (via middleware)
- **Path Restriction**: Cookies available site-wide but scoped to path

### 4. Token Security

- Tokens stored in secure cookies (not localStorage)
- Automatic token refresh prevents token exposure
- Failed refresh attempts clear all tokens
- Tokens never logged or exposed in error messages

### 5. Input Validation

- Phone numbers validated with `libphonenumber-js`
- Email addresses validated with Zod schema
- Password strength requirements enforced
- OTP codes validated (6 digits, numeric only)

---

## API Integration

**Implementation**: `src/lib/api/client.ts`

### Automatic Token Injection

All API requests automatically include:
- `Authorization: Bearer <token>` header
- `X-CSRF-Token` header (for state-changing requests)
- Automatic token refresh before expiration

### Error Handling

**401 Unauthorized:**
1. Attempts to refresh token
2. Retries original request with new token
3. If refresh fails, clears tokens and redirects to login

**Other Errors:**
- Error messages sanitized (no sensitive data exposed)
- User-friendly error messages
- Detailed logging in development mode

### API Client Usage

```typescript
import { apiClient } from '@/lib/api/client';

// All methods automatically include auth token
const data = await apiClient.get('/endpoint');
const result = await apiClient.post('/endpoint', { data });
const updated = await apiClient.put('/endpoint', { data });
const patched = await apiClient.patch('/endpoint', { data });
await apiClient.delete('/endpoint');
```

---

## Route Protection

**Implementation**: `middleware.ts`

### Protected Routes
- `/dashboard/*` - All dashboard routes require authentication

### Public Routes
- `/login` - Login page
- `/onboarding` - Onboarding page

### Middleware Behavior

1. **Protected Route Access:**
   - Checks for `auth_token` cookie
   - If missing, redirects to `/login?redirect=<original-url>`
   - Preserves original URL for post-login redirect

2. **Public Route Access:**
   - If user has valid token and visits `/login`, redirects to `/dashboard`
   - Prevents authenticated users from accessing login page

3. **Route Matching:**
   - Matches all routes except:
     - `/api/*` (API routes)
     - `/_next/static/*` (static files)
     - `/_next/image/*` (image optimization)
     - `/favicon.ico`
     - Public static files (images)

### Usage

```typescript
// Middleware automatically runs on all matching routes
// No additional code needed in components
```

---

## User Flows

### New User Registration (Phone)

1. User switches to "Phone" tab
2. User enters phone number
3. System sends OTP via SMS
4. User enters 6-digit OTP in individual input fields
5. System creates account and returns tokens
6. User data stored in localStorage
7. Token refresh and session tracking initialized
8. User redirected to `/onboarding` (if `isNewUser` or missing firstName/lastName) or `/dashboard`

### New User Registration (Email)

1. User enters email (default step)
2. System detects email doesn't exist (`exists: false`)
3. User enters: first name, last name, email, password
4. System sends OTP to email
5. User enters 6-digit OTP in individual input fields
6. System creates account and returns tokens
7. User data stored in localStorage with `isNewUser: true`
8. Token refresh and session tracking initialized
9. User redirected to `/onboarding` (if `isNewUser` or missing firstName/lastName) or `/dashboard`

### Existing User Login (Phone)

1. User switches to "Phone" tab
2. User enters phone number
3. System sends OTP via SMS
4. User enters 6-digit OTP in individual input fields
5. System verifies and returns tokens
6. User data stored in localStorage
7. Token refresh and session tracking initialized
8. User redirected to `/dashboard` (existing users with complete profile)

### Existing User Login (Email with Password)

1. User enters email (default step)
2. System detects email exists with password (`exists: true, hasPassword: true`)
3. User enters password
4. System sends OTP to email
5. User enters 6-digit OTP in individual input fields
6. System verifies and returns tokens
7. User data stored in localStorage
8. Token refresh and session tracking initialized
9. User redirected to `/dashboard` (existing users with complete profile)

### Existing User Login (Email without Password)

1. User enters email (default step)
2. System detects email exists but no password (`exists: true, hasPassword: false`)
3. User sets password with confirmation
4. System automatically logs in with new password
5. System sends OTP to email
6. User enters 6-digit OTP in individual input fields
7. System verifies and returns tokens
8. User data stored in localStorage
9. Token refresh and session tracking initialized
10. User redirected to `/dashboard` (existing users with complete profile)

---

## Error Handling

### Error Types

1. **Network Errors** (status: 0)
   - Message: "Network error - Please check your connection and try again."

2. **Validation Errors** (status: 400)
   - Invalid phone number format
   - Invalid email format
   - Invalid OTP format
   - Password requirements not met

3. **Authentication Errors** (status: 401)
   - Invalid credentials
   - Expired OTP
   - Invalid verification code

4. **Not Found Errors** (status: 404)
   - Phone number not found
   - Email not found

5. **Rate Limit Errors** (status: 429)
   - Too many requests
   - Resend code too soon

6. **Server Errors** (status: 500+)
   - Server error message
   - Database errors

### Error Code Mapping

**Phone OTP Errors:**
- `MISSING_REQUIRED_FIELDS` - Phone number and code required
- `INVALID_PHONE_FORMAT` - Invalid phone format
- `INVALID_CODE_FORMAT` - Code must be 6 digits
- `INVALID_VERIFICATION_CODE` - Invalid or expired code
- `VERIFICATION_SERVICE_ERROR` - SMS service error
- `DATABASE_UNAVAILABLE` - Database unavailable
- `DATABASE_ERROR` - Database error
- `INTERNAL_SERVER_ERROR` - Server error

**Email OTP Errors:**
- `MISSING_REQUIRED_FIELDS` - Email and code required
- `INVALID_EMAIL_FORMAT` - Invalid email format
- `INVALID_CODE_FORMAT` - Code must be 6 digits
- `INVALID_VERIFICATION_CODE` - Invalid or expired code
- `VERIFICATION_SERVICE_ERROR` - Email service error
- `DATABASE_UNAVAILABLE` - Database unavailable
- `DATABASE_ERROR` - Database error
- `INTERNAL_SERVER_ERROR` - Server error

**Email Login Errors:**
- `PASSWORD_NOT_SET` - Email exists but password not set
- `NO_PASSWORD` - Email exists but password not set (alternative)
- `INVALID_EMAIL_OR_PASSWORD` - Invalid credentials

### Error Display

Errors are displayed in the UI with:
- Red background (`bg-destructive/10`)
- Error message text in destructive color
- User-friendly messages (no technical details)
- Automatic error clearing on valid input
- Error messages mapped from API error codes
- Fallback messages based on HTTP status codes
- Network error detection (status: 0)
- Rate limit handling (status: 429)
- Server error handling (status: 500+)

### Error Handling Flow

1. **API Error Received** - Error object with `message`, `status`, `code`
2. **Error Code Mapping** - Map specific error codes to user-friendly messages
3. **Status Code Fallback** - Use HTTP status codes if no error code
4. **Display Error** - Show in red error box below form
5. **Auto-Clear** - Clear error when user enters valid input
6. **Retry Allowed** - User can retry after fixing the issue

---

## Code Structure

### Core Files

```
src/
├── app/
│   └── login/
│       └── page.tsx              # Login page component (1522 lines)
│                                  # - Multi-step form handling
│                                  # - Phone and email auth flows
│                                  # - OTP input components
│                                  # - Form validation with Zod
│                                  # - Error handling
│                                  # - Token and session initialization
├── lib/
│   ├── api/
│   │   ├── auth.ts               # Authentication API endpoints
│   │   └── client.ts             # API client with token injection
│   └── utils/
│       ├── cookies.ts            # Cookie management
│       ├── token-refresh.ts      # Token refresh logic
│       ├── session-manager.ts    # Session tracking
│       ├── csrf.ts               # CSRF protection
│       └── two-factor.ts         # 2FA utilities (future)
└── middleware.ts                 # Route protection middleware
```

### Form State Management

The login page uses React Hook Form with multiple form instances:

- `phoneForm` - Phone number entry
- `codeForm` - Phone OTP verification
- `emailCheckForm` - Email status check
- `emailLoginForm` - Email/password login
- `emailRegisterForm` - New user registration
- `emailOtpForm` - Email OTP verification
- `emailSetupPasswordForm` - Password setup for existing users

### Step Management

**Steps:**
- `phone` - Phone number entry
- `code` - Phone OTP verification
- `email-check` - Email entry (default)
- `email-login` - Password entry for existing users
- `email-register` - Registration form
- `email-setup-password` - Password setup
- `email-otp` - Email OTP verification

**Step Transitions:**
- Controlled by `step` state
- Reset on auth method change
- Form resets on step changes
- Error clearing on step transitions

### Key Components

#### Login Page (`src/app/login/page.tsx`)
- Multi-step form handling with state management
- Phone and email authentication flows with tab switching
- Separate OTP forms for phone (`codeForm`) and email (`emailOtpForm`)
- 6-digit OTP input with individual input fields:
  - Auto-focus on first input when step changes
  - Auto-advance to next input on digit entry
  - Paste support (pastes into first input, distributes to all)
  - Keyboard navigation (arrow keys, backspace)
  - Real-time validation with error clearing
  - Visual feedback with large, centered inputs
- Form validation with Zod schemas:
  - `phoneSchema` - Phone number validation
  - `codeSchema` - 6-digit numeric code
  - `emailCheckSchema` - Email validation
  - `emailLoginSchema` - Email and password
  - `emailRegisterSchema` - Registration fields
  - `emailOtpSchema` - Email OTP code
  - `emailSetupPasswordSchema` - Password with confirmation
- Error handling and display with user-friendly messages
- Loading states on all async operations
- 60-second countdown timers for resend functionality
- Dynamic title and description based on current step
- User data storage in localStorage (`user`, `isNewUser`)
- Automatic token and session initialization after successful auth

#### Auth API (`src/lib/api/auth.ts`)
- Type-safe API methods
- Error handling and mapping
- Response validation
- Interface definitions

#### API Client (`src/lib/api/client.ts`)
- Automatic token injection
- Token refresh on 401
- CSRF token handling
- Rate limiting
- Error sanitization
- Request/response logging

#### Cookie Utils (`src/lib/utils/cookies.ts`)
- Secure cookie management
- Token storage/retrieval
- Cookie expiration handling

#### Token Refresh (`src/lib/utils/token-refresh.ts`)
- JWT token decoding
- Expiry detection
- Automatic refresh scheduling
- Token validation

#### Session Manager (`src/lib/utils/session-manager.ts`)
- Activity tracking
- Session timeout detection
- Session duration calculation
- Auto-logout on expiry

---

## Configuration

### Environment Variables

```env
# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api

# Environment
NODE_ENV=development|production
```

### Token Configuration

**Access Token:**
- Expiration: Set by backend (typically 15-30 minutes)
- Refresh threshold: 5 minutes before expiration
- Storage: Cookie (`auth_token`)

**Refresh Token:**
- Expiration: Set by backend (typically 30 days)
- Storage: Cookie (`refresh_token`)

### Session Configuration

**Session Timeout:**
- Inactivity timeout: 30 minutes
- Activity check interval: 60 seconds

**Cookie Configuration:**
- Expiration: 30 days
- SameSite: `Strict` (production) / `Lax` (development)
- Secure: Enabled in production

### Rate Limiting

- Client-side throttling per endpoint
- Configurable in `src/lib/utils/rate-limiter.ts`

---

## Best Practices

### Security
1. **Never store tokens in localStorage** - Use secure cookies
2. **Always validate tokens** - Check expiry before use
3. **Sanitize error messages** - Never expose sensitive data
4. **Use HTTPS in production** - Required for secure cookies
5. **Implement CSRF protection** - For state-changing requests

### User Experience
1. **Clear error messages** - User-friendly, actionable errors with status code mapping
2. **Loading states** - Show progress during async operations (buttons disabled, loading text)
3. **Auto-focus** - Focus first input on step changes and page load
4. **Paste support** - Allow pasting 6-digit OTP codes (auto-distributes to inputs)
5. **Resend functionality** - Allow code resend with 60-second countdown timer
6. **Navigation options** - "Change Phone/Email" buttons, "Use different email", "Switch to Phone Login"
7. **Dynamic UI** - Title and description change based on current step
8. **Form persistence** - Email/phone stored in state across steps
9. **Error recovery** - Clear errors on valid input, allow retry on failure
10. **Step indicators** - Visual feedback through card title and description

### Code Quality
1. **Type safety** - Use TypeScript interfaces
2. **Error handling** - Comprehensive error handling
3. **Code organization** - Separate concerns (API, utils, components)
4. **Reusability** - Shared utilities and components
5. **Documentation** - Inline comments and type definitions

---

## Troubleshooting

### Common Issues

**1. Token not refreshing**
- Check token expiry time in JWT payload
- Verify refresh token is stored correctly
- Check network requests to refresh endpoint

**2. Session expiring too quickly**
- Verify activity tracking is working
- Check session timeout configuration
- Ensure activity events are being captured

**3. CSRF token errors**
- Verify CSRF token is generated
- Check token is sent in correct header
- Ensure same-origin request detection works

**4. Cookie not setting**
- Check browser cookie settings
- Verify HTTPS in production
- Check SameSite cookie policy

**5. Redirect loops**
- Check middleware logic
- Verify token validation
- Check route matching configuration

**6. OTP input not working**
- Verify form state synchronization
- Check codeDigits state updates
- Ensure input refs are properly assigned
- Check validation triggers

**7. Form validation errors**
- Verify Zod schema matches API requirements
- Check form mode settings (onChange vs onSubmit)
- Ensure form reset on step changes
- Verify error clearing logic

---

## Future Enhancements

### Planned Features
1. **Two-Factor Authentication (2FA)**
   - TOTP support via authenticator apps
   - Backup codes
   - QR code generation

2. **Social Authentication**
   - Google OAuth
   - Facebook OAuth
   - Apple Sign-In

3. **Password Reset**
   - Email-based password reset
   - Security questions
   - Account recovery

4. **Device Management**
   - Trusted devices
   - Device tracking
   - Remote logout

5. **Session Management**
   - Active sessions list
   - Session termination
   - Session history

---

## API Reference

### Authentication Endpoints

#### Send Phone Code
```typescript
POST /api/auth/send-code
Body: { phoneNumber: string }
Response: { token: string, user: User }
```

#### Verify Phone Code
```typescript
POST /api/auth/verify-code
Body: { phoneNumber: string, code: string }
Response: { 
  success: boolean,
  token: string,
  refreshToken: string,
  user: User,
  isNewUser: boolean
}
```

#### Check Email Status
```typescript
POST /api/auth/check-email
Body: { email: string }
Response: { 
  success: boolean,
  exists: boolean,
  hasPassword: boolean
}
```

#### Login with Email
```typescript
POST /api/auth/login-email
Body: { email: string, password: string }
Response: { success: boolean, message: string }
```

#### Register with Email
```typescript
POST /api/auth/register-email
Body: { 
  email: string,
  password: string,
  firstName: string,
  lastName: string
}
Response: { success: boolean, message: string }
```

#### Verify Email OTP
```typescript
POST /api/auth/verify-email-otp
Body: { email: string, otpCode: string }
Response: { 
  success: boolean,
  token: string,
  refreshToken: string,
  user: User,
  isNewUser: boolean
}
```

#### Set Password
```typescript
POST /api/auth/set-password
Body: { email: string, password: string }
Response: { success: boolean, message: string }
```

#### Refresh Token
```typescript
POST /api/auth/refresh
Body: { refreshToken: string }
Response: { token: string, refreshToken: string }
```

#### Logout
```typescript
POST /api/auth/logout
Response: void
```

---

## Conclusion

This authentication implementation provides a secure, user-friendly authentication system with multiple authentication methods, automatic token management, session tracking, and comprehensive security features. The system is designed to be maintainable, scalable, and secure.

For questions or issues, refer to the code comments or contact the development team.

