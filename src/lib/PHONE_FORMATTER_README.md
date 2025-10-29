# Phone Number Formatter

A comprehensive phone number formatting utility that automatically detects user location and converts local phone numbers to international format.

## Features

- 🌍 **Automatic Country Detection**: Uses timezone and geolocation APIs to detect user's country
- 🔄 **Local to International Conversion**: Converts numbers starting with "0" to international format
- 📱 **Country-Specific Formatting**: Applies appropriate formatting rules for different countries
- ✅ **Real-time Validation**: Validates phone numbers as users type
- 🎯 **Smart Fallbacks**: Works even when country detection fails
- 🔧 **TypeScript Support**: Fully typed for better development experience

## Usage

### Basic Usage

```tsx
import { PhoneInput } from '@/components/ui/phone-input';

function MyComponent() {
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <PhoneInput
      value={phoneNumber}
      onChange={setPhoneNumber}
      label="Phone Number"
      placeholder="Enter your phone number"
    />
  );
}
```

### Using the Formatter Directly

```tsx
import { phoneFormatter } from '@/lib/phone-formatter';

// Format a phone number
const formatted = phoneFormatter.formatPhoneNumber('09123456789');
// Result: '+63 912 345 6789' (if user is in Philippines)

// Get formatted display
const display = phoneFormatter.getFormattedDisplay('+639123456789');
// Result: '+63 912 345 6789'

// Validate phone number
const validation = phoneFormatter.validatePhoneNumber('+639123456789');
// Result: { isValid: true, error: undefined }
```

## Supported Countries

The formatter supports 40+ countries including:

- 🇺🇸 United States (+1)
- 🇵🇭 Philippines (+63)
- 🇬🇧 United Kingdom (+44)
- 🇦🇺 Australia (+61)
- 🇩🇪 Germany (+49)
- 🇫🇷 France (+33)
- 🇯🇵 Japan (+81)
- 🇰🇷 South Korea (+82)
- 🇸🇬 Singapore (+65)
- 🇮🇳 India (+91)
- And many more...

## How It Works

### 1. Country Detection

The formatter uses multiple methods to detect the user's country:

1. **Timezone Detection**: Analyzes the browser's timezone to determine country
2. **Geolocation API**: Uses browser's geolocation if timezone detection fails
3. **Reverse Geocoding**: Converts coordinates to country code
4. **Fallback**: Defaults to US if all detection methods fail

### 2. Phone Number Conversion

When a user enters a phone number:

1. **Local Number Detection**: Checks if number starts with "0"
2. **Country Code Addition**: Adds appropriate country code based on detected location
3. **Formatting**: Applies country-specific formatting rules
4. **Validation**: Validates the final international format

### 3. Real-time Formatting

The input component provides:

- **Live Formatting**: Formats numbers as users type
- **Visual Feedback**: Shows country detection status
- **Error Handling**: Displays validation errors
- **Placeholder Updates**: Shows country-specific examples

## Examples

### Converting Local Numbers

```tsx
// User in Philippines types: 09123456789
// Formatter converts to: +63 912 345 6789

// User in US types: 05551234567
// Formatter converts to: +1 (555) 123-4567

// User in UK types: 07700900123
// Formatter converts to: +44 7700 900123
```

### Already International Numbers

```tsx
// User types: +1234567890
// Formatter keeps as: +1 (234) 567-890 (with formatting)

// User types: +639123456789
// Formatter keeps as: +63 912 345 6789 (with formatting)
```

## API Reference

### PhoneFormatter Class

#### Methods

- `formatPhoneNumber(input: string): string` - Converts local numbers to international format
- `getFormattedDisplay(phoneNumber: string): string` - Returns formatted display string
- `validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string }` - Validates phone number
- `getUserCountry(): CountryInfo | null` - Returns detected country information
- `getPlaceholder(): string` - Returns country-specific placeholder

### PhoneInput Component

#### Props

- `value: string` - Current phone number value
- `onChange: (value: string) => void` - Callback when value changes
- `onBlur?: () => void` - Callback when input loses focus
- `placeholder?: string` - Custom placeholder text
- `error?: string` - Error message to display
- `disabled?: boolean` - Whether input is disabled
- `className?: string` - Additional CSS classes
- `label?: string` - Label for the input
- `leftIcon?: React.ReactNode` - Icon to display on the left
- `autoComplete?: string` - HTML autocomplete attribute

## Testing

Visit `/phone-demo` to test the formatter with different scenarios:

- Test with local numbers from different countries
- Test with already international numbers
- Test country detection accuracy
- Test validation rules

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Privacy Considerations

- Geolocation is only used for country detection
- No phone numbers are stored or transmitted
- All processing happens client-side
- Geolocation permission is requested only when needed

## Error Handling

The formatter gracefully handles:

- Geolocation permission denied
- Network errors during reverse geocoding
- Invalid phone number formats
- Unsupported countries (falls back to generic formatting)

## Customization

You can extend the formatter by:

1. Adding new countries to `COUNTRY_CODES`
2. Customizing formatting rules in `applyFormatting`
3. Modifying validation rules in `validatePhoneNumber`
4. Styling the `PhoneInput` component

## Troubleshooting

### Country Not Detected

If country detection fails:
- Check if geolocation is enabled
- Verify internet connection
- Check browser console for errors
- Formatter will fallback to US format

### Phone Number Not Formatting

If formatting doesn't work:
- Ensure number starts with "0" for local conversion
- Check if country is supported
- Verify number length (7-15 digits)
- Check browser console for errors

### Validation Errors

Common validation errors:
- "Phone number is too short" - Number has less than 7 digits
- "Phone number is too long" - Number has more than 15 digits
- "Please enter a valid international phone number" - Number doesn't start with "+"
