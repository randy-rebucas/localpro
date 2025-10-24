import { formatCurrency, getCurrencySymbol, getCurrencyConfig } from '../currency-utils';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format PHP currency correctly', () => {
      const result = formatCurrency(100, 'PHP');
      expect(result).toContain('₱');
      expect(result).toContain('100');
    });

    it('should format USD currency correctly', () => {
      const result = formatCurrency(100, 'USD');
      expect(result).toContain('$');
      expect(result).toContain('100');
    });

    it('should format EUR currency correctly', () => {
      const result = formatCurrency(100, 'EUR');
      expect(result).toContain('€');
      expect(result).toContain('100');
    });

    it('should use default currency when invalid code provided', () => {
      const result = formatCurrency(100, 'INVALID');
      expect(result).toContain('₱'); // Should fallback to PHP
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0, 'PHP');
      expect(result).toContain('₱');
      expect(result).toContain('0');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100, 'PHP');
      expect(result).toContain('₱');
      expect(result).toContain('-100');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbol for PHP', () => {
      expect(getCurrencySymbol('PHP')).toBe('₱');
    });

    it('should return correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('should return correct symbol for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    it('should return default symbol for invalid currency', () => {
      expect(getCurrencySymbol('INVALID')).toBe('₱');
    });
  });

  describe('getCurrencyConfig', () => {
    it('should return correct config for PHP', () => {
      const config = getCurrencyConfig('PHP');
      expect(config.code).toBe('PHP');
      expect(config.symbol).toBe('₱');
      expect(config.decimalPlaces).toBe(2);
    });

    it('should return correct config for JPY', () => {
      const config = getCurrencyConfig('JPY');
      expect(config.code).toBe('JPY');
      expect(config.symbol).toBe('¥');
      expect(config.decimalPlaces).toBe(0);
    });

    it('should return default config for invalid currency', () => {
      const config = getCurrencyConfig('INVALID');
      expect(config.code).toBe('PHP');
      expect(config.symbol).toBe('₱');
    });
  });
});
