# Frontend API Constants Usage Guide

## Overview

This guide demonstrates how to use the new constant-based API functions in frontend components, replacing hardcoded URLs with type-safe, maintainable patterns.

## Quick Start

### 1. Import Required Functions

```typescript
import { 
  makeClientAuthenticatedRequestWithEndpoint,
  makeClientAuthenticatedRequestWithPath,
  handleClientApiRoute 
} from "@/lib/client-api-utils";
```

### 2. Replace Hardcoded URLs

#### Before (❌ Bad)
```typescript
const response = await fetch('/api/ads', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### After (✅ Good)
```typescript
const result = await handleClientApiRoute(async () => {
  const response = await makeClientAuthenticatedRequestWithEndpoint(
    'ads',
    { method: 'GET' }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ads: ${response.status}`);
  }
  
  return await response.json();
}, "Fetch ads");

if (result.error) {
  console.error('Error:', result.error);
  return;
}

const data = result.data;
```

## Function Reference

### `makeClientAuthenticatedRequestWithEndpoint()`
Use for simple endpoints without dynamic parameters.

```typescript
// Get notifications
const response = await makeClientAuthenticatedRequestWithEndpoint(
  'communicationNotifications',
  { method: 'GET' }
);

// Send SMS notification
const response = await makeClientAuthenticatedRequestWithEndpoint(
  'communicationSmsNotification',
  {
    method: 'POST',
    body: JSON.stringify(data)
  }
);
```

### `makeClientAuthenticatedRequestWithPath()`
Use for endpoints with dynamic parameters and query strings.

```typescript
// Get marketplace services with query parameters
const response = await makeClientAuthenticatedRequestWithPath(
  'marketplaceServices',
  [], // No path parameters
  { category: 'CLEANING', location: 'New York' }, // Query parameters
  { method: 'GET' }
);

// Get specific job with ID
const response = await makeClientAuthenticatedRequestWithPath(
  'jobsById',
  ['123'], // Path parameter: job ID
  { include: 'applications' }, // Query parameters
  { method: 'GET' }
);

// Create booking for specific service
const response = await makeClientAuthenticatedRequestWithPath(
  'marketplaceBookings',
  [], // No path parameters
  {}, // No query parameters
  {
    method: 'POST',
    body: JSON.stringify(bookingData)
  }
);
```

### `handleClientApiRoute()`
Standardized wrapper with error handling.

```typescript
const result = await handleClientApiRoute(async () => {
  const response = await makeClientAuthenticatedRequestWithEndpoint(
    'analyticsOverview',
    { method: 'GET' }
  );
  return await response.json();
}, "Analytics overview");

if (result.error) {
  console.error('Error:', result.error);
  return;
}

const data = result.data;
```

## Common Patterns

### 1. Simple GET Request
```typescript
const fetchData = async () => {
  const result = await handleClientApiRoute(async () => {
    const response = await makeClientAuthenticatedRequestWithEndpoint(
      'announcements',
      { method: 'GET' }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    return await response.json();
  }, "Fetch data");
  
  if (result.error) {
    setError(result.error);
    return;
  }
  
  setData(result.data);
};
```

### 2. GET Request with Query Parameters
```typescript
const searchServices = async (query: string, category: string) => {
  const result = await handleClientApiRoute(async () => {
    const response = await makeClientAuthenticatedRequestWithPath(
      'marketplaceServices',
      [],
      { search: query, category },
      { method: 'GET' }
    );
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    return await response.json();
  }, "Search services");
  
  if (result.error) {
    setError(result.error);
    return;
  }
  
  setServices(result.data.services || []);
};
```

### 3. POST Request with Body
```typescript
const createAd = async (adData: AdData) => {
  const result = await handleClientApiRoute(async () => {
    const response = await makeClientAuthenticatedRequestWithEndpoint(
      'ads',
      {
        method: 'POST',
        body: JSON.stringify(adData)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create ad: ${response.status}`);
    }
    
    return await response.json();
  }, "Create ad");
  
  if (result.error) {
    setError(result.error);
    return;
  }
  
  setAds(prev => [...prev, result.data]);
};
```

### 4. PUT Request with Path Parameters
```typescript
const updateMessage = async (conversationId: string, messageId: string, content: string) => {
  const result = await handleClientApiRoute(async () => {
    const response = await makeClientAuthenticatedRequestWithPath(
      'communicationMessageUpdate',
      [conversationId, messageId],
      {},
      {
        method: 'PUT',
        body: JSON.stringify({ content })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update message: ${response.status}`);
    }
    
    return await response.json();
  }, "Update message");
  
  if (result.error) {
    setError(result.error);
    return;
  }
  
  // Update local state
  setMessages(prev => 
    prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, editedAt: new Date().toISOString() }
        : msg
    )
  );
};
```

### 5. DELETE Request
```typescript
const deleteMessage = async (conversationId: string, messageId: string) => {
  const result = await handleClientApiRoute(async () => {
    const response = await makeClientAuthenticatedRequestWithPath(
      'communicationMessageDelete',
      [conversationId, messageId],
      {},
      { method: 'DELETE' }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to delete message: ${response.status}`);
    }
    
    return await response.json();
  }, "Delete message");
  
  if (result.error) {
    setError(result.error);
    return;
  }
  
  // Update local state
  setMessages(prev => prev.filter(msg => msg.id !== messageId));
};
```

## Error Handling Best Practices

### 1. Use `handleClientApiRoute` for Comprehensive Error Handling
```typescript
const result = await handleClientApiRoute(async () => {
  // Your API call here
}, "Descriptive context");

if (result.error) {
  // Handle error appropriately
  console.error('API Error:', result.error);
  setError(result.error);
  return;
}

// Use result.data
```

### 2. Handle Different Error Types
```typescript
const result = await handleClientApiRoute(async () => {
  const response = await makeClientAuthenticatedRequestWithEndpoint(
    'endpoint',
    { method: 'GET' }
  );
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required');
    } else if (response.status === 403) {
      throw new Error('Access denied');
    } else if (response.status >= 500) {
      throw new Error('Server error');
    } else {
      throw new Error(`Request failed: ${response.status}`);
    }
  }
  
  return await response.json();
}, "API call");

if (result.error) {
  if (result.error.includes('Authentication')) {
    // Redirect to login
    router.push('/auth');
  } else if (result.error.includes('Access denied')) {
    // Show permission error
    setError('You do not have permission to perform this action');
  } else {
    // Show generic error
    setError('Something went wrong. Please try again.');
  }
  return;
}
```

## Migration Examples

### Example 1: Dashboard Layout
```typescript
// BEFORE (❌ Bad)
const response = await fetch(`/api/users/${session?.user?.id}`);

// AFTER (✅ Good)
const result = await handleClientApiRoute(async () => {
  const response = await makeClientAuthenticatedRequestWithPath(
    'usersById',
    [session?.user?.id],
    {},
    { method: 'GET' }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user data: ${response.status}`);
  }
  
  return await response.json();
}, "Fetch user data");
```

### Example 2: Messages Page
```typescript
// BEFORE (❌ Bad)
const response = await fetch('/api/communication/conversations', {
  ...createAuthFetchOptions(),
  signal: controller.signal
});

// AFTER (✅ Good)
const result = await handleClientApiRoute(async () => {
  const response = await makeClientAuthenticatedRequestWithEndpoint(
    'communicationConversations',
    { 
      method: 'GET',
      signal: controller.signal
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.status}`);
  }
  
  return await response.json();
}, "Fetch conversations");
```

### Example 3: Search with Query Parameters
```typescript
// BEFORE (❌ Bad)
const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`, { 
  signal: controller.signal 
});

// AFTER (✅ Good)
const result = await handleClientApiRoute(async () => {
  const response = await makeClientAuthenticatedRequestWithPath(
    'searchSuggestions',
    [],
    { q },
    { method: 'GET', signal: controller.signal }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch suggestions: ${response.status}`);
  }
  
  return await response.json();
}, "Fetch search suggestions");
```

## Available Endpoint Constants

All endpoints are defined in `src/lib/api.ts` and can be used with the client functions:

### Authentication & User Management
- `authMe`, `authProfile`, `authLogout`
- `usersById`

### Marketplace Services
- `marketplaceServices`, `marketplaceMyServices`, `marketplaceBookings`
- `marketplaceServiceById`, `marketplaceBookingStatus`

### Communication & Messaging
- `communicationConversations`, `communicationConversationsById`
- `communicationMessages`, `communicationMessageUpdate`, `communicationMessageDelete`
- `communicationNotifications`, `communicationUnreadCount`
- `communicationSearch`, `communicationTyping`

### Job Board
- `jobs`, `jobsById`, `jobsApply`, `jobsMyApplications`

### Academy & Learning
- `academyCourses`, `academyCourseById`, `academyEnroll`

### Supplies & Equipment
- `supplies`, `suppliesById`, `suppliesMySupplies`, `suppliesOrder`

### Equipment Rentals
- `rentals`, `rentalsById`, `rentalsMyRentals`, `rentalsBook`

### Search & Discovery
- `search`, `searchSuggestions`, `searchAdvanced`
- `activitiesFeed`, `activitiesMy`

### Analytics & Insights
- `analyticsOverview`, `analyticsUser`, `analyticsTrack`

## Benefits

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

## Best Practices

### 1. Always Use Error Handling
```typescript
// Good: Comprehensive error handling
const result = await handleClientApiRoute(async () => {
  // API call
}, "Descriptive context");

if (result.error) {
  // Handle error
  return;
}

// Use result.data
```

### 2. Use Appropriate Function for Your Use Case
- `makeClientAuthenticatedRequestWithEndpoint()` for simple endpoints
- `makeClientAuthenticatedRequestWithPath()` for dynamic endpoints
- `handleClientApiRoute()` for standardized error handling

### 3. Provide Descriptive Context
```typescript
// Good: Descriptive context
handleClientApiRoute(async () => {
  // API call
}, "Fetch user profile data");

// Bad: Generic context
handleClientApiRoute(async () => {
  // API call
}, "API call");
```

### 4. Handle Loading States
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  
  const result = await handleClientApiRoute(async () => {
    // API call
  }, "Fetch data");
  
  if (result.error) {
    setError(result.error);
  } else {
    setData(result.data);
  }
  
  setLoading(false);
};
```

This approach provides a robust, type-safe, and maintainable way to handle API requests in frontend components.
