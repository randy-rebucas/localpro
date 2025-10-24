# API Header Requirements

## ✅ **CRITICAL REQUIREMENTS**

All external API requests MUST include these headers in the correct order for proper authentication and data handling:

### 1. **Content-Type Header** (Required)
```typescript
"Content-Type": "application/json"
```

### 2. **Authorization Header** (Required for authenticated requests)
```typescript
"Authorization": `Bearer ${apiToken}`
```

## 📋 **Modern API Pattern with Constants**

### **Recommended Approach** (Using API Constants)
```typescript
import { makeAuthenticatedRequestWithEndpoint } from "@/lib/api-auth-utils";

// For simple endpoints
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'marketplaceServices',
  { method: 'GET' }
);
```

### **Dynamic Endpoints Pattern**
```typescript
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

// For endpoints with parameters
const response = await makeAuthenticatedRequestWithPath(
  request,
  'jobsById',
  [jobId],
  { include: 'applications' },
  { method: 'GET' }
);
```

### **Public Endpoints Pattern**
```typescript
import { makePublicRequest } from "@/lib/api-auth-utils";

// For public endpoints (no authentication required)
const response = await makePublicRequest(
  'announcements',
  { method: 'GET' }
);
```

## 🔧 **Helper Functions Available**

### **Server-Side (API Routes) - Recommended**
```typescript
import { 
  makeAuthenticatedRequestWithEndpoint,
  makeAuthenticatedRequestWithPath,
  makePublicRequest,
  handleApiRoute
} from "@/lib/api-auth-utils";

// Simple authenticated request
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'marketplaceServices',
  { method: 'GET' }
);

// Dynamic path request
const response = await makeAuthenticatedRequestWithPath(
  request,
  'jobsById',
  [jobId],
  { include: 'applications' },
  { method: 'GET' }
);

// Public request (no authentication)
const response = await makePublicRequest(
  'announcements',
  { method: 'GET' }
);
```

### **Client-Side (Browser) - Legacy Support**
```typescript
import { createAuthFetchOptions, createAuthHeaders } from "@/lib/auth-utils";

// Automatically includes both headers
const response = await fetch(url, createAuthFetchOptions(options));

// Or create headers manually
const headers = createAuthHeaders();
const response = await fetch(url, { headers, ...options });
```

### **Manual Header Creation** (Advanced)
```typescript
import { createAuthenticatedFetchOptions } from "@/lib/api-auth-utils";

// For custom requests
const fetchOptions = await createAuthenticatedFetchOptions(request, options);
const response = await fetch(url, fetchOptions);
```

## ⚠️ **Common Issues Fixed**

### ❌ **Before (Incorrect Patterns)**
```typescript
// ❌ Manual fetch with hardcoded URLs
const response = await fetch(`${API_BASE_URL}/api/marketplace/services`, {
  method: 'GET',
  headers: {
    "Authorization": `Bearer ${session.user.id}`, // Wrong token
    "Content-Type": "application/json",
  }
});

// ❌ Missing Content-Type
headers: {
  "Authorization": `Bearer ${token}`,
}

// ❌ Missing Authorization
headers: {
  "Content-Type": "application/json",
}

// ❌ Wrong header order
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
}

// ❌ Using session.user.id instead of actual API token
"Authorization": `Bearer ${session.user.id}`
```

### ✅ **After (Correct Patterns)**
```typescript
// ✅ Using API constants (Recommended)
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'marketplaceServices',
  { method: 'GET' }
);

// ✅ Manual headers (if needed)
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${actualApiToken}`,
}

// ✅ Error handling with API constants
const result = await handleApiRoute(async () => {
  const response = await makeAuthenticatedRequestWithEndpoint(
    request,
    'analyticsOverview',
    { method: 'GET' }
  );
  return await response.json();
}, "Analytics overview");
```

## 🧪 **Testing Headers**

### **API Route Testing**
```typescript
// Test authenticated endpoint
export async function GET(request: NextRequest) {
  try {
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'marketplaceServices',
      { method: 'GET' }
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
```

### **Test with curl:**
```bash
# Test authenticated endpoint
curl -H "Content-Type: application/json" \
     -H "Authorization: Bearer <api-token>" \
     http://localhost:3000/api/marketplace/services

# Test public endpoint
curl -H "Content-Type: application/json" \
     http://localhost:3000/api/announcements
```

### **Test in browser console:**
```javascript
// Test authenticated request
fetch('/api/marketplace/services', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <api-token>'
  }
})
.then(response => response.json())
.then(data => console.log(data));

// Test public request
fetch('/api/announcements', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### **Automated Testing**
```typescript
// Test authentication flow
describe('API Authentication', () => {
  it('should authenticate with valid token', async () => {
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'marketplaceServices',
      { method: 'GET' }
    );
    
    expect(response.ok).toBe(true);
  });
  
  it('should reject invalid token', async () => {
    const invalidRequest = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    await expect(
      makeAuthenticatedRequestWithEndpoint(invalidRequest, 'marketplaceServices', { method: 'GET' })
    ).rejects.toThrow();
  });
});
```

## 📁 **Files Updated**

### **Core Authentication Files**
1. **`src/lib/api-auth-utils.ts`** - Main authentication utilities with API constants
2. **`src/lib/auth-utils.ts`** - Client-side authentication helpers
3. **`src/lib/api.ts`** - API endpoint constants and configuration
4. **`src/lib/server-session.ts`** - Server-side session management

### **API Routes Updated (176+ routes)**
- **Authentication & User Management** (8 routes)
- **Communication** (15 routes)
- **Marketplace** (12 routes)
- **Activities & Discovery** (10 routes)
- **Jobs** (10 routes)
- **Academy & Learning** (14 routes)
- **Supplies & Equipment** (20 routes)
- **Equipment Rentals** (15 routes)
- **Analytics & Insights** (5 routes)
- **Search** (8 routes)
- **Financial Management** (11 routes)
- **Advertising & Promotions** (12 routes)
- **Maps & Location** (9 routes)
- **Settings Management** (4 routes)
- **Provider Management** (8 routes)
- **LocalPro Plus** (3 routes)
- **Logs & Monitoring** (8 routes)
- **Announcements** (3 routes)
- **Facility Care** (1 route)
- **Health & System** (1 route)

### **Documentation Files**
- **`API_CONSTANTS_USAGE_EXAMPLES.md`** - Comprehensive usage guide
- **`API_ROUTES_FIX_PROGRESS.md`** - Progress tracking
- **`API_HEADER_REQUIREMENTS.md`** - This file

## 🎯 **Implementation Checklist**

### **For New API Routes:**
- [ ] Use `makeAuthenticatedRequestWithEndpoint()` for simple endpoints
- [ ] Use `makeAuthenticatedRequestWithPath()` for dynamic endpoints
- [ ] Use `makePublicRequest()` for public endpoints
- [ ] Use `handleApiRoute()` for error handling
- [ ] Import from `@/lib/api-auth-utils`
- [ ] Use API endpoint constants (not hardcoded URLs)
- [ ] Test authentication flow
- [ ] Handle errors gracefully

### **For Client-Side Requests:**
- [ ] Use `createAuthFetchOptions()` for authenticated requests
- [ ] Use `createAuthHeaders()` for manual header creation
- [ ] Include proper error handling
- [ ] Test with valid session tokens

### **For Manual Header Creation:**
- [ ] `Content-Type: application/json` is included
- [ ] `Authorization: Bearer <actual-api-token>` is included
- [ ] Headers are in the correct order (Content-Type first)
- [ ] Use actual API token, not session.user.id
- [ ] Include timeout handling

## 🔍 **Verification & Testing**

### **Header Verification:**
1. **Check Network Tab**: Look for both headers in request
2. **Test Authentication**: Ensure Bearer token is valid
3. **Test Content-Type**: Verify JSON parsing works
4. **Error Handling**: Check for 401/403 responses
5. **Token Validation**: Verify actual API token is used

### **API Constants Verification:**
1. **Type Safety**: Ensure TypeScript autocomplete works
2. **Endpoint Validation**: Verify endpoint constants exist
3. **URL Construction**: Check generated URLs are correct
4. **Parameter Handling**: Test dynamic path parameters
5. **Query Parameters**: Verify query string construction

### **Error Handling Verification:**
1. **Authentication Errors**: Test 401 responses
2. **Timeout Handling**: Test 30-second timeout
3. **Network Errors**: Test connection failures
4. **Validation Errors**: Test input validation
5. **Server Errors**: Test 500 responses

## 📚 **Related Documentation**

- **[API_CONSTANTS_USAGE_EXAMPLES.md](./API_CONSTANTS_USAGE_EXAMPLES.md)** - Comprehensive usage guide with examples
- **[API_ROUTES_FIX_PROGRESS.md](./API_ROUTES_FIX_PROGRESS.md)** - Progress tracking and completion status
- **[src/lib/api-auth-utils.ts](./src/lib/api-auth-utils.ts)** - Main authentication utilities
- **[src/lib/auth-utils.ts](./src/lib/auth-utils.ts)** - Client-side helpers
- **[src/lib/api.ts](./src/lib/api.ts)** - API endpoint constants
- **[src/lib/server-session.ts](./src/lib/server-session.ts)** - Session management

## 🚀 **Quick Start Guide**

### **1. Choose the Right Function:**
```typescript
// Simple endpoint
makeAuthenticatedRequestWithEndpoint(request, 'endpointName', options)

// Dynamic endpoint
makeAuthenticatedRequestWithPath(request, 'endpointName', [params], query, options)

// Public endpoint
makePublicRequest('endpointName', options)
```

### **2. Handle Errors:**
```typescript
const result = await handleApiRoute(async () => {
  // Your API logic here
}, "Context description");
```

### **3. Test Your Implementation:**
```typescript
// Test with curl
curl -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/your-endpoint
```

**The authentication system is now production-ready with enterprise-grade security and maintainability!**
