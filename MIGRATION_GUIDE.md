# Migration Guide: From client-api-utils to Native Fetch

This guide helps you migrate from `client-api-utils` methods to native `fetch` calls.

## Completed Files
✅ `src/components/global-header.tsx`
✅ `src/components/marketplace/marketplace-header.tsx`
✅ `src/app/(dashboard)/layout.tsx`
✅ `src/app/(dashboard)/notifications/page.tsx`

## Migration Pattern

### 1. Update Imports

**Before:**
```typescript
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
```

**After:**
```typescript
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
```

### 2. Replace Endpoint-based Requests

**Before:**
```typescript
const response = await makeClientAuthenticatedRequestWithEndpointSafe(
  'communicationNotifications' as keyof typeof API_ENDPOINTS,
  { 
    method: 'GET',
    query: { limit: '5', page: '1' }
  }
);
```

**After:**
```typescript
const queryParams = new URLSearchParams({ limit: '5', page: '1' }).toString();
const url = `${API_BASE_URL}${API_ENDPOINTS.communicationNotifications}?${queryParams}`;
const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
```

### 3. Replace Path-based Requests

**Before:**
```typescript
const response = await makeClientAuthenticatedRequestWithPathSafe(
  'communicationNotificationsRead' as keyof typeof API_ENDPOINTS,
  [notificationId],
  {},
  { method: 'PUT' }
);
```

**After:**
```typescript
const endpoint = API_ENDPOINTS.communicationNotificationsRead.replace('[id]', notificationId);
const url = `${API_BASE_URL}${endpoint}`;
const response = await fetch(url, createAuthFetchOptions({ method: 'PUT' }));
```

### 4. Add Token Check

**Before:**
```typescript
if (!session) return;
```

**After:**
```typescript
if (!session || !getApiToken()) return;
```

### 5. Public Endpoints

For PUBLIC endpoints (like search suggestions), use simple fetch:

```typescript
const url = `${API_BASE_URL}${API_ENDPOINTS.searchSuggestions}?${queryString}`;
const response = await fetch(url, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});
```

## Remaining Files to Migrate

Based on grep results, these files still need migration:

### Dashboard Pages (Priority 1)
- `src/app/(dashboard)/messages/page.tsx` (22 matches)
- `src/app/(dashboard)/search/page.tsx` (2 matches)
- `src/app/(dashboard)/dashboard/@header/page.tsx`
- `src/app/(dashboard)/dashboard/@stats/page.tsx`
- `src/app/(dashboard)/dashboard/@announcements/page.tsx`
- `src/app/(dashboard)/dashboard/@activity/page.tsx`

### Marketplace Pages
- `src/app/(dashboard)/marketplace/services/[id]/page.tsx`
- `src/app/(dashboard)/marketplace/services/category/[key]/page.tsx`
- `src/app/(dashboard)/marketplace/courses/[id]/page.tsx`
- `src/app/(dashboard)/marketplace/courses/page.tsx`
- `src/app/(dashboard)/marketplace/courses/create/page.tsx`
- `src/app/(dashboard)/marketplace/providers/[id]/page.tsx`
- `src/app/(dashboard)/marketplace/supplies/[id]/page.tsx`
- `src/app/(dashboard)/marketplace/jobs/[id]/page.tsx`
- `src/app/(dashboard)/marketplace/create-job/page.tsx`
- `src/app/(dashboard)/marketplace/create-service/page.tsx`

### Supplies & Rentals
- `src/app/(dashboard)/supplies/page.tsx`
- `src/app/(dashboard)/supplies/create/page.tsx`
- `src/app/(dashboard)/supplies/my-supplies/page.tsx`
- `src/app/(dashboard)/supplies/my-orders/page.tsx`
- `src/app/(dashboard)/rentals/page.tsx`
- `src/app/(dashboard)/rentals/create/page.tsx`

### Components
- `src/components/profile-completeness.tsx`
- `src/components/user-profile.tsx`
- `src/components/verification-modal.tsx`
- `src/components/referral-info.tsx`

### Admin Pages (Lower Priority)
- All files in `src/app/admin/`

## Notes

1. **Endpoint Path Parameters**: When endpoints contain `[id]` placeholders, use `.replace('[id]', actualId)`
2. **Query Parameters**: Build using `URLSearchParams` and append to URL
3. **Error Handling**: Native fetch doesn't throw on HTTP errors, check `response.ok`
4. **Token Validation**: Always check `getApiToken()` before making authenticated requests
5. **Public vs Authenticated**: Check `API_ENDPOINTS_WITH_ROLES.md` to determine if endpoint is PUBLIC

## Testing Checklist

After migration, test:
- ✅ API calls work correctly
- ✅ Authentication headers are included
- ✅ Error handling works
- ✅ Loading states update properly
- ✅ Token validation prevents unauthorized calls

