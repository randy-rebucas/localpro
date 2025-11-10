# User Settings Implementation Guide

## Overview

This document outlines the implementation of user settings throughout the application. User settings allow individual users to customize their experience, privacy, notifications, communication preferences, and more.

## Implementation Status

### ✅ Completed

1. **Utility Functions** (`src/lib/user-settings-utils.ts`)
   - Comprehensive helper functions for accessing all user settings categories
   - Privacy settings helpers
   - Notification settings helpers
   - Communication settings helpers
   - Service settings helpers
   - Payment settings helpers
   - Security settings helpers
   - App settings helpers
   - Analytics settings helpers

2. **Date/Time Formatting Utilities** (`src/lib/date-time-utils.ts`)
   - `formatDateWithUserSettings()` - Formats dates according to user's date format preference
   - `formatTimeWithUserSettings()` - Formats time according to user's time format (12h/24h)
   - `formatDateTimeWithUserSettings()` - Formats both date and time together

3. **Payment Method Integration**
   - Service booking page now uses user's preferred payment method as default
   - Wallet page uses user's preferred currency (with app settings fallback)

4. **Currency Preference**
   - Wallet page prioritizes user's currency preference over app settings
   - Falls back to app settings if user preference not set

### 🔄 In Progress / To Be Applied

1. **Privacy Settings**
   - Profile visibility controls
   - Show/hide phone number, email, location, rating, portfolio
   - Allow/deny direct messages, job invitations, referral requests
   - **Location**: `src/components/user-profile.tsx`, profile display components

2. **Notification Settings**
   - Check notification preferences before sending push notifications
   - Check notification preferences before sending email notifications
   - Check notification preferences before sending SMS notifications
   - **Location**: Notification service/API calls, notification components

3. **Communication Settings**
   - Apply date/time formatting throughout the app
   - Apply timezone settings
   - Apply language preferences
   - Auto-reply functionality for messages
   - **Location**: All date/time displays, message components

4. **Service Settings**
   - Working hours display and validation
   - Auto-accept jobs functionality
   - Service radius defaults
   - Job value range filtering
   - Emergency service settings
   - **Location**: Service booking pages, job matching logic

5. **Payment Settings**
   - Auto-withdraw functionality
   - Invoice settings (tax inclusion, tax rate, template)
   - **Location**: Wallet page, invoice generation

6. **Security Settings**
   - 2FA enforcement
   - Login alerts
   - Session timeout enforcement
   - Password change reminders
   - **Location**: Authentication components, security pages

7. **App Settings**
   - Theme application (light/dark/auto)
   - Font size adjustments
   - Sound effects control
   - Haptic feedback control
   - Auto-save functionality
   - Data usage settings (image/video quality)
   - **Location**: Root layout, global components

8. **Analytics Settings**
   - Usage data sharing control
   - Location data sharing control
   - Performance data sharing control
   - Personalized recommendations
   - **Location**: Analytics service, recommendation engine

## Usage Examples

### Privacy Settings

```typescript
import { useUserSettings } from "@/hooks/useUserSettings";
import { shouldShowProfileField, allowsDirectMessages } from "@/lib/user-settings-utils";

function ProfileDisplay({ profile, viewerIsContact }) {
  const { settings: userSettings } = useUserSettings();
  
  return (
    <div>
      {shouldShowProfileField("phoneNumber", userSettings, viewerIsContact) && (
        <div>Phone: {profile.phoneNumber}</div>
      )}
      {shouldShowProfileField("email", userSettings, viewerIsContact) && (
        <div>Email: {profile.email}</div>
      )}
      {allowsDirectMessages(userSettings) && (
        <button>Send Message</button>
      )}
    </div>
  );
}
```

### Notification Settings

```typescript
import { useUserSettings } from "@/hooks/useUserSettings";
import { shouldSendPushNotification, shouldSendEmailNotification } from "@/lib/user-settings-utils";

async function sendNotification(userId, type, data) {
  const userSettings = await getUserSettings(userId);
  
  if (shouldSendPushNotification(type, userSettings)) {
    await sendPushNotification(userId, data);
  }
  
  if (shouldSendEmailNotification(type, userSettings)) {
    await sendEmailNotification(userId, data);
  }
}
```

### Date/Time Formatting

```typescript
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatDateWithUserSettings, formatTimeWithUserSettings } from "@/lib/date-time-utils";

function DateDisplay({ date }) {
  const { settings: userSettings } = useUserSettings();
  
  return (
    <div>
      <div>Date: {formatDateWithUserSettings(date, userSettings)}</div>
      <div>Time: {formatTimeWithUserSettings(date, userSettings)}</div>
    </div>
  );
}
```

### Payment Method

```typescript
import { useUserSettings } from "@/hooks/useUserSettings";
import { getPreferredPaymentMethod } from "@/lib/user-settings-utils";

function PaymentForm() {
  const { settings: userSettings } = useUserSettings();
  const preferredMethod = getPreferredPaymentMethod(userSettings);
  
  const [paymentMethod, setPaymentMethod] = useState(preferredMethod);
  
  // ... rest of form
}
```

### Currency Preference

```typescript
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getUserPreferredCurrency } from "@/lib/user-settings-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

function CurrencyDisplay({ amount }) {
  const { settings: userSettings } = useUserSettings();
  const { settings: appSettings } = useAppSettings();
  
  const currency = getUserPreferredCurrency(userSettings) || getDefaultCurrency(appSettings);
  
  return formatCurrency(amount, currency);
}
```

## Settings Categories

### 1. Privacy Settings
- `profileVisibility`: "public" | "contacts_only" | "private"
- `showPhoneNumber`: boolean
- `showEmail`: boolean
- `showLocation`: boolean
- `showRating`: boolean
- `showPortfolio`: boolean
- `allowDirectMessages`: boolean
- `allowJobInvitations`: boolean (non-client only)
- `allowReferralRequests`: boolean (non-client only)

### 2. Notifications
- **Push**: enabled, newMessages, jobMatches, bookingUpdates, paymentUpdates, referralUpdates, systemUpdates, marketing
- **Email**: enabled, newMessages, jobMatches, bookingUpdates, paymentUpdates, referralUpdates, systemUpdates, marketing, weeklyDigest, monthlyReport
- **SMS**: enabled, urgentMessages, bookingReminders, paymentAlerts, securityAlerts

### 3. Communication
- `preferredLanguage`: "en" | "fil" | "es" | "zh" | "ja" | "ko"
- `timezone`: string (e.g., "Asia/Manila")
- `dateFormat`: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
- `timeFormat`: "12h" | "24h"
- `currency`: "PHP" | "USD" | "EUR" | "GBP" | "JPY" | "KRW" | "CNY"
- `autoReply`: { enabled: boolean, message: string }

### 4. Service (Provider Settings)
- `defaultServiceRadius`: number
- `autoAcceptJobs`: boolean
- `minimumJobValue`: number
- `maximumJobValue`: number
- `preferredJobTypes`: array
- `workingHours`: { start: string, end: string, days: array }
- `emergencyService`: { enabled: boolean, surcharge: number }

### 5. Payment
- `preferredPaymentMethod`: "paypal" | "paymaya" | "gcash" | "bank_transfer" | "cash"
- `autoWithdraw`: { enabled: boolean, threshold: number, frequency: "daily" | "weekly" | "monthly" }
- `invoiceSettings`: { includeTax: boolean, taxRate: number, invoiceTemplate: "standard" | "detailed" | "minimal" }

### 6. Security
- `twoFactorAuth`: { enabled: boolean, method: "sms" | "email" | "authenticator" }
- `loginAlerts`: { enabled: boolean, newDevice: boolean, suspiciousActivity: boolean }
- `sessionTimeout`: number (hours)
- `passwordChangeReminder`: { enabled: boolean, frequency: number (days) }

### 7. App
- `theme`: "light" | "dark" | "auto"
- `fontSize`: "small" | "medium" | "large"
- `soundEffects`: { enabled: boolean, volume: number (0-100) }
- `hapticFeedback`: { enabled: boolean }
- `autoSave`: { enabled: boolean, interval: number (seconds) }
- `dataUsage`: { imageQuality: "low" | "medium" | "high", videoQuality: "low" | "medium" | "high", autoDownload: boolean }

### 8. Analytics
- `shareUsageData`: boolean
- `shareLocationData`: boolean
- `sharePerformanceData`: boolean
- `personalizedRecommendations`: boolean

## Next Steps

1. Apply privacy settings in profile display components
2. Integrate notification preferences in notification service
3. Apply date/time formatting throughout the app
4. Implement working hours validation
5. Apply theme and font size settings globally
6. Implement auto-withdraw functionality
7. Add 2FA enforcement
8. Apply session timeout

## Files Created/Modified

### New Files
- `src/lib/user-settings-utils.ts` - Utility functions for user settings
- `src/lib/date-time-utils.ts` - Date/time formatting with user preferences
- `docs/USER_SETTINGS_IMPLEMENTATION.md` - This documentation

### Modified Files
- `src/app/(authenticated)/marketplace/services/[id]/book/page.tsx` - Uses preferred payment method
- `src/app/(authenticated)/wallet/page.tsx` - Uses user currency preference

## API Integration

User settings are managed through:
- `GET /api/settings/user` - Fetch user settings
- `PUT /api/settings/user` - Update user settings
- `PATCH /api/settings/user/:category` - Update specific category
- `POST /api/settings/user/reset` - Reset to defaults

The `useUserSettings` hook handles all API interactions automatically.

