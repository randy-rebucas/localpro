# API Authentication Guide

This document explains how to use Bearer token authentication with the LocalPro API.

## Authentication Methods

### 1. Session Cookie Authentication (Web App)
- Used by the web application
- Automatically handled by the browser
- No additional setup required

### 2. Bearer Token Authentication (API Clients)
- Required for all secure API endpoints
- Must be included in the `Authorization` header
- Format: `Authorization: Bearer <token>`

## Getting a Bearer Token

### Step 1: Authenticate with Phone Number
```bash
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

### Step 2: Verify Code and Get Session
```bash
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }'
```

### Step 3: Generate Bearer Token
```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<session_cookie>"
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d",
  "tokenType": "Bearer"
}
```

## Using Bearer Tokens

### Example API Call
```bash
curl -X GET http://localhost:3000/api/marketplace/services \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript/TypeScript Example
```typescript
import { createBearerTokenOptions } from '@/lib/auth-utils';

const token = 'your-bearer-token-here';

const response = await fetch('/api/marketplace/services', 
  createBearerTokenOptions(token, {
    method: 'GET'
  })
);

const data = await response.json();
```

## Protected Endpoints

The following endpoints require Bearer token authentication:

### Marketplace
- `GET /api/marketplace/services`
- `POST /api/marketplace/services`
- `GET /api/marketplace/services/[id]`
- `PUT /api/marketplace/services/[id]`
- `DELETE /api/marketplace/services/[id]`

### Academy
- `GET /api/academy/courses`
- `POST /api/academy/courses`
- `GET /api/academy/courses/[id]`
- `PUT /api/academy/courses/[id]`
- `DELETE /api/academy/courses/[id]`

### Rentals
- `GET /api/rentals`
- `POST /api/rentals`
- `GET /api/rentals/[id]`
- `PUT /api/rentals/[id]`
- `DELETE /api/rentals/[id]`

### Supplies
- `GET /api/supplies`
- `POST /api/supplies`
- `GET /api/supplies/[id]`
- `PUT /api/supplies/[id]`
- `DELETE /api/supplies/[id]`

### Finance
- `GET /api/finance/overview`
- `GET /api/finance/transactions`
- `POST /api/finance/transactions`

### And many more...

## Public Endpoints (No Authentication Required)

These endpoints do not require authentication:

- `POST /api/auth/send-code`
- `POST /api/auth/verify-code`
- `GET /api/health`
- `GET /api/academy/categories`
- `GET /api/rentals/categories`
- `GET /api/supplies/categories`
- `GET /api/ads/categories`

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Bearer token required"
}
```

### 401 Invalid Token
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

## Token Validation

You can validate a Bearer token by making a GET request to the token endpoint:

```bash
curl -X GET http://localhost:3000/api/auth/token \
  -H "Authorization: Bearer <your-token>"
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "isVerified": true
  }
}
```

## Security Notes

1. **Token Expiration**: Bearer tokens expire after 7 days
2. **Secure Storage**: Store tokens securely in your application
3. **HTTPS**: Always use HTTPS in production
4. **Token Rotation**: Consider implementing token rotation for enhanced security
5. **Rate Limiting**: API endpoints are rate-limited to prevent abuse

## Migration from Session Cookies

If you're migrating from session cookie authentication:

1. Update your API calls to include the `Authorization` header
2. Use the `createBearerTokenOptions` helper function
3. Handle 401 responses by redirecting to authentication
4. Store tokens securely in your application state
