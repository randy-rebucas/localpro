# API Endpoints Constants - Usage Guide

This guide shows how to use the API endpoints constants file (`api-endpoints.ts`) with native Node.js fetch from server-side code.

## Quick Start

### 1. Import the Utilities

```typescript
import { 
  AUTH_ENDPOINTS,
  MARKETPLACE_ENDPOINTS,
  findEndpointByPattern 
} from '@/lib/api-endpoints';
import {
  makeServerPublicRequest,
  makeServerAuthenticatedRequest,
  makeServerRequest,
  requestByPath,
} from '@/lib/server-api-utils';
```

### 2. Make a Public Request (No Auth)

```typescript
// Find the endpoint
const endpoint = MARKETPLACE_ENDPOINTS.find(
  (e) => e.path === '/api/marketplace/services' && e.method === 'GET'
);

// Make the request
const services = await makeServerPublicRequest(endpoint, {
  queryParams: { category: 'plumbing', page: 1 },
});
```

### 3. Make an Authenticated Request

```typescript
// In an API route handler or server action
export async function GET(request: NextRequest) {
  const endpoint = AUTH_ENDPOINTS.find(
    (e) => e.path === '/api/auth/me' && e.method === 'GET'
  );

  const user = await makeServerAuthenticatedRequest(request, endpoint);
  return Response.json(user);
}
```

### 4. Request with Path Parameters

```typescript
const endpoint = USERS_ENDPOINTS.find(
  (e) => e.path === '/api/users/:id' && e.method === 'GET'
);

const user = await makeServerAuthenticatedRequest(request, endpoint, {
  pathParams: { id: '123' },
});
```

### 5. POST Request with Body

```typescript
const endpoint = MARKETPLACE_ENDPOINTS.find(
  (e) => e.path === '/api/marketplace/services' && e.method === 'POST'
);

const newService = await makeServerAuthenticatedRequest(request, endpoint, {
  body: {
    title: 'Plumbing Service',
    description: 'Professional plumbing',
    category: 'plumbing',
  },
});
```

### 6. Using `requestByPath` Helper

```typescript
// Automatically finds endpoint and makes request
const user = await requestByPath(
  request,
  '/api/users/:id',
  'GET',
  { pathParams: { id: '123' } }
);
```

### 7. Smart Request (Auto-detects Auth Requirement)

```typescript
// Automatically uses public or authenticated based on endpoint roles
const endpoint = MARKETPLACE_ENDPOINTS.find(
  (e) => e.path === '/api/marketplace/services'
);

const services = await makeServerRequest(request, endpoint, {
  queryParams: { featured: 'true' },
});
```

## Available Endpoint Groups

All endpoint groups are exported from `api-endpoints.ts`:

- `BASE_ROUTES` - Root & health endpoints
- `AUTH_ENDPOINTS` - Authentication endpoints
- `MARKETPLACE_ENDPOINTS` - Marketplace services
- `ADS_ENDPOINTS` - Advertising
- `JOBS_ENDPOINTS` - Job board
- `RENTALS_ENDPOINTS` - Equipment rentals
- `ACADEMY_ENDPOINTS` - Courses & learning
- `SUPPLIES_ENDPOINTS` - Supplies & products
- `FINANCE_ENDPOINTS` - Financial management
- `FACILITY_CARE_ENDPOINTS` - Facility care services
- `LOCALPRO_PLUS_ENDPOINTS` - Subscription plans
- `TRUST_VERIFICATION_ENDPOINTS` - Trust verification
- `COMMUNICATION_ENDPOINTS` - Messaging & notifications
- `ANALYTICS_ENDPOINTS` - Analytics
- `MAPS_ENDPOINTS` - Maps & geocoding
- `PAYPAL_ENDPOINTS` - PayPal integration
- `PAYMAYA_ENDPOINTS` - PayMaya integration
- `REFERRALS_ENDPOINTS` - Referral system
- `AGENCIES_ENDPOINTS` - Agency management
- `PROVIDERS_ENDPOINTS` - Provider management
- `SETTINGS_ENDPOINTS` - Settings
- `USERS_ENDPOINTS` - User management
- `SEARCH_ENDPOINTS` - Search
- `ANNOUNCEMENTS_ENDPOINTS` - Announcements
- `ACTIVITIES_ENDPOINTS` - Activities
- `REGISTRATION_ENDPOINTS` - Registration
- `MONITORING_ENDPOINTS` - Monitoring
- `ERROR_MONITORING_ENDPOINTS` - Error monitoring
- `AUDIT_LOGS_ENDPOINTS` - Audit logs
- `LOGS_ENDPOINTS` - Logs
- `DATABASE_MONITORING_ENDPOINTS` - Database monitoring
- `DATABASE_OPTIMIZATION_ENDPOINTS` - Database optimization
- `METRICS_STREAM_ENDPOINTS` - Metrics streaming
- `ALERTS_ENDPOINTS` - Alerts

Or use `ALL_API_ENDPOINTS` for all endpoints in one array.

## Helper Functions

### From `api-endpoints.ts`:

- `getEndpointByPath(path, method?)` - Find endpoint by exact path
- `findEndpointByPattern(path, method?)` - Find endpoint by path pattern
- `getEndpointsByRole(role)` - Get all endpoints for a role
- `getEndpointsByMethod(method)` - Get all endpoints for HTTP method
- `getPublicEndpoints()` - Get all public endpoints
- `getAuthenticatedEndpoints()` - Get all authenticated endpoints
- `getAdminEndpoints()` - Get all admin-only endpoints
- `requiresAuthentication(endpoint)` - Check if endpoint requires auth
- `hasAccess(endpoint, userRole)` - Check if user role has access

### From `server-api-utils.ts`:

- `makeServerPublicRequest(endpoint, options?)` - Public request
- `makeServerAuthenticatedRequest(request, endpoint, options?)` - Authenticated request
- `makeServerRequest(request, endpoint, options?)` - Smart request (auto-detects auth)
- `requestByPath(request, path, method, options?)` - Request by path string
- `buildApiUrl(endpoint, options?)` - Build full API URL
- `replacePathParams(path, params)` - Replace path parameters

## Options Object

All request functions accept an options object:

```typescript
{
  pathParams?: Record<string, string | number>;     // Replace :param in path
  queryParams?: Record<string, string | number | boolean>;  // Query string
  body?: unknown;                                    // Request body (auto-stringified)
  headers?: Record<string, string>;                 // Additional headers
  signal?: AbortSignal;                             // Abort signal
}
```

## Error Handling

All functions throw errors on failure. Always wrap in try-catch:

```typescript
try {
  const user = await makeServerAuthenticatedRequest(request, endpoint);
  return Response.json(user);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('Authentication')) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ error: 'Unknown error' }, { status: 500 });
}
```

## Usage in Different Contexts

### API Route Handler

```typescript
// app/api/services/route.ts
import { NextRequest } from 'next/server';
import { MARKETPLACE_ENDPOINTS } from '@/lib/api-endpoints';
import { makeServerRequest } from '@/lib/server-api-utils';

export async function GET(request: NextRequest) {
  const endpoint = MARKETPLACE_ENDPOINTS.find(
    (e) => e.path === '/api/marketplace/services' && e.method === 'GET'
  );

  if (!endpoint) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const services = await makeServerRequest(request, endpoint, {
    queryParams: { featured: 'true' },
  });

  return Response.json(services);
}
```

### Server Component

```typescript
// app/services/page.tsx (Server Component)
import { MARKETPLACE_ENDPOINTS } from '@/lib/api-endpoints';
import { makeServerPublicRequest } from '@/lib/server-api-utils';

export default async function ServicesPage() {
  const endpoint = MARKETPLACE_ENDPOINTS.find(
    (e) => e.path === '/api/marketplace/services'
  );

  const services = await makeServerPublicRequest(endpoint!);

  return <div>{/* Render services */}</div>;
}
```

### Server Action

```typescript
// actions.ts
'use server';

import { cookies } from 'next/headers';
import { MARKETPLACE_ENDPOINTS } from '@/lib/api-endpoints';
import { makeServerAuthenticatedRequest } from '@/lib/server-api-utils';
import { NextRequest } from 'next/server';

export async function createService(formData: FormData) {
  // Note: Server actions don't have NextRequest directly
  // You may need to construct a request object or use cookies() directly
  // This is a simplified example
  
  const endpoint = MARKETPLACE_ENDPOINTS.find(
    (e) => e.path === '/api/marketplace/services' && e.method === 'POST'
  );

  const serviceData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
  };

  // In practice, you'd need to handle authentication differently
  // This is just showing the pattern
  return serviceData;
}
```

## Type Safety

All functions are fully typed:

- `ApiEndpoint` - The endpoint type with method, path, roles, description
- Request functions return `Promise<T>` where T is inferred from usage
- TypeScript will autocomplete endpoint paths and methods

## Examples File

See `server-api-examples.ts` for more detailed examples.

