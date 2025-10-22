# API Header Requirements

## ✅ **CRITICAL REQUIREMENTS**

All external API requests MUST include these headers in the correct order:

### 1. **Content-Type Header**
```typescript
"Content-Type": "application/json"
```

### 2. **Authorization Header**
```typescript
"Authorization": `Bearer ${session.user.id}`
```

## 📋 **Standard Header Pattern**

```typescript
const response = await fetch(`${API_BASE_URL}/api/endpoint`, {
  method: 'GET/POST/PUT/DELETE',
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.user.id}`,
  },
  body: JSON.stringify(data), // for POST/PUT
  signal: AbortSignal.timeout(30000)
});
```

## 🔧 **Helper Functions Available**

### Client-Side (Browser)
```typescript
import { createAuthFetchOptions } from "@/lib/auth-utils";

// Automatically includes both headers
const response = await fetch(url, createAuthFetchOptions(options));
```

### Server-Side (API Routes)
```typescript
import { createExternalApiHeaders } from "@/lib/auth-utils";

// Create standardized headers
const headers = createExternalApiHeaders(session.user.id);
const response = await fetch(url, { headers, ...options });
```

## ⚠️ **Common Issues Fixed**

### ❌ **Before (Incorrect)**
```typescript
// Missing Content-Type
headers: {
  "Authorization": `Bearer ${token}`,
}

// Missing Authorization
headers: {
  "Content-Type": "application/json",
}

// Wrong order
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
}
```

### ✅ **After (Correct)**
```typescript
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`,
}
```

## 🧪 **Testing Headers**

### Test with curl:
```bash
curl -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/endpoint
```

### Test in browser console:
```javascript
fetch('/api/endpoint', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  }
})
```

## 📁 **Files Updated**

The following files have been updated to ensure proper header requirements:

1. **`src/lib/auth-utils.ts`** - Added helper functions
2. **`src/app/api/communication/notifications/route.ts`** - Fixed headers
3. **`src/app/api/marketplace/services/route.ts`** - Fixed headers
4. **`src/app/api/marketplace/bookings/route.ts`** - Fixed headers
5. **`src/app/api/jobs/route.ts`** - Fixed headers

## 🎯 **Implementation Checklist**

When creating new API routes, ensure:

- [ ] `Content-Type: application/json` is included
- [ ] `Authorization: Bearer <token>` is included
- [ ] Headers are in the correct order (Content-Type first)
- [ ] Use helper functions when possible
- [ ] Test with proper headers
- [ ] Handle authentication errors gracefully

## 🔍 **Verification**

To verify headers are working correctly:

1. **Check Network Tab**: Look for both headers in request
2. **Test Authentication**: Ensure Bearer token is valid
3. **Test Content-Type**: Verify JSON parsing works
4. **Error Handling**: Check for 401/403 responses

## 📚 **Related Documentation**

- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Complete implementation guide
- [src/lib/auth-utils.ts](./src/lib/auth-utils.ts) - Helper functions
- [src/lib/api.ts](./src/lib/api.ts) - API configuration
