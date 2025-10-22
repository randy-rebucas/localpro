# 🔧 Environment Variables Setup

This document provides a comprehensive guide for setting up environment variables for the LocalPro application.

## 🚀 Quick Start

1. **Copy the environment template:**
   ```bash
   cp env.example .env.local
   ```

2. **Fill in your values** in `.env.local`
3. **Restart your development server**

## 📁 Environment Files

| File | Purpose | Version Control |
|------|---------|----------------|
| `env.example` | Template with all variables | ✅ Safe to commit |
| `env.development` | Development-specific template | ✅ Safe to commit |
| `.env.local` | Your actual environment variables | ❌ **Never commit** |

## 🔐 Security Best Practices

### ✅ DO
- Use strong, unique secrets for production
- Rotate secrets regularly
- Use different secrets for different environments
- Keep `.env.local` out of version control

### ❌ DON'T
- Never commit `.env.local` to version control
- Don't use weak or default secrets
- Don't share secrets in chat or email
- Don't hardcode secrets in your code

## 🛠️ Setup Instructions

### 1. Development Setup
```bash
# Copy the development template
cp env.development .env.local

# Edit with your values
nano .env.local

# Start development server
npm run dev
```

### 2. Production Setup
```bash
# Copy the full template
cp env.example .env.local

# Fill in production values
nano .env.local

# Deploy to your hosting platform
```

## 📋 Required Variables

These variables are **required** for the application to function:

```env
# Authentication (REQUIRED)
JWT_SECRET="your-super-secret-jwt-key-here"
SESSION_SECRET="your-session-secret-key-here"

# API Configuration (REQUIRED)
API_BASE_URL="https://localpro-super-app.onrender.com"
```

## 🔧 Optional Variables

These variables are **optional** but recommended:

```env
# Application Info
NEXT_PUBLIC_APP_NAME="LocalPro"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Development
DEBUG="true"
ENABLE_MOCK_DATA="true"

# Features
FEATURE_MESSAGING="true"
FEATURE_PAYMENTS="true"
```

## 🌍 Environment-Specific Configuration

### Development
```env
NODE_ENV="development"
DEBUG="true"
ENABLE_MOCK_DATA="true"
API_TIMEOUT="10000"
```

### Production
```env
NODE_ENV="production"
DEBUG="false"
ENABLE_MOCK_DATA="false"
API_TIMEOUT="5000"
```

## 🔍 Environment Variable Categories

### 🏗️ Application Configuration
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_VERSION` - Application version
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NODE_ENV` - Environment (development/production)

### 🌐 API Configuration
- `API_BASE_URL` - External API base URL
- `API_TIMEOUT` - API request timeout
- `API_RETRY_ATTEMPTS` - Number of retry attempts
- `API_RETRY_DELAY` - Delay between retries

### 🔐 Authentication & Security
- `JWT_SECRET` - JWT signing secret
- `SESSION_SECRET` - Session encryption secret
- `ENCRYPTION_KEY` - General encryption key
- `SESSION_MAX_AGE` - Session expiration time

### 🗄️ Database Configuration
- `DATABASE_URL` - Database connection string
- `DB_POOL_MIN` - Minimum connection pool size
- `DB_POOL_MAX` - Maximum connection pool size

### 🗺️ External Services
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `GOOGLE_MAPS_API_KEY` - Server-side Google Maps API key
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration

### 💳 Payment Gateways
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret
- `PAYMAYA_PUBLIC_KEY` - PayMaya public key
- `PAYMAYA_SECRET_KEY` - PayMaya secret key

### 📱 Communication Services
- `SMS_API_KEY` - SMS service API key
- `EMAIL_SERVICE_API_KEY` - Email service API key
- `FCM_SERVER_KEY` - Firebase Cloud Messaging key

### 📁 File Storage
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name

### 📊 Analytics & Monitoring
- `NEXT_PUBLIC_GA_ID` - Google Analytics ID
- `SENTRY_DSN` - Sentry error tracking DSN

### 🚩 Feature Flags
- `FEATURE_MESSAGING` - Enable/disable messaging
- `FEATURE_PAYMENTS` - Enable/disable payments
- `FEATURE_ANALYTICS` - Enable/disable analytics
- `FEATURE_NOTIFICATIONS` - Enable/disable notifications
- `FEATURE_FILE_UPLOAD` - Enable/disable file uploads

## 🔧 Type-Safe Environment Access

The application provides type-safe access to environment variables:

```typescript
import { 
  APP_CONFIG, 
  API_CONFIG, 
  AUTH_CONFIG, 
  FEATURE_FLAGS 
} from '@/lib/env';

// Type-safe access
console.log(APP_CONFIG.name);
console.log(API_CONFIG.baseUrl);
console.log(AUTH_CONFIG.jwtSecret);
console.log(FEATURE_FLAGS.messaging);
```

## 🚨 Troubleshooting

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

## 🚀 Deployment

### Platform-Specific Setup

#### Vercel
```bash
vercel env add JWT_SECRET
vercel env add API_BASE_URL
vercel env add SESSION_SECRET
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
ENV SESSION_SECRET=your-session-secret
```

## 📚 Additional Resources

- [Environment Setup Guide](./src/docs/ENVIRONMENT_SETUP.md)
- [API Authentication Guide](./src/docs/API_AUTHENTICATION.md)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## 🤝 Contributing

When adding new environment variables:

1. Add to `env.example` template
2. Add to `src/lib/env.ts` with proper typing
3. Update this documentation
4. Test with missing variables to ensure proper fallbacks

## 📞 Support

If you encounter issues with environment setup:

1. Check the troubleshooting section above
2. Verify your `.env.local` file exists and has the correct format
3. Ensure all required variables are set
4. Check the console for specific error messages
