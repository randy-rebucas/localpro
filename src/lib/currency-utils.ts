import type { AppSettings } from "@/types/app-settings";

// Currency formatting utilities
export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  decimalPlaces: number;
}

// Common currency configurations
export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  PHP: {
    code: 'PHP',
    symbol: '₱',
    locale: 'en-PH',
    decimalPlaces: 2
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    decimalPlaces: 2
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    locale: 'en-EU',
    decimalPlaces: 2
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    locale: 'en-GB',
    decimalPlaces: 2
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    locale: 'ja-JP',
    decimalPlaces: 0
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    locale: 'en-AU',
    decimalPlaces: 2
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    locale: 'en-CA',
    decimalPlaces: 2
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    locale: 'en-SG',
    decimalPlaces: 2
  }
};

/**
 * Format a number as currency using the specified currency code
 * If currencyCode is not provided, will use default from app settings if available
 */
export function formatCurrency(
  amount: number, 
  currencyCode?: string | null, 
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    locale?: string;
    appSettings?: AppSettings | null;
  }
): string {
  // Use app settings default currency if not provided
  const defaultCurrency = options?.appSettings?.payments?.defaultCurrency || 'PHP';
  const code = currencyCode || defaultCurrency;
  const config = CURRENCY_CONFIGS[code] || CURRENCY_CONFIGS.PHP;
  const { showSymbol = true, showCode = false, locale } = options || {};
  
  try {
    // Use Intl.NumberFormat for proper currency formatting
    const formatter = new Intl.NumberFormat(locale || config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    });
    
    const formatted = formatter.format(amount);
    
    if (showCode && !formatted.includes(config.code)) {
      return `${formatted} ${config.code}`;
    }
    
    return formatted;
  } catch {
    // Fallback to simple formatting if Intl.NumberFormat fails
    const symbol = showSymbol ? config.symbol : '';
    const code = showCode ? ` ${config.code}` : '';
    return `${symbol}${amount.toFixed(config.decimalPlaces)}${code}`;
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string = 'PHP'): string {
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.PHP;
  return config.symbol;
}

/**
 * Get currency configuration for a given currency code
 */
export function getCurrencyConfig(currencyCode: string = 'PHP'): CurrencyConfig {
  return CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.PHP;
}

/**
 * Convert amount from one currency to another (requires exchange rate)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  return amount * exchangeRate;
}

/**
 * Parse currency string and extract numeric value
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and non-numeric characters except decimal point
  const cleaned = currencyString.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
