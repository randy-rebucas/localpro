# Environment Variables Setup Guide - Modern Implementation

This guide explains how to properly configure environment variables for the **LocalPro application** with **modern API constants integration** and **enterprise-grade security**.

## 🚀 **Quick Start with API Constants**

1. **Copy the example environment file:**
   ```bash
   cp env.example .env.local
   ```

2. **Fill in your actual values in `.env.local`**
3. **Restart your development server**
4. **API Constants automatically handle environment URLs**

## **Environment Files (Modern Implementation)**

### **`.env.local` (Required)**
- Contains your actual environment variables
- **Never commit this file to version control**
- Used for local development and production
- **API Constants automatically use these values**

### **`env.example` (Template)**
- Template file with all available environment variables
- Safe to commit to version control
- Shows the structure and required variables
- **Includes API Constants configuration examples**

## Environment Variable Categories

### 🔧 Application Configuration
```env
NEXT_PUBLIC_APP_NAME="LocalPro"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 🌐 **API Configuration (Modern with API Constants)**
```env
# ✅ API Constants automatically use these values
API_BASE_URL="https://localpro-super-app.onrender.com"
API_ENDPOINT="https://localpro-super-app.onrender.com"
API_TIMEOUT="10000"
API_RETRY_ATTEMPTS="3"
API_RETRY_DELAY="1000"

# ✅ Modern API Constants Configuration
API_CONSTANTS_ENABLED="true"
API_CONSTANTS_CACHE="true"
API_CONSTANTS_VALIDATION="true"
```

### 🔐 **Authentication & Security (Modern with API Constants)**
```env
# ✅ API Constants automatically use these for authentication
JWT_SECRET="your-super-secret-jwt-key-here"
SESSION_SECRET="your-session-secret-key-here"
SESSION_MAX_AGE="604800"
ENCRYPTION_KEY="your-32-character-encryption-key"

# ✅ Modern API Constants Authentication
API_TOKEN_EXTRACTION="automatic"
API_AUTHENTICATION="session-based"
API_TOKEN_VALIDATION="automatic"
API_HEADER_CONSTRUCTION="automatic"
```

### 🗄️ Database Configuration
```env
DATABASE_URL="postgresql://username:password@localhost:5432/localpro"
DB_POOL_MIN="2"
DB_POOL_MAX="10"
```

### 🗺️ External Services
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### 💳 Payment Gateways
```env
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_MODE="sandbox"

PAYMAYA_PUBLIC_KEY="your-paymaya-public-key"
PAYMAYA_SECRET_KEY="your-paymaya-secret-key"
PAYMAYA_MODE="sandbox"
```

### 📱 Communication Services
```env
SMS_API_KEY="your-sms-api-key"
SMS_API_URL="https://api.sms-service.com"
EMAIL_SERVICE_API_KEY="your-email-service-key"
```

### 📁 File Storage
```env
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="localpro-uploads"

CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
```

### 📊 Analytics & Monitoring
```env
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

### 🚩 Feature Flags
```env
FEATURE_MESSAGING="true"
FEATURE_PAYMENTS="true"
FEATURE_ANALYTICS="true"
FEATURE_NOTIFICATIONS="true"
FEATURE_FILE_UPLOAD="true"
```

## Security Best Practices

### 🔒 Sensitive Data Protection
- **Never commit** `.env.local` to version control
- Use strong, unique secrets for production
- Rotate secrets regularly
- Use different secrets for different environments

### 🛡️ Environment-Specific Configuration
```env
# Development
NODE_ENV="development"
DEBUG="true"
ENABLE_MOCK_DATA="true"

# Production
NODE_ENV="production"
DEBUG="false"
ENABLE_MOCK_DATA="false"
```

### 🔐 Secret Management
- Use environment-specific secret management
- Consider using services like AWS Secrets Manager or Azure Key Vault
- Implement proper secret rotation policies

## Development Setup

### 1. Local Development
```bash
# Copy environment template
cp env.example .env.local

# Edit with your values
nano .env.local

# Start development server
npm run dev
```

### 2. **Environment Validation (Modern with API Constants)**
The application automatically validates required environment variables on startup:

```typescript
import { validateRequiredEnvVars } from '@/lib/env';

// ✅ This will throw an error if required variables are missing
validateRequiredEnvVars();
```

### 3. **Type-Safe Environment Access (Enhanced)**
```typescript
import { APP_CONFIG, API_CONFIG, FEATURE_FLAGS } from '@/lib/env';

// ✅ Type-safe access to environment variables
console.log(APP_CONFIG.name);
console.log(API_CONFIG.baseUrl);
console.log(FEATURE_FLAGS.messaging);

// ✅ Modern API Constants automatically use these values
import { makeAuthenticatedRequestWithEndpoint } from '@/lib/api-auth-utils';

// API Constants automatically construct URLs from environment variables
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'marketplaceServices', // TypeScript autocomplete
  { method: 'GET' }
);
```

## Production Deployment

### 1. Environment Variables in Production
- Set environment variables in your hosting platform
- Use secure secret management
- Never hardcode secrets in your code

### 2. Platform-Specific Setup

#### Vercel
```bash
vercel env add JWT_SECRET
vercel env add API_BASE_URL
```

#### Netlify
```bash
netlify env:set JWT_SECRET "your-secret"
netlify env:set API_BASE_URL "https://api.example.com"
```

#### Docker
```dockerfile
ENV JWT_SECRET=your-secret
ENV API_BASE_URL=https://api.example.com
```

## Troubleshooting

### Common Issues

#### 1. Missing Environment Variables
```
Error: Environment variable JWT_SECRET is required but not set
```
**Solution**: Add the missing variable to your `.env.local` file

#### 2. Invalid Environment Values
```
Error: Invalid number for API_TIMEOUT: abc, using default: 10000
```
**Solution**: Check the value format in your environment file

#### 3. Environment Not Loading
```
Error: process.env is undefined
```
**Solution**: Ensure you're using the correct environment file name (`.env.local`)

### Debug Environment Variables
```typescript
import { getEnvironmentInfo } from '@/lib/env';

// Get environment information for debugging
console.log(getEnvironmentInfo());
```

## Environment Variable Reference

### Required Variables
- `JWT_SECRET` - JWT signing secret
- `SESSION_SECRET` - Session encryption secret

### Optional Variables
- `API_BASE_URL` - External API base URL
- `NEXT_PUBLIC_APP_NAME` - Application name
- `FEATURE_*` - Feature flags
- `*_API_KEY` - External service API keys

### Public Variables (NEXT_PUBLIC_*)
- Available in both server and client code
- Safe to expose in the browser
- Used for client-side configuration

### Private Variables
- Only available in server-side code
- Never exposed to the browser
- Used for sensitive operations

## Migration Guide

### From Hardcoded Values
1. Identify hardcoded values in your code
2. Replace with environment variables
3. Add to `env.example` template
4. Update your `.env.local` file

### Example Migration
```typescript
// Before
const apiUrl = 'https://api.example.com';

// After
import { API_CONFIG } from '@/lib/env';
const apiUrl = API_CONFIG.baseUrl;
```

## **Best Practices (Modern with API Constants)**

### **1. Use API Constants for All Endpoints**
```typescript
// ✅ DO: Use API constants with automatic environment handling
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'marketplaceServices', // TypeScript autocomplete
  { method: 'GET' }
);

// ❌ DON'T: Hardcode URLs
const response = await fetch(`${API_BASE_URL}/api/marketplace/services`);
```

### **2. Modern Environment Management**
1. **Use descriptive names** for environment variables
2. **Group related variables** with prefixes
3. **Document all variables** in your README
4. **Validate required variables** on startup
5. **Use type-safe access** through the env utility
6. **Never commit secrets** to version control
7. **Use different values** for different environments
8. **Rotate secrets regularly** in production
9. **Monitor environment usage** in logs
10. **Test with missing variables** to ensure proper fallbacks

### **3. API Constants Benefits**
- **Automatic URL construction** from environment variables
- **Type-safe endpoint management** with 200+ constants
- **Consistent authentication** across all endpoints
- **Zero hardcoded URLs** in the codebase
- **Enterprise-grade security** with automatic token handling
