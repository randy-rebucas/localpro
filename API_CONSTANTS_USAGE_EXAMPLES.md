# API Constants Usage Examples

## Overview

The enhanced `src/lib/api-auth-utils.ts` now utilizes the API constants from `src/lib/api.ts` to provide better type safety, consistency, and maintainability.

## Available Functions

### 1. `makeAuthenticatedRequestWithEndpoint()`
Use for simple endpoints without dynamic parameters.

```typescript
import { makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

// Example: Get notifications
const response = await makeAuthenticatedRequestWithEndpoint(
  session,
  'communicationNotifications',
  { method: 'GET' }
);

// Example: Send SMS notification
const response = await makeAuthenticatedRequestWithEndpoint(
  session,
  'communicationSmsNotification',
  {
    method: 'POST',
    body: JSON.stringify(data)
  }
);
```

### 2. `makeAuthenticatedRequestWithPath()`
Use for endpoints with dynamic parameters and query strings.

```typescript
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// Example: Get marketplace services with query parameters
const response = await makeAuthenticatedRequestWithPath(
  session,
  'marketplaceServices',
  [], // No path parameters
  { category: 'CLEANING', location: 'New York' }, // Query parameters
  { method: 'GET' }
);

// Example: Get specific job with ID
const response = await makeAuthenticatedRequestWithPath(
  session,
  'jobsById',
  ['123'], // Path parameter: job ID
  { include: 'applications' }, // Query parameters
  { method: 'GET' }
);

// Example: Create booking for specific service
const response = await makeAuthenticatedRequestWithPath(
  session,
  'marketplaceBookings',
  [], // No path parameters
  {}, // No query parameters
  {
    method: 'POST',
    body: JSON.stringify(bookingData)
  }
);
```

### 3. `buildApiUrl()`
Helper function to build URLs with endpoint constants.

```typescript
import { buildApiUrl } from "@/lib/api-auth-utils";

// Build URL for marketplace services with filters
const url = buildApiUrl('marketplaceServices', [], {
  category: 'CLEANING',
  location: 'New York',
  minPrice: '50',
  maxPrice: '200'
});
// Result: "https://api.example.com/api/marketplace/services?category=CLEANING&location=New+York&minPrice=50&maxPrice=200"

// Build URL for specific job applications
const url = buildApiUrl('jobsApplications', ['123'], {
  status: 'pending'
});
// Result: "https://api.example.com/api/jobs/123/applications?status=pending"
```

### 4. `handleApiRequestWithEndpoint()`
Complete request handler with session validation.

```typescript
import { handleApiRequestWithEndpoint } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  try {
    const response = await handleApiRequestWithEndpoint(
      request,
      'communicationNotifications',
      { method: 'GET' }
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Route Pattern Examples

### Communication Routes

```typescript
// GET /api/communication/notifications
const response = await makeAuthenticatedRequestWithEndpoint(
  session,
  'communicationNotifications',
  { method: 'GET' }
);

// POST /api/communication/notifications/sms
const response = await makeAuthenticatedRequestWithEndpoint(
  session,
  'communicationSmsNotification',
  {
    method: 'POST',
    body: JSON.stringify(smsData)
  }
);

// GET /api/communication/conversations/:id/messages
const response = await makeAuthenticatedRequestWithPath(
  session,
  'communicationMessages',
  [conversationId],
  { limit: '50', offset: '0' },
  { method: 'GET' }
);
```

### Marketplace Routes

```typescript
// GET /api/marketplace/services
const response = await makeAuthenticatedRequestWithPath(
  session,
  'marketplaceServices',
  [],
  { category: 'CLEANING', location: 'New York' },
  { method: 'GET' }
);

// POST /api/marketplace/bookings
const response = await makeAuthenticatedRequestWithPath(
  session,
  'marketplaceBookings',
  [],
  {},
  {
    method: 'POST',
    body: JSON.stringify(bookingData)
  }
);

// GET /api/marketplace/my-services
const response = await makeAuthenticatedRequestWithEndpoint(
  session,
  'marketplaceMyServices',
  { method: 'GET' }
);
```

### Job Routes

```typescript
// GET /api/jobs
const response = await makeAuthenticatedRequestWithPath(
  session,
  'jobs',
  [],
  { category: 'TECHNOLOGY', location: 'Remote' },
  { method: 'GET' }
);

// POST /api/jobs/:id/apply
const response = await makeAuthenticatedRequestWithPath(
  session,
  'jobsApply',
  [jobId],
  {},
  {
    method: 'POST',
    body: JSON.stringify(applicationData)
  }
);
```

### Academy Routes

```typescript
// GET /api/academy/courses
const response = await makeAuthenticatedRequestWithEndpoint(
  session,
  'academyCourses',
  { method: 'GET' }
);

// POST /api/academy/courses/:id/enroll
const response = await makeAuthenticatedRequestWithPath(
  session,
  'academyEnroll',
  [courseId],
  {},
  {
    method: 'POST',
    body: JSON.stringify({ paymentMethod: 'credit_card' })
  }
);
```

## Benefits of Using API Constants

### 1. **Type Safety**
- TypeScript autocomplete for endpoint names
- Compile-time validation of endpoint existence
- Prevents typos in endpoint URLs

### 2. **Consistency**
- Centralized endpoint management
- Consistent URL construction
- Easy to update endpoint paths

### 3. **Maintainability**
- Single source of truth for all endpoints
- Easy to refactor endpoint paths
- Better code organization

### 4. **Error Prevention**
- No more hardcoded URLs
- Automatic URL construction
- Consistent parameter handling

## Migration Guide

### Before (Manual URLs)
```typescript
const response = await fetch(`${API_BASE_URL}/api/marketplace/services`, {
  method: 'GET',
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.user.id}`,
  }
});
```

### After (API Constants)
```typescript
const response = await makeAuthenticatedRequestWithEndpoint(
  session,
  'marketplaceServices',
  { method: 'GET' }
);
```

## Available Endpoint Constants

The `API_ENDPOINTS` object contains all available endpoints:

- **Authentication**: `authSendCode`, `authVerifyCode`, `authMe`, etc.
- **Marketplace**: `marketplaceServices`, `marketplaceBookings`, `marketplaceMyServices`, etc.
- **Communication**: `communicationNotifications`, `communicationConversations`, etc.
- **Jobs**: `jobs`, `jobsSearch`, `jobsMyApplications`, etc.
- **Academy**: `academyCourses`, `academyMyCourses`, etc.
- **Supplies**: `supplies`, `suppliesMySupplies`, etc.
- **Rentals**: `rentals`, `rentalsMyRentals`, etc.
- **Analytics**: `analyticsOverview`, `analyticsUser`, etc.
- **Search**: `search`, `searchSuggestions`, `searchAdvanced`, etc.

## Best Practices

1. **Use `makeAuthenticatedRequestWithEndpoint()`** for simple endpoints
2. **Use `makeAuthenticatedRequestWithPath()`** for dynamic endpoints
3. **Use `buildApiUrl()`** when you need just the URL
4. **Use `handleApiRequestWithEndpoint()`** for complete request handling
5. **Always validate session** before making requests
6. **Handle errors consistently** across all routes

This approach provides a robust, type-safe, and maintainable way to handle API requests throughout the application.
