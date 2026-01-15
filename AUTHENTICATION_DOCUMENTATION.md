# Authentication Documentation

This document describes the authentication system for the LocalPro Super App, including standard login, OTP verification, JWT-based session management, and MPIN (Mobile PIN) authentication.

## Overview
LocalPro uses a multi-layered authentication system to support various user roles. The system includes:
- Email/phone login with OTP verification
- JWT-based session management
- MPIN (Mobile PIN) for quick access
- Route protection via middleware

## Authentication Flows

### 1. Email/Phone Login & OTP Verification
- Users can log in or register using their email or phone number.
- Upon entering credentials, an OTP is sent via SMS (Twilio) or email.
- The user enters the OTP to verify identity.
- On success, a JWT token is issued and stored client-side.

**Key Files:**
- `src/lib/auth.ts`: Auth service methods for login, registration, OTP verification
- `src/stores/auth.ts`: Zustand store for user state
- `src/lib/api.ts`: Axios client with JWT interceptors
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`: Mantine-based forms

### 2. JWT Session Management
- JWT tokens are used for session management and API authentication.
- Automatic token refresh is handled by Axios interceptors in `src/lib/api.ts`.
- Protected routes are managed via `src/proxy.ts` and dashboard layouts.

### 3. MPIN Authentication
- MPIN is a 4-6 digit PIN for quick login, especially on mobile.
- Users set up MPIN after initial authentication (OTP or password).
- MPIN is stored securely (hashed) and can be used for subsequent logins.
- MPIN entry is handled in `src/app/(authenticated)/mpin/page.tsx`.
- If MPIN is forgotten, users can reset via OTP verification.

**Key Files:**
- `src/app/(authenticated)/mpin/page.tsx`: MPIN entry and setup UI
- `src/lib/auth.ts`: MPIN setup, verification, and reset methods
- `src/stores/auth.ts`: MPIN state management

## Route Protection
- All protected routes are under `(authenticated)` in `src/app/`.
- Middleware in `src/proxy.ts` checks for valid JWT and/or MPIN before granting access.
- Unauthenticated users are redirected to login or MPIN entry.

## UI Components
- Mantine forms for login, registration, OTP, and MPIN
- Lucide icons for feedback
- Framer Motion for transitions

## Error Handling
- User-friendly error messages for failed logins, invalid OTP, or incorrect MPIN
- Global error boundary for unexpected issues

## Security Notes
- MPIN is never stored in plain text; always hashed
- JWT tokens are stored securely (preferably in httpOnly cookies)
- OTPs expire after a short duration

## References
- [src/lib/auth.ts](src/lib/auth.ts)
- [src/stores/auth.ts](src/stores/auth.ts)
- [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx)
- [src/app/(authenticated)/mpin/page.tsx](src/app/(authenticated)/mpin/page.tsx)
- [src/proxy.ts](src/proxy.ts)

---
For integration details, see `frontend-specs.md` and role-specific flows in `user_role_journey/`.
