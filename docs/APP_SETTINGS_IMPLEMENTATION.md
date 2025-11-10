# App Settings Implementation Documentation

This document provides comprehensive documentation of all app settings values that have been implemented and utilized throughout the LocalPro Super App.

## Table of Contents

1. [Overview](#overview)
2. [Settings Categories](#settings-categories)
3. [Implementation Details](#implementation-details)
4. [Usage Examples](#usage-examples)
5. [API Reference](#api-reference)

## Overview

The app settings system provides centralized configuration management for the entire application. All settings are fetched from the API and used throughout the application to control behavior, features, and user experience.

### Key Files

- **Hooks**: `src/hooks/useAppSettings.ts`, `src/hooks/useUserSettings.ts`
- **Utilities**: `src/lib/settings-utils.ts`
- **Components**: 
  - `src/components/maintenance-mode.tsx`
  - `src/components/force-update.tsx`
  - `src/components/business-info.tsx`
  - `src/components/ui/file-upload.tsx` (updated to use settings)

## Settings Categories

### 1. General Settings

#### Maintenance Mode
- **Path**: `appSettings.general.maintenanceMode`
- **Fields**:
  - `enabled` (boolean): Whether maintenance mode is active
  - `message` (string): Message to display to users
  - `estimatedEndTime` (Date): When maintenance is expected to end
- **Implementation**: `src/components/maintenance-mode.tsx`
- **Usage**: Automatically displayed in root layout when enabled

#### Force Update
- **Path**: `appSettings.general.forceUpdate`
- **Fields**:
  - `enabled` (boolean): Whether force update is required
  - `minVersion` (string): Minimum app version required
  - `message` (string): Message to display to users
- **Implementation**: `src/components/force-update.tsx`
- **Usage**: Automatically displayed in root layout when enabled

#### App Information
- **Path**: `appSettings.general`
- **Fields**:
  - `appName` (string): Application name
  - `appVersion` (string): Current app version
  - `environment` (string): Environment (development/staging/production)

### 2. Business Settings

#### Company Information
- **Path**: `appSettings.business`
- **Fields**:
  - `companyName` (string)
  - `companyEmail` (string)
  - `companyPhone` (string)
  - `companyAddress` (object): Street, city, state, zipCode, country
- **Implementation**: `src/components/business-info.tsx`
- **Utility Functions**:
  - `getBusinessInfo(appSettings)`
  - `getSupportChannels(appSettings)`
  - `isSupportChannelEnabled(channel, appSettings)`

#### Business Hours
- **Path**: `appSettings.business.businessHours`
- **Fields**:
  - `timezone` (string): Business timezone
  - `schedule` (array): Array of schedule objects with:
    - `day` (string): Day of week
    - `startTime` (string): Opening time (HH:mm)
    - `endTime` (string): Closing time (HH:mm)
    - `isOpen` (boolean): Whether business is open on this day
- **Utility Functions**:
  - `getBusinessHours(appSettings)`
  - `isBusinessOpen(appSettings)`: Returns true if business is currently open

#### Support Channels
- **Path**: `appSettings.business.supportChannels`
- **Fields**:
  - `email.enabled` (boolean)
  - `email.address` (string)
  - `phone.enabled` (boolean)
  - `phone.number` (string)
  - `chat.enabled` (boolean)
  - `chat.hours.start` (string)
  - `chat.hours.end` (string)
- **Implementation**: `src/components/business-info.tsx`

### 3. Feature Flags

#### Marketplace
- **Path**: `appSettings.features.marketplace`
- **Fields**:
  - `enabled` (boolean)
  - `allowNewProviders` (boolean)
  - `requireVerification` (boolean)
- **Utility Function**: `isFeatureEnabled("marketplace", appSettings)`

#### Academy
- **Path**: `appSettings.features.academy`
- **Fields**:
  - `enabled` (boolean)
  - `allowNewCourses` (boolean)
  - `requireInstructorVerification` (boolean)
- **Utility Function**: `isFeatureEnabled("academy", appSettings)`

#### Job Board
- **Path**: `appSettings.features.jobBoard`
- **Fields**:
  - `enabled` (boolean)
  - `allowNewJobs` (boolean)
  - `requireCompanyVerification` (boolean)
- **Utility Function**: `isFeatureEnabled("jobBoard", appSettings)`

#### Referrals
- **Path**: `appSettings.features.referrals`
- **Fields**:
  - `enabled` (boolean)
  - `rewardAmount` (number)
  - `maxReferralsPerUser` (number)
- **Utility Function**: `isFeatureEnabled("referrals", appSettings)`

#### Analytics
- **Path**: `appSettings.features.analytics`
- **Fields**:
  - `enabled` (boolean)
  - `trackUserBehavior` (boolean)
  - `trackPerformance` (boolean)
- **Utility Function**: `isFeatureEnabled("analytics", appSettings)`

### 4. Payment Settings

#### Payment Methods
- **Path**: `appSettings.features.payments`
- **Fields**:
  - `paypal.enabled` (boolean)
  - `paymaya.enabled` (boolean)
  - `gcash.enabled` (boolean)
  - `bankTransfer.enabled` (boolean)
- **Utility Functions**:
  - `getEnabledPaymentMethods(appSettings)`: Returns array of enabled payment methods
  - `isPaymentMethodEnabled(method, appSettings)`: Checks if specific method is enabled
- **Implementation**: Used in:
  - `src/app/(authenticated)/settings/page.tsx`
  - `src/app/(authenticated)/wallet/page.tsx`
  - `src/app/(authenticated)/marketplace/services/[id]/book/page.tsx`

#### Payment Configuration
- **Path**: `appSettings.payments`
- **Fields**:
  - `defaultCurrency` (string): Default currency code (e.g., "PHP")
  - `supportedCurrencies` (array): Array of supported currency codes
  - `transactionFees.percentage` (number): Transaction fee percentage
  - `transactionFees.fixed` (number): Fixed transaction fee amount
  - `minimumPayout` (number): Minimum amount for payout
  - `payoutSchedule.frequency` (string): daily/weekly/monthly
  - `payoutSchedule.dayOfWeek` (number): Day of week (0-6)
  - `payoutSchedule.dayOfMonth` (number): Day of month (1-31)
- **Utility Functions**:
  - `getDefaultCurrency(appSettings)`
  - `getSupportedCurrencies(appSettings)`
  - `getTransactionFeePercentage(appSettings)`
  - `getTransactionFeeFixed(appSettings)`
  - `calculateTransactionFee(amount, appSettings)`
  - `getMinimumPayout(appSettings)`
- **Implementation**: Used in:
  - `src/lib/currency-utils.ts`: Uses defaultCurrency
  - Payment processing components

### 5. Security Settings

#### Password Policy
- **Path**: `appSettings.security.passwordPolicy`
- **Fields**:
  - `minLength` (number): Minimum password length
  - `requireUppercase` (boolean)
  - `requireLowercase` (boolean)
  - `requireNumbers` (boolean)
  - `requireSpecialChars` (boolean)
  - `maxLoginAttempts` (number): Maximum failed login attempts
  - `lockoutDuration` (number): Lockout duration in minutes
- **Utility Functions**:
  - `getPasswordPolicy(appSettings)`
  - `validatePassword(password, appSettings)`: Returns validation result with errors

#### Session Settings
- **Path**: `appSettings.security.sessionSettings`
- **Fields**:
  - `maxSessionDuration` (number): Maximum session duration in hours
  - `allowMultipleSessions` (boolean)
  - `maxConcurrentSessions` (number)
- **Utility Function**: `getSessionSettings(appSettings)`

#### Data Protection
- **Path**: `appSettings.security.dataProtection`
- **Fields**:
  - `encryptSensitiveData` (boolean)
  - `dataRetentionPeriod` (number): Retention period in days
  - `allowDataExport` (boolean)
  - `allowDataDeletion` (boolean)

### 6. Upload Settings

#### File Upload Configuration
- **Path**: `appSettings.uploads`
- **Fields**:
  - `maxFileSize` (number): Maximum file size in bytes
  - `allowedImageTypes` (array): Allowed MIME types for images
  - `allowedDocumentTypes` (array): Allowed MIME types for documents
  - `maxImagesPerUpload` (number): Maximum number of images per upload
  - `imageCompression.enabled` (boolean)
  - `imageCompression.quality` (number): Compression quality (0-100)
- **Utility Functions**:
  - `getMaxFileSize(appSettings)`: Returns size in bytes
  - `getMaxFileSizeMB(appSettings)`: Returns size in MB
  - `getAllowedImageTypes(appSettings)`
  - `getAllowedDocumentTypes(appSettings)`
  - `getMaxImagesPerUpload(appSettings)`
  - `isImageCompressionEnabled(appSettings)`
  - `getImageCompressionQuality(appSettings)`
- **Implementation**: `src/components/ui/file-upload.tsx` uses all upload settings

### 7. Notification Settings

#### Email Notifications
- **Path**: `appSettings.notifications.email`
- **Fields**:
  - `enabled` (boolean)
  - `provider` (string): nodemailer/sendgrid/mailgun/ses
  - `fromEmail` (string)
  - `fromName` (string)

#### SMS Notifications
- **Path**: `appSettings.notifications.sms`
- **Fields**:
  - `enabled` (boolean)
  - `provider` (string): twilio/vonage/aws_sns
  - `fromNumber` (string)

#### Push Notifications
- **Path**: `appSettings.notifications.push`
- **Fields**:
  - `enabled` (boolean)
  - `provider` (string): firebase/onesignal/pusher

### 8. Analytics Settings

#### Analytics Providers
- **Path**: `appSettings.analytics`
- **Fields**:
  - `googleAnalytics.enabled` (boolean)
  - `googleAnalytics.trackingId` (string)
  - `mixpanel.enabled` (boolean)
  - `mixpanel.projectToken` (string)
  - `customAnalytics.enabled` (boolean)
  - `customAnalytics.retentionPeriod` (number): Data retention period in days

### 9. Integration Settings

#### Google Maps
- **Path**: `appSettings.integrations.googleMaps`
- **Fields**:
  - `enabled` (boolean)
  - `apiKey` (string)
  - `defaultZoom` (number)

#### Cloudinary
- **Path**: `appSettings.integrations.cloudinary`
- **Fields**:
  - `enabled` (boolean)
  - `cloudName` (string)
  - `apiKey` (string)
  - `apiSecret` (string)

#### Social Login
- **Path**: `appSettings.integrations.socialLogin`
- **Fields**:
  - `google.enabled` (boolean)
  - `google.clientId` (string)
  - `facebook.enabled` (boolean)
  - `facebook.appId` (string)

## Implementation Details

### Hooks

#### useAppSettings()
```typescript
const { settings, loading, error, refetch, updateSettings, updateCategory } = useAppSettings();
```

Returns:
- `settings`: AppSettings object or null
- `loading`: Boolean indicating loading state
- `error`: Error message string or null
- `refetch`: Function to manually refetch settings
- `updateSettings`: Function to update entire settings
- `updateCategory`: Function to update a specific category

#### useUserSettings()
```typescript
const { settings, loading, error, refetch, updateSettings, updateCategory, resetSettings } = useUserSettings();
```

Returns:
- `settings`: UserSettings object or null
- `loading`: Boolean indicating loading state
- `error`: Error message string or null
- `refetch`: Function to manually refetch settings
- `updateSettings`: Function to update entire settings
- `updateCategory`: Function to update a specific category
- `resetSettings`: Function to reset to default settings

### Components

#### MaintenanceMode
Automatically displays when maintenance mode is enabled. Blocks all user interaction.

#### ForceUpdate
Automatically displays when app version is below minimum required version.

#### BusinessInfo
Displays business information, support channels, and business hours.

#### FileUpload (Updated)
Now uses app settings for:
- Maximum file size
- Allowed file types
- Maximum images per upload
- Image compression settings

## Usage Examples

### Checking if a feature is enabled
```typescript
import { useAppSettings } from "@/hooks/useAppSettings";
import { isFeatureEnabled } from "@/lib/settings-utils";

function MyComponent() {
  const { settings } = useAppSettings();
  
  if (!isFeatureEnabled("marketplace", settings)) {
    return <div>Marketplace is currently disabled</div>;
  }
  
  return <MarketplaceContent />;
}
```

### Using payment settings
```typescript
import { useAppSettings } from "@/hooks/useAppSettings";
import { getEnabledPaymentMethods, calculateTransactionFee } from "@/lib/settings-utils";

function PaymentComponent() {
  const { settings } = useAppSettings();
  const enabledMethods = getEnabledPaymentMethods(settings);
  const fee = calculateTransactionFee(100, settings);
  
  return (
    <select>
      {enabledMethods.map(method => (
        <option key={method} value={method}>{method}</option>
      ))}
    </select>
  );
}
```

### Using upload settings
```typescript
import { FileUpload } from "@/components/ui/file-upload";

function ImageUpload() {
  return (
    <FileUpload
      type="image"
      multiple={true}
      // Automatically uses settings from appSettings.uploads
    />
  );
}
```

### Validating password
```typescript
import { useAppSettings } from "@/hooks/useAppSettings";
import { validatePassword } from "@/lib/settings-utils";

function PasswordInput() {
  const { settings } = useAppSettings();
  const [password, setPassword] = useState("");
  
  const validation = validatePassword(password, settings);
  
  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {!validation.valid && (
        <ul>
          {validation.errors.map((error, i) => (
            <li key={i} className="text-red-600">{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Displaying business information
```typescript
import { BusinessInfo } from "@/components/business-info";

function ContactPage() {
  return (
    <div>
      <h1>Contact Us</h1>
      <BusinessInfo
        showSupportChannels={true}
        showBusinessHours={true}
        showAddress={true}
      />
    </div>
  );
}
```

## API Reference

### Settings Utility Functions

All utility functions are exported from `src/lib/settings-utils.ts`:

#### Payment Functions
- `getEnabledPaymentMethods(appSettings)`: string[]
- `isPaymentMethodEnabled(method, appSettings)`: boolean
- `getDefaultCurrency(appSettings)`: string
- `getSupportedCurrencies(appSettings)`: string[]
- `getTransactionFeePercentage(appSettings)`: number
- `getTransactionFeeFixed(appSettings)`: number
- `calculateTransactionFee(amount, appSettings)`: number
- `getMinimumPayout(appSettings)`: number

#### Upload Functions
- `getMaxFileSize(appSettings)`: number (bytes)
- `getMaxFileSizeMB(appSettings)`: number (MB)
- `getAllowedImageTypes(appSettings)`: string[]
- `getAllowedDocumentTypes(appSettings)`: string[]
- `getMaxImagesPerUpload(appSettings)`: number
- `isImageCompressionEnabled(appSettings)`: boolean
- `getImageCompressionQuality(appSettings)`: number

#### Feature Functions
- `isFeatureEnabled(feature, appSettings)`: boolean

#### Security Functions
- `getPasswordPolicy(appSettings)`: PasswordPolicy object
- `validatePassword(password, appSettings)`: { valid: boolean, errors: string[] }
- `getSessionSettings(appSettings)`: SessionSettings object

#### Business Functions
- `getBusinessInfo(appSettings)`: Business object | null
- `getSupportChannels(appSettings)`: SupportChannels object | null
- `isSupportChannelEnabled(channel, appSettings)`: boolean
- `getBusinessHours(appSettings)`: BusinessHours object | null
- `isBusinessOpen(appSettings)`: boolean

## Settings JSON Structure

The complete settings structure matches the API response format:

```json
{
  "success": true,
  "data": {
    "general": { /* ... */ },
    "business": { /* ... */ },
    "features": { /* ... */ },
    "security": { /* ... */ },
    "uploads": { /* ... */ },
    "notifications": { /* ... */ },
    "payments": { /* ... */ },
    "analytics": { /* ... */ },
    "integrations": { /* ... */ }
  }
}
```

All settings are properly typed using TypeScript interfaces defined in `src/types/app-settings.ts`.

## Notes

- All settings have sensible defaults if not provided
- Settings are fetched automatically when hooks are used
- Settings can be updated using the `updateSettings` or `updateCategory` functions
- Maintenance mode and force update are automatically enforced at the root layout level
- File uploads automatically respect upload settings
- Payment methods are filtered based on enabled methods in settings
- Currency formatting uses default currency from settings

