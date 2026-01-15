# Phone Validation and Formatting in Authentication

## Overview

This document provides a comprehensive overview of the phone number validation and formatting system used in the LocalPro authentication flow. The system ensures consistent, international-format phone number handling across the application.

## Architecture

### Core Components

1. **Phone Schema Validation** (`src/app/(auth)/auth/page.tsx`)
2. **Phone Formatter** (`src/lib/phone-formatter.ts`)
3. **Phone Input Component** (`src/shared/components/ui/phone-input.tsx`)
4. **Authentication Flow Integration**
5. **E2E Testing** (`e2e/pages/auth.page.ts`, `e2e/utils/test-data-factory.ts`)

## Phone Validation Schema

The authentication form uses Zod schema validation with multiple refinement layers:

```typescript
const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .transform((val) => val.trim())
    .refine((phone) => !phone.includes(' '), "Phone number should not contain spaces")
    .refine((phone) => {
      const digits = phone.replace(/[\D\s]/g, '');
      return digits.length >= 7 && digits.length <= 15;
    }, "Phone number must be between 7 and 15 digits")
    .refine((phone) => {
      return phone.startsWith('+') || (phone.replace(/[\D\s]/g, '').length >= 7);
    }, "Please enter a valid phone number"),
});
```

### Validation Rules

- **Required**: Phone number cannot be empty
- **No Spaces**: Spaces are not allowed in the phone number string
- **Length**: Must contain 7-15 digits (excluding formatting characters)
- **Format**: Must start with `+` for international format or have sufficient digits for local format

## Phone Formatting System

### Country Detection

The `PhoneFormatter` class automatically detects the user's country using:

1. **Primary**: Browser timezone detection
2. **Fallback**: Geolocation API with reverse geocoding
3. **Default**: US format if detection fails

### Supported Countries

The system supports 40+ countries with specific formatting rules:

```typescript
export const COUNTRY_CODES: Record<string, CountryInfo> = {
  US: { code: 'US', name: 'United States', dialCode: '+1', format: '+1 (XXX) XXX-XXXX', example: '+1 (555) 123-4567' },
  PH: { code: 'PH', name: 'Philippines', dialCode: '+63', format: '+63 XXX XXX XXXX', example: '+63 912 345 6789' },
  GB: { code: 'GB', name: 'United Kingdom', dialCode: '+44', format: '+44 XXXX XXX XXX', example: '+44 7700 900123' },
  // ... and 37+ more countries
};
```

### Formatting Logic

#### Input Processing
- Removes all non-digit characters and spaces
- Converts local numbers (starting with 0) to international format
- Adds detected country code if missing

#### Display Formatting
Applies country-specific formatting for user display:
- **US/Canada**: `+1 (555) 123-4567`
- **Philippines**: `+63 912 345 6789`
- **UK**: `+44 7700 900123`

#### Storage Format
Phone numbers are stored in clean international format without spaces or formatting characters.

### Validation Methods

```typescript
public validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string }
```

Checks for:
- Non-empty input
- No spaces
- 7-15 digit length
- Valid international format
- Country code recognition

## Phone Input Component

### Features

The `PhoneInput` component provides:

- **Real-time Formatting**: Formats input as user types
- **Space Prevention**: Blocks space character input
- **Country Detection UI**: Shows detected country with tooltip
- **Placeholder Examples**: Displays country-specific format examples
- **Error Display**: Shows validation errors inline

### Component Props

```typescript
interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  autoComplete?: string;
}
```

### Behavior

- **On Focus**: Shows country dial code if input is empty
- **On Input**: Sanitizes input, prevents spaces, updates formatted value
- **On Blur**: Applies final formatting and validates

## Authentication Flow Integration

### Send Verification Code

```typescript
const sendPhoneCode = async (phone: string) => {
  const formattedPhone = phoneFormatter.formatPhoneNumber(phone.trim());
  const validation = phoneFormatter.validatePhoneNumber(formattedPhone);

  if (!validation.isValid) {
    // Handle validation error
    return;
  }

  // API call with formatted phone
  const response = await makeClientPublicRequest('authSendCode', {
    method: "POST",
    body: JSON.stringify({ phoneNumber: formattedPhone }),
  });
};
```

### Verify Code

```typescript
const verifyPhoneCode = async () => {
  // API call with stored formatted phone
  const response = await makeClientPublicRequest('authVerifyCode', {
    method: "POST",
    body: JSON.stringify({
      phoneNumber, // Already formatted
      code: phoneCode,
    }),
  });
};
```

## E2E Testing

### Auth Page Object

```typescript
export class AuthPage {
  readonly phoneInput: Locator;
  readonly sendCodeButton: Locator;
  readonly codeInputs: Locator;
  readonly verifyButton: Locator;

  async login(phone: string, code: string) {
    await this.enterPhone(phone);
    await this.sendVerificationCode();
    await this.enterCode(code);
    await this.verifyCode();
  }
}
```

### Test Data Generation

```typescript
export const testDataFactory = {
  user: () => ({
    phone: `+1${faker.string.numeric(10)}`, // Generates valid US format
    // ... other user data
  }),
};
```

## Additional Validation Utilities

### Simple Regex Validator

Located in `src/lib/utils.ts`:

```typescript
export function isValidPhone(phone: string) {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}
```

This provides basic validation for other parts of the application.

## Error Handling

### Client-Side Errors

- `INVALID_PHONE_FORMAT`: "Invalid phone number format. Please use international format (e.g., +1234567890)"
- `MISSING_REQUIRED_FIELDS`: "Please fill in all required fields"
- `INVALID_CODE_FORMAT`: "Code must be exactly 6 digits"

### API Error Mapping

The system maps various API error codes to user-friendly messages and handles network failures gracefully.

## Security Considerations

- Phone numbers are validated client-side before API transmission
- No sensitive phone data is logged
- Verification codes are handled securely with proper timeouts
- Rate limiting is implemented on the backend

## Performance

- Country detection is cached per session
- Phone formatting is lightweight and synchronous
- Validation runs on input change with debouncing
- Geolocation fallback has 5-second timeout

## Browser Compatibility

- Uses modern browser APIs (Geolocation, Intl.DateTimeFormat)
- Graceful degradation when APIs are unavailable
- Fallback to US formatting as default

## Testing Coverage

### Unit Tests
- Phone formatter validation logic
- Country detection algorithms
- Input sanitization

### Integration Tests
- Authentication flow with phone numbers
- API error handling
- Form validation

### E2E Tests
- Complete phone login journey
- Error scenarios (invalid format, expired codes)
- Cross-browser compatibility

## Future Improvements

1. **Server-side validation** to complement client-side checks
2. **Phone number normalization** for duplicate detection
3. **Additional country support** as needed
4. **Offline phone validation** for better UX
5. **Phone number masking** in logs for security

## Troubleshooting

### Common Issues

1. **Country not detected**: Falls back to US format
2. **Geolocation blocked**: Uses timezone detection
3. **Invalid format errors**: Check for spaces or insufficient digits
4. **API failures**: Network issues or rate limiting

### Debug Information

Enable logging to see country detection and formatting decisions:

```typescript
logger.info('Phone formatting', {
  input: phone,
  detectedCountry: phoneFormatter.getUserCountry(),
  formatted: phoneFormatter.formatPhoneNumber(phone)
});
```

## Related Files

- `src/app/(auth)/auth/page.tsx` - Authentication form with phone validation
- `src/lib/phone-formatter.ts` - Core formatting logic
- `src/shared/components/ui/phone-input.tsx` - Input component
- `src/lib/utils.ts` - Additional validation utilities
- `e2e/pages/auth.page.ts` - E2E test page object
- `e2e/utils/test-data-factory.ts` - Test data generation</content>
<parameter name="filePath">c:\Users\corew\localpro\docs\PHONE_VALIDATION_FORMATTING.md