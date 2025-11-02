# API Migration Remaining Files - Grouped Analysis

## Overview
**Total Remaining Files:** 25 files with 97 API call matches

**Migration Progress:** ~70% complete
- ✅ Completed: Core user-facing pages, marketplace, supplies, rentals
- ⏳ Remaining: Admin pages, core infrastructure, utilities

---

## 📊 GROUP 1: ADMIN PAGES (CRUD Operations)
**Count:** 20 files | **Matches:** ~74 calls

These are admin dashboard pages with similar patterns (list, create, update, delete operations).

### 1.1 Admin Dashboard & Analytics
- `src/app/(admin)/page.tsx` (3 matches - partially updated ✅)
  - Purpose: Main admin dashboard with stats
  - Pattern: Dashboard stats fetching
  - Status: Partially migrated (needs completion check)
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/analytics/page.tsx` (3 matches)
  - Purpose: Analytics and reporting
  - Pattern: Analytics data fetching

### 1.2 User Management
- `src/app/(admin)/users/page.tsx` (6 matches - partially updated ✅)
  - Purpose: User management (list, suspend, delete)
  - Pattern: CRUD operations on users
  - Status: Partially migrated (needs completion check)
  - **Location:** Now in `(admin)` route group ✅

### 1.3 Content Management
- `src/app/(admin)/marketplace/page.tsx` (3 matches)
  - Purpose: Marketplace admin (services, bookings)
  - Pattern: List/filter marketplace items
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/jobs/page.tsx` (5 matches)
  - Purpose: Job board administration
  - Pattern: Job listing, approval, rejection
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/providers/page.tsx` (5 matches)
  - Purpose: Provider management
  - Pattern: Provider CRUD operations
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/academy/page.tsx` (2 matches)
  - Purpose: Course management
  - Pattern: Course admin operations
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/ads/page.tsx` (3 matches)
  - Purpose: Advertisement management
  - Pattern: Ad campaign CRUD

### 1.4 Supply Chain Management
- `src/app/(admin)/supplies/page.tsx` (3 matches)
  - Purpose: Supplies inventory management
  - Pattern: Supply CRUD operations
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/rentals/page.tsx` (1 match)
  - Purpose: Rental management
  - Pattern: Rental listing/approval
  - **Location:** Now in `(admin)` route group ✅

### 1.5 Financial & Payment Management
- `src/app/(admin)/finance/page.tsx` (5 matches)
  - Purpose: Financial overview and transactions
  - Pattern: Payment/transaction queries
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/payments/page.tsx` (4 matches)
  - Purpose: Payment processing admin
  - Pattern: Payment status/refund operations
  - **Location:** Now in `(admin)` route group ✅

### 1.6 Trust & Verification
- `src/app/(admin)/trust-verification/page.tsx` (5 matches)
  - Purpose: Verification request management
  - Pattern: Verification approval/rejection
  - **Location:** Now in `(admin)` route group ✅

### 1.7 Communication & Support
- `src/app/(admin)/communication/page.tsx` (2 matches)
  - Purpose: Messages and notifications admin
  - Pattern: Communication queries
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/referrals/page.tsx` (3 matches)
  - Purpose: Referral program management
  - Pattern: Referral tracking/queries
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/plus/page.tsx` (7 matches)
  - Purpose: LocalPro Plus subscription management
  - Pattern: Subscription CRUD operations
  - **Location:** Now in `(admin)` route group ✅

### 1.8 System Administration
- `src/app/(admin)/logs/page.tsx` (9 matches - highest priority)
  - Purpose: System logs and audit trails
  - Pattern: Log querying/filtering
  - Priority: HIGH (used for debugging)
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/audit/page.tsx` (4 matches)
  - Purpose: Audit trail management
  - Pattern: Audit log queries
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/errors/page.tsx` (5 matches)
  - Purpose: Error tracking
  - Pattern: Error log queries
  - **Location:** Now in `(admin)` route group ✅

- `src/app/(admin)/settings/page.tsx` (3 matches)
  - Purpose: System settings configuration
  - Pattern: Settings read/write
  - **Location:** Now in `(admin)` route group ✅

---

## 🔧 GROUP 2: CORE INFRASTRUCTURE
**Count:** 3 files | **Matches:** ~11 calls

These are foundational files used throughout the application.

### 2.1 Layout & Routing
- `src/app/(dashboard)/layout.tsx` (4 matches)
  - Purpose: Main dashboard layout wrapper
  - Pattern: User profile fetching on mount
  - Status: Partially migrated (user fetching logic)
  - Priority: HIGH (affects all dashboard pages)

### 2.2 Authentication Hooks
- `src/hooks/useAuth.ts` (3 matches)
  - Purpose: Core authentication hook (useSession)
  - Pattern: Session/user fetching
  - Priority: CRITICAL (used everywhere)
  - Note: This is the main auth hook - needs careful migration

### 2.3 User Profile Component
- `src/components/user-profile.tsx` (1 match - already migrated ✅)
  - Purpose: User profile display component
  - Status: Already migrated (may have lingering import)

---

## 🧪 GROUP 3: UTILITIES & EXAMPLES
**Count:** 2 files | **Matches:** ~15 calls

These are example/utility files that may not be actively used.

### 3.1 Migration Source
- `src/lib/client-api-utils.ts` (6 matches)
  - Purpose: Original API utility library (being migrated FROM)
  - Status: Should be deprecated after migration
  - Action: Keep for now, remove after all migrations complete

### 3.2 Example/Test Component
- `src/components/token-expiry-example.tsx` (9 matches)
  - Purpose: Example component showing token handling patterns
  - Pattern: Multiple examples of API call patterns
  - Priority: LOW (example/documentation file)
  - Note: May want to update to show new patterns, or remove if obsolete

---

## 📈 Migration Priority Recommendations

### Priority 1: CRITICAL (Blocking)
1. **`src/hooks/useAuth.ts`** - Core authentication hook
   - Used by every page
   - Must be migrated first or very early

2. **`src/app/(dashboard)/layout.tsx`** - Dashboard wrapper
   - Affects all dashboard pages
   - User fetching on layout mount

### Priority 2: HIGH (Frequently Used)
3. **`src/app/admin/logs/page.tsx`** - System logs
   - Used for debugging
   - 9 matches (most complex)

4. **`src/app/admin/page.tsx`** - Admin dashboard
   - Main admin entry point
   - Partially migrated, needs completion

### Priority 3: MEDIUM (Standard Admin Pages)
5. All other admin pages (18 files)
   - Similar patterns
   - Can be batch processed
   - Group by functionality for efficient updates

### Priority 4: LOW (Non-Critical)
6. **`src/components/token-expiry-example.tsx`** - Example file
   - Not production code
   - Update or remove

7. **`src/lib/client-api-utils.ts`** - Source file
   - Keep until migration complete
   - Remove after verification

---

## 🎯 Recommended Migration Order

### Phase 1: Core Infrastructure (2-3 files)
1. `src/hooks/useAuth.ts` ⚠️ CRITICAL
2. `src/app/(dashboard)/layout.tsx` ⚠️ HIGH

### Phase 2: High-Priority Admin (2 files)
3. `src/app/admin/logs/page.tsx` (9 matches)
4. `src/app/admin/page.tsx` (complete remaining)

### Phase 3: Admin Pages by Functionality (18 files)
5. User Management: `users`, `providers`, `jobs`
6. Content Management: `marketplace`, `academy`, `ads`
7. Financial: `finance`, `payments`, `plus`
8. System: `trust-verification`, `communication`, `referrals`
9. Operations: `supplies`, `rentals`
10. Monitoring: `analytics`, `errors`, `audit`, `settings`

### Phase 4: Cleanup (2 files)
11. `src/components/token-expiry-example.tsx` (update or remove)
12. `src/lib/client-api-utils.ts` (deprecate after verification)

---

## 📝 Common Patterns Identified

### Pattern 1: Simple GET Requests
```typescript
// OLD
makeClientAuthenticatedRequestWithEndpointSafe('endpointName', { method: 'GET' })

// NEW
const url = `${API_BASE_URL}${API_ENDPOINTS.endpointName}`;
const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
```

### Pattern 2: POST/PUT/DELETE with Body
```typescript
// OLD
makeClientAuthenticatedRequestWithEndpointSafe('endpointName', {
  method: 'POST',
  body: JSON.stringify(data)
})

// NEW
const url = `${API_BASE_URL}${API_ENDPOINTS.endpointName}`;
const response = await fetch(url, createAuthFetchOptions({
  method: 'POST',
  body: JSON.stringify(data)
}));
```

### Pattern 3: Path Parameters
```typescript
// OLD
makeClientAuthenticatedRequestWithPathSafe('endpointName', [id], {}, { method: 'GET' })

// NEW
const endpoint = API_ENDPOINTS.endpointName.replace('[id]', id);
const url = `${API_BASE_URL}${endpoint}`;
const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
```

### Pattern 4: Query Parameters
```typescript
// OLD
makeClientAuthenticatedRequestWithEndpointSafe('endpointName', {
  method: 'GET',
  query: { param1: 'value', param2: 'value' }
})

// NEW
const params = new URLSearchParams({ param1: 'value', param2: 'value' }).toString();
const url = `${API_BASE_URL}${API_ENDPOINTS.endpointName}?${params}`;
const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
```

---

## ✅ Verification Checklist

After migration, verify:
- [ ] All imports updated (`client-api-utils` → `auth-utils`)
- [ ] All `makeClientAuthenticatedRequest*` calls replaced with `fetch`
- [ ] All `handleClientApiRoute` wrappers removed
- [ ] Authentication checks using `getApiToken()` where needed
- [ ] Error handling preserved
- [ ] Response parsing consistent
- [ ] No linter errors
- [ ] Test critical user flows (login, dashboard, admin)

---

## 📊 Statistics

| Category | Files | Matches | Status |
|----------|-------|---------|--------|
| Admin Pages | 20 | ~74 | ⏳ Pending |
| Core Infrastructure | 3 | ~11 | ⚠️ Critical |
| Utilities | 2 | ~15 | 🔧 Low Priority |
| **TOTAL** | **25** | **~97** | **~30% Remaining** |

---

**Last Updated:** Migration in progress
**Next Steps:** Complete Priority 1 files, then proceed with admin pages systematically

