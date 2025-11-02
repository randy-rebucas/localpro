/**
 * Phone number formatter utility with automatic international format conversion
 * Detects user location and converts local numbers to international format
 */
import { logger } from './logger';

export interface CountryInfo {
  code: string;
  name: string;
  dialCode: string;
  format: string;
  example: string;
}

// Common country codes and their phone number formats
export const COUNTRY_CODES: Record<string, CountryInfo> = {
  US: { code: 'US', name: 'United States', dialCode: '+1', format: '+1 (XXX) XXX-XXXX', example: '+1 (555) 123-4567' },
  CA: { code: 'CA', name: 'Canada', dialCode: '+1', format: '+1 (XXX) XXX-XXXX', example: '+1 (555) 123-4567' },
  PH: { code: 'PH', name: 'Philippines', dialCode: '+63', format: '+63 XXX XXX XXXX', example: '+63 912 345 6789' },
  GB: { code: 'GB', name: 'United Kingdom', dialCode: '+44', format: '+44 XXXX XXX XXX', example: '+44 7700 900123' },
  AU: { code: 'AU', name: 'Australia', dialCode: '+61', format: '+61 XXX XXX XXX', example: '+61 412 345 678' },
  DE: { code: 'DE', name: 'Germany', dialCode: '+49', format: '+49 XXX XXXXXXX', example: '+49 30 12345678' },
  FR: { code: 'FR', name: 'France', dialCode: '+33', format: '+33 X XX XX XX XX', example: '+33 1 23 45 67 89' },
  JP: { code: 'JP', name: 'Japan', dialCode: '+81', format: '+81 XX-XXXX-XXXX', example: '+81 90-1234-5678' },
  KR: { code: 'KR', name: 'South Korea', dialCode: '+82', format: '+82 XX-XXXX-XXXX', example: '+82 10-1234-5678' },
  SG: { code: 'SG', name: 'Singapore', dialCode: '+65', format: '+65 XXXX XXXX', example: '+65 9123 4567' },
  IN: { code: 'IN', name: 'India', dialCode: '+91', format: '+91 XXXXX XXXXX', example: '+91 98765 43210' },
  BR: { code: 'BR', name: 'Brazil', dialCode: '+55', format: '+55 XX XXXXX-XXXX', example: '+55 11 99999-9999' },
  MX: { code: 'MX', name: 'Mexico', dialCode: '+52', format: '+52 XXX XXX XXXX', example: '+52 55 1234 5678' },
  ES: { code: 'ES', name: 'Spain', dialCode: '+34', format: '+34 XXX XX XX XX', example: '+34 612 34 56 78' },
  IT: { code: 'IT', name: 'Italy', dialCode: '+39', format: '+39 XXX XXX XXXX', example: '+39 320 123 4567' },
  NL: { code: 'NL', name: 'Netherlands', dialCode: '+31', format: '+31 X XXXX XXXX', example: '+31 6 12345678' },
  SE: { code: 'SE', name: 'Sweden', dialCode: '+46', format: '+46 XX-XXX XX XX', example: '+46 70-123 45 67' },
  NO: { code: 'NO', name: 'Norway', dialCode: '+47', format: '+47 XXX XX XXX', example: '+47 123 45 678' },
  DK: { code: 'DK', name: 'Denmark', dialCode: '+45', format: '+45 XX XX XX XX', example: '+45 12 34 56 78' },
  FI: { code: 'FI', name: 'Finland', dialCode: '+358', format: '+358 XX XXX XXXX', example: '+358 50 123 4567' },
  CH: { code: 'CH', name: 'Switzerland', dialCode: '+41', format: '+41 XX XXX XX XX', example: '+41 79 123 45 67' },
  AT: { code: 'AT', name: 'Austria', dialCode: '+43', format: '+43 XXX XXXXXXX', example: '+43 664 1234567' },
  BE: { code: 'BE', name: 'Belgium', dialCode: '+32', format: '+32 XXX XX XX XX', example: '+32 470 12 34 56' },
  PL: { code: 'PL', name: 'Poland', dialCode: '+48', format: '+48 XXX XXX XXX', example: '+48 123 456 789' },
  CZ: { code: 'CZ', name: 'Czech Republic', dialCode: '+420', format: '+420 XXX XXX XXX', example: '+420 123 456 789' },
  HU: { code: 'HU', name: 'Hungary', dialCode: '+36', format: '+36 XX XXX XXXX', example: '+36 20 123 4567' },
  RO: { code: 'RO', name: 'Romania', dialCode: '+40', format: '+40 XXX XXX XXX', example: '+40 721 234 567' },
  BG: { code: 'BG', name: 'Bulgaria', dialCode: '+359', format: '+359 XX XXX XXXX', example: '+359 87 123 4567' },
  HR: { code: 'HR', name: 'Croatia', dialCode: '+385', format: '+385 XX XXX XXXX', example: '+385 91 123 4567' },
  SI: { code: 'SI', name: 'Slovenia', dialCode: '+386', format: '+386 XX XXX XXX', example: '+386 31 123 456' },
  SK: { code: 'SK', name: 'Slovakia', dialCode: '+421', format: '+421 XX XXX XXXX', example: '+421 901 234 567' },
  LT: { code: 'LT', name: 'Lithuania', dialCode: '+370', format: '+370 XXX XXXXX', example: '+370 612 34567' },
  LV: { code: 'LV', name: 'Latvia', dialCode: '+371', format: '+371 XXXX XXXX', example: '+371 2123 4567' },
  EE: { code: 'EE', name: 'Estonia', dialCode: '+372', format: '+372 XXXX XXXX', example: '+372 5123 4567' },
  IE: { code: 'IE', name: 'Ireland', dialCode: '+353', format: '+353 XX XXX XXXX', example: '+353 87 123 4567' },
  PT: { code: 'PT', name: 'Portugal', dialCode: '+351', format: '+351 XXX XXX XXX', example: '+351 91 234 5678' },
  GR: { code: 'GR', name: 'Greece', dialCode: '+30', format: '+30 XXX XXX XXXX', example: '+30 69 1234 5678' },
  CY: { code: 'CY', name: 'Cyprus', dialCode: '+357', format: '+357 XX XXX XXX', example: '+357 96 123 456' },
  MT: { code: 'MT', name: 'Malta', dialCode: '+356', format: '+356 XXXX XXXX', example: '+356 2123 4567' },
  LU: { code: 'LU', name: 'Luxembourg', dialCode: '+352', format: '+352 XXX XXX XXX', example: '+352 621 123 456' },
};

export class PhoneFormatter {
  private userCountry: string | null = null;
  private detectedCountry: CountryInfo | null = null;

  constructor() {
    this.detectUserCountry();
  }

  /**
   * Detect user's country using geolocation API
   */
  private async detectUserCountry(): Promise<void> {
    try {
      // Try to get country from browser's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const countryFromTimezone = this.getCountryFromTimezone(timezone);
      
      if (countryFromTimezone) {
        this.userCountry = countryFromTimezone;
        this.detectedCountry = COUNTRY_CODES[countryFromTimezone];
        return;
      }

      // Fallback to geolocation API
      const position = await this.getCurrentPosition();
      if (position) {
        const country = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
        if (country) {
          this.userCountry = country;
          this.detectedCountry = COUNTRY_CODES[country];
        }
      }
    } catch (error) {
      logger.warn('Could not detect user country', undefined, { error: error instanceof Error ? error.message : String(error) });
      // Default to US if detection fails
      this.userCountry = 'US';
      this.detectedCountry = COUNTRY_CODES['US'];
    }
  }

  /**
   * Get country from timezone
   */
  private getCountryFromTimezone(timezone: string): string | null {
    const timezoneCountryMap: Record<string, string> = {
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'Asia/Manila': 'PH',
      'Europe/London': 'GB',
      'Australia/Sydney': 'AU',
      'Australia/Melbourne': 'AU',
      'Europe/Berlin': 'DE',
      'Europe/Paris': 'FR',
      'Asia/Tokyo': 'JP',
      'Asia/Seoul': 'KR',
      'Asia/Singapore': 'SG',
      'Asia/Kolkata': 'IN',
      'America/Sao_Paulo': 'BR',
      'America/Mexico_City': 'MX',
      'Europe/Madrid': 'ES',
      'Europe/Rome': 'IT',
      'Europe/Amsterdam': 'NL',
      'Europe/Stockholm': 'SE',
      'Europe/Oslo': 'NO',
      'Europe/Copenhagen': 'DK',
      'Europe/Helsinki': 'FI',
      'Europe/Zurich': 'CH',
      'Europe/Vienna': 'AT',
      'Europe/Brussels': 'BE',
      'Europe/Warsaw': 'PL',
      'Europe/Prague': 'CZ',
      'Europe/Budapest': 'HU',
      'Europe/Bucharest': 'RO',
      'Europe/Sofia': 'BG',
      'Europe/Zagreb': 'HR',
      'Europe/Ljubljana': 'SI',
      'Europe/Bratislava': 'SK',
      'Europe/Vilnius': 'LT',
      'Europe/Riga': 'LV',
      'Europe/Tallinn': 'EE',
      'Europe/Dublin': 'IE',
      'Europe/Lisbon': 'PT',
      'Europe/Athens': 'GR',
      'Asia/Nicosia': 'CY',
      'Europe/Malta': 'MT',
      'Europe/Luxembourg': 'LU',
    };

    return timezoneCountryMap[timezone] || null;
  }

  /**
   * Get current position using geolocation API
   */
  private getCurrentPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  }

  /**
   * Reverse geocode coordinates to get country
   */
  private async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      return data.countryCode || null;
    } catch (error) {
      logger.warn('Reverse geocoding failed', undefined, { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Format phone number to international format
   */
  public formatPhoneNumber(input: string): string {
    if (!input) return '';

    // Remove all non-digit characters and spaces
    const digits = input.replace(/[\D\s]/g, '');
    
    // If already starts with country code, return as is (but clean it)
    if (input.startsWith('+')) {
      return `+${digits}`;
    }

    // If starts with 0, remove it and add country code
    if (digits.startsWith('0')) {
      const withoutZero = digits.substring(1);
      if (this.detectedCountry) {
        return `${this.detectedCountry.dialCode}${withoutZero}`;
      }
    }

    // If it's a local number without country code, add it
    if (this.detectedCountry && digits.length >= 7) {
      return `${this.detectedCountry.dialCode}${digits}`;
    }

    // If we have digits but no country detected, try to add +1 as fallback
    if (digits.length >= 7) {
      return `+1${digits}`;
    }

    // Return original if we can't determine format
    return input;
  }

  /**
   * Get formatted display string for phone number
   */
  public getFormattedDisplay(phoneNumber: string): string {
    if (!phoneNumber) return '';

    // Clean the phone number first
    const cleanPhone = phoneNumber.replace(/[\D\s]/g, '');
    
    const country = this.getCountryFromPhoneNumber(phoneNumber);
    if (!country) return phoneNumber;

    const countryCode = country.dialCode.replace('+', '');
    const localNumber = cleanPhone.replace(countryCode, '');

    // Apply country-specific formatting
    return this.applyFormatting(country, localNumber);
  }

  /**
   * Get country info from phone number
   */
  private getCountryFromPhoneNumber(phoneNumber: string): CountryInfo | null {
    const digits = phoneNumber.replace(/[\D\s]/g, '');
    
    for (const country of Object.values(COUNTRY_CODES)) {
      const countryCode = country.dialCode.replace('+', '');
      if (digits.startsWith(countryCode)) {
        return country;
      }
    }
    
    return null;
  }

  /**
   * Apply country-specific formatting
   */
  private applyFormatting(country: CountryInfo, localNumber: string): string {
    const { dialCode } = country;
    
    // Simple formatting based on country patterns
    switch (country.code) {
      case 'US':
      case 'CA':
        if (localNumber.length === 10) {
          return `${dialCode} (${localNumber.slice(0, 3)}) ${localNumber.slice(3, 6)}-${localNumber.slice(6)}`;
        }
        break;
      case 'PH':
        if (localNumber.length === 10) {
          return `${dialCode} ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`;
        }
        break;
      case 'GB':
        if (localNumber.length >= 10) {
          return `${dialCode} ${localNumber.slice(0, 4)} ${localNumber.slice(4, 7)} ${localNumber.slice(7)}`;
        }
        break;
      case 'AU':
        if (localNumber.length >= 9) {
          return `${dialCode} ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`;
        }
        break;
      default:
        // Generic formatting
        if (localNumber.length >= 7) {
          return `${dialCode} ${localNumber}`;
        }
    }
    
    return `${dialCode}${localNumber}`;
  }

  /**
   * Get user's detected country
   */
  public getUserCountry(): CountryInfo | null {
    return this.detectedCountry;
  }

  /**
   * Get placeholder text for phone input
   */
  public getPlaceholder(): string {
    return this.detectedCountry?.example || '+1 (555) 123-4567';
  }

  /**
   * Validate phone number format
   */
  public validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string } {
    if (!phoneNumber) {
      return { isValid: false, error: 'Phone number is required' };
    }

    // Check for spaces in the phone number
    if (phoneNumber.includes(' ')) {
      return { isValid: false, error: 'Phone number should not contain spaces' };
    }

    const digits = phoneNumber.replace(/[\D\s]/g, '');
    
    if (digits.length < 7) {
      return { isValid: false, error: 'Phone number is too short' };
    }

    if (digits.length > 15) {
      return { isValid: false, error: 'Phone number is too long' };
    }

    // Check if it's a valid international format
    const country = this.getCountryFromPhoneNumber(phoneNumber);
    if (!country && !phoneNumber.startsWith('+')) {
      return { isValid: false, error: 'Please enter a valid phone number with country code' };
    }

    return { isValid: true };
  }
}

// Create a singleton instance
export const phoneFormatter = new PhoneFormatter();
