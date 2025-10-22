# LocalPro Implementation Guide for Cursor

## Architecture Overview

This is a **Next.js frontend application** that acts as a **proxy layer** to an external API. The application follows this flow:

```
Client (Browser) → Next.js API Route → External API (https://localpro-super-app.onrender.com) → Response
```

## Key Components

### 1. API Structure
- **Frontend API Routes**: Located in `src/app/api/`
- **External API**: Hosted at `https://localpro-super-app.onrender.com`
- **Authentication**: JWT-based with session management
- **Environment**: Development uses localhost:5000, Production uses onrender.com

### 2. Authentication Flow
- **Session Management**: JWT tokens stored in httpOnly cookies
- **Bearer Token**: Used for API authentication
- **Middleware**: Handles route protection and authentication checks
- **Session Data**: Stored in encrypted JWT tokens

### 3. API Proxy Pattern
All API routes follow this pattern:
```typescript
// 1. Get session/authentication
const session = await getServerSession(request);

// 2. Validate authentication
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// 3. Forward request to external API
const response = await fetch(`${API_BASE_URL}/api/endpoint`, {
  method: 'GET/POST/PUT/DELETE',
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.user.id}`,
  },
  body: JSON.stringify(data), // for POST/PUT
  signal: AbortSignal.timeout(30000)
});

// 4. Handle response
if (!response.ok) {
  return NextResponse.json(
    { error: `External service error: ${response.status}` },
    { status: response.status }
  );
}

const data = await response.json();
return NextResponse.json(data);
```

**⚠️ CRITICAL: Header Requirements**
All external API requests MUST include:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Header Order**: Always put `Content-Type` first, then `Authorization` for consistency.

## Implementation Guidelines

### When Adding New API Endpoints

1. **Create the API Route File**
   - Location: `src/app/api/[feature]/route.ts`
   - Follow the existing pattern for error handling
   - Include proper authentication checks
   - Add timeout handling (30 seconds)

2. **Update API Endpoints List**
   - Add new endpoint to `src/lib/api.ts` in `API_ENDPOINTS` object
   - Use consistent naming convention
   - Include both client and server endpoints

3. **Environment Configuration**
   - Update `src/lib/env.ts` if new environment variables are needed
   - Add to `env.example` for documentation
   - Ensure proper client/server variable separation

4. **Authentication Requirements**
   - Check if endpoint requires authentication
   - Use `getServerSession(request)` for session validation
   - Include Bearer token in external API calls
   - Handle unauthorized access properly

### When Adding New Features

1. **Frontend Components**
   - Create components in `src/components/`
   - Use existing UI components from `src/components/ui/`
   - Follow the established design patterns
   - Include proper TypeScript types

2. **API Integration**
   - Use the `apiRequest` helper from `src/lib/api.ts`
   - Handle loading states and errors
   - Implement proper error boundaries
   - Use SWR for data fetching when appropriate

3. **State Management**
   - Use React hooks for local state
   - Implement proper error handling
   - Include loading states
   - Handle authentication state

### External API Integration

1. **API Base URL Configuration**
   - Development: `http://localhost:5000` (if local backend exists)
   - Production: `https://localpro-super-app.onrender.com`
   - Configure in `.env.local` file

2. **Request Headers**
   - Always include `Authorization: Bearer ${token}`
   - Set `Content-Type: application/json`
   - Include timeout handling

3. **Error Handling**
   - Handle network errors (503 Service Unavailable)
   - Handle timeouts (504 Gateway Timeout)
   - Provide user-friendly error messages
   - Log errors for debugging

### Authentication Implementation

1. **Session Management**
   - Use `getServerSession(request)` for server-side
   - Use `useAuth()` hook for client-side
   - Handle session expiration gracefully
   - Implement proper logout functionality

2. **Route Protection**
   - Update `src/middleware.ts` for new protected routes
   - Add route patterns to `ROUTE_PATTERNS`
   - Handle different authentication levels (public, protected, admin)

3. **Token Handling**
   - Bearer tokens for API calls
   - Session cookies for web authentication
   - Proper token refresh mechanisms
   - Secure token storage

### Database Integration

1. **External API Calls**
   - All data operations go through external API
   - No direct database connections in frontend
   - Handle API response formats consistently
   - Implement proper data validation

2. **Data Validation**
   - Use Zod schemas for input validation
   - Validate API responses
   - Handle malformed data gracefully
   - Implement proper error messages

### File Upload Implementation

1. **File Handling**
   - Use external API for file uploads
   - Implement proper file validation
   - Handle upload progress
   - Support multiple file types

2. **Storage Configuration**
   - Configure AWS S3 or Cloudinary
   - Set up proper CORS policies
   - Implement secure file access
   - Handle file cleanup

### Payment Integration

1. **Payment Gateways**
   - PayPal integration
   - PayMaya integration
   - Handle webhook events
   - Implement proper security

2. **Transaction Handling**
   - Secure payment processing
   - Handle payment failures
   - Implement refund mechanisms
   - Maintain transaction records

## Development Workflow

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with proper values

# Start development server
npm run dev
```

### 2. API Testing
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test with authentication
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/marketplace/services
```

### 3. Code Quality
```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Format code
npm run format
```

## Common Patterns

### 1. API Route Template
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const response = await fetch(`${API_BASE_URL}/api/endpoint?${queryString}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.user.id}`,
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `External service error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 2. Client-Side API Call
```typescript
import { apiRequest } from "@/lib/api";

const fetchData = async () => {
  try {
    const data = await apiRequest<ResponseType>('/api/endpoint');
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

### 3. Error Handling
```typescript
// Server-side error handling
if (error instanceof Error) {
  if (error.name === 'AbortError') {
    errorMessage = "Request timeout";
    statusCode = 504;
  } else if (error.message.includes('fetch failed')) {
    errorMessage = "Unable to connect to external service";
    statusCode = 503;
  }
}
```

## Security Considerations

1. **Authentication**
   - Always validate sessions
   - Use secure token storage
   - Implement proper logout
   - Handle token expiration

2. **Input Validation**
   - Validate all inputs with Zod
   - Sanitize user data
   - Prevent injection attacks
   - Handle malformed requests

3. **API Security**
   - Use HTTPS for all requests
   - Implement rate limiting
   - Handle CORS properly
   - Secure environment variables

## Performance Optimization

1. **Caching**
   - Implement response caching
   - Use SWR for client-side caching
   - Cache authentication checks
   - Optimize API calls

2. **Error Handling**
   - Implement retry mechanisms
   - Handle network failures
   - Provide fallback options
   - Log errors properly

## Testing Strategy

1. **API Testing**
   - Test all endpoints
   - Verify authentication
   - Test error scenarios
   - Validate response formats

2. **Integration Testing**
   - Test external API connections
   - Verify data flow
   - Test error handling
   - Validate security measures

## Deployment Considerations

1. **Environment Variables**
   - Set production API URLs
   - Configure authentication secrets
   - Set up external service keys
   - Enable proper logging

2. **Monitoring**
   - Implement health checks
   - Monitor API performance
   - Track error rates
   - Set up alerts

This guide provides a comprehensive framework for implementing new functionalities in the LocalPro application while maintaining consistency with the existing architecture and patterns.
