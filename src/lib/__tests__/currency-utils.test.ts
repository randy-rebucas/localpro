/**
 * Currency Utils Tests
 * Tests for currency formatting utilities
 */

import {
  formatCurrency,
  getCurrencySymbol,
  getCurrencyConfig,
  convertCurrency,
  parseCurrency,
  CURRENCY_CONFIGS
} from '../currency-utils';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format PHP currency correctly', () => {
      const result = formatCurrency(1234.56, 'PHP');
      expect(result).toContain('₱');
      expect(result).toContain('1,234.56');
    });

    it('should format USD currency correctly', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0, 'PHP');
      expect(result).toBeDefined();
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100, 'PHP');
      expect(result).toBeDefined();
    });

    it('should use PHP as default currency', () => {
      const result = formatCurrency(100);
      expect(result).toBeDefined();
    });

    it('should show currency code when requested', () => {
      const result = formatCurrency(100, 'PHP', { showCode: true });
      expect(result).toContain('PHP');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return PHP symbol', () => {
      expect(getCurrencySymbol('PHP')).toBe('₱');
    });

    it('should return USD symbol', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('should return EUR symbol', () => {
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    it('should default to PHP for unknown currency', () => {
      expect(getCurrencySymbol('UNKNOWN')).toBe('₱');
    });
  });

  describe('getCurrencyConfig', () => {
    it('should return PHP configuration', () => {
      const config = getCurrencyConfig('PHP');
      expect(config.code).toBe('PHP');
      expect(config.symbol).toBe('₱');
      expect(config.decimalPlaces).toBe(2);
    });

    it('should default to PHP for unknown currency', () => {
      const config = getCurrencyConfig('UNKNOWN');
      expect(config.code).toBe('PHP');
    });
  });

  describe('convertCurrency', () => {
    it('should convert currency with exchange rate', () => {
      const result = convertCurrency(100, 'USD', 'PHP', 55.5);
      expect(result).toBe(5550);
    });

    it('should return same amount if currencies are the same', () => {
      const result = convertCurrency(100, 'PHP', 'PHP', 1);
      expect(result).toBe(100);
    });

    it('should handle zero exchange rate', () => {
      const result = convertCurrency(100, 'USD', 'PHP', 0);
      expect(result).toBe(0);
    });
  });

  describe('parseCurrency', () => {
    it('should parse currency string with symbol', () => {
      expect(parseCurrency('₱1,234.56')).toBe(1234.56);
    });

    it('should parse currency string without symbol', () => {
      expect(parseCurrency('1,234.56')).toBe(1234.56);
    });

    it('should handle invalid strings', () => {
      expect(parseCurrency('invalid')).toBe(0);
    });

    it('should handle empty string', () => {
      expect(parseCurrency('')).toBe(0);
    });

    it('should handle negative amounts', () => {
      expect(parseCurrency('-100.50')).toBe(-100.50);
    });
  });

  describe('CURRENCY_CONFIGS', () => {
    it('should contain common currencies', () => {
      expect(CURRENCY_CONFIGS).toHaveProperty('PHP');
      expect(CURRENCY_CONFIGS).toHaveProperty('USD');
      expect(CURRENCY_CONFIGS).toHaveProperty('EUR');
      expect(CURRENCY_CONFIGS).toHaveProperty('GBP');
    });

    it('should have correct structure for each currency', () => {
      Object.values(CURRENCY_CONFIGS).forEach(config => {
        expect(config).toHaveProperty('code');
        expect(config).toHaveProperty('symbol');
        expect(config).toHaveProperty('locale');
        expect(config).toHaveProperty('decimalPlaces');
      });
    });
  });
});

