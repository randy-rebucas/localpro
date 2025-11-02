/**
 * Extended Utils Tests
 * Tests for additional utility functions
 */

import {
  formatDate,
  formatRelativeTime,
  truncateText,
  capitalizeFirst,
  slugify,
  formatNumber,
  formatPercentage,
  groupBy,
  sortBy,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  getFromStorage,
  setToStorage,
  removeFromStorage,
  debounce,
  throttle,
  getErrorMessage,
  formatFileSize,
  getFileExtension
} from '../utils';

describe('Extended Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toContain('January');
      expect(result).toContain('2024');
    });

    it('should format date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBeDefined();
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "just now" for recent times', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('should format minutes ago', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toContain('m ago');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = truncateText(text, 20);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(result).toContain('...');
    });

    it('should return original text if shorter than maxLength', () => {
      const text = 'Short';
      expect(truncateText(text, 20)).toBe(text);
    });
  });

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalizeFirst('')).toBe('');
    });
  });

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello@World#123')).toBe('helloworld123');
    });
  });

  describe('formatNumber', () => {
    it('should format number with commas', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatPercentage', () => {
    it('should format as percentage', () => {
      expect(formatPercentage(0.5)).toBe('50.0%');
    });

    it('should handle decimals', () => {
      expect(formatPercentage(0.123, 2)).toBe('12.30%');
    });
  });

  describe('groupBy', () => {
    it('should group array by key', () => {
      const items = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 }
      ];
      const grouped = groupBy(items, 'category');
      expect(grouped['A']).toHaveLength(2);
      expect(grouped['B']).toHaveLength(1);
    });
  });

  describe('sortBy', () => {
    it('should sort array ascending', () => {
      const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const sorted = sortBy(items, 'value', 'asc');
      expect(sorted[0].value).toBe(1);
    });

    it('should sort array descending', () => {
      const items = [{ value: 1 }, { value: 3 }, { value: 2 }];
      const sorted = sortBy(items, 'value', 'desc');
      expect(sorted[0].value).toBe(3);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone', () => {
      expect(isValidPhone('+1234567890')).toBe(true);
    });

    it('should reject invalid phone', () => {
      expect(isValidPhone('123')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should reject invalid URL', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
    });
  });

  describe('Storage utilities', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should get from storage', () => {
      localStorage.setItem('test', JSON.stringify({ key: 'value' }));
      const result = getFromStorage('test', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return default if key not found', () => {
      const result = getFromStorage('nonexistent', { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should set to storage', () => {
      setToStorage('test', { key: 'value' });
      const stored = localStorage.getItem('test');
      expect(JSON.parse(stored!)).toEqual({ key: 'value' });
    });

    it('should remove from storage', () => {
      localStorage.setItem('test', 'value');
      removeFromStorage('test');
      expect(localStorage.getItem('test')).toBeNull();
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debounced = debounce(mockFn, 100);

      debounced();
      debounced();
      debounced();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.useRealTimers();
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttled = throttle(mockFn, 100);

      throttled();
      throttled();
      throttled();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.useRealTimers();
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error', () => {
      expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
    });

    it('should return string as is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should handle unknown error', () => {
      expect(getErrorMessage({})).toBe('An unknown error occurred');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('should format MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('should handle zero', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
    });

    it('should handle no extension', () => {
      expect(getFileExtension('file')).toBe('');
    });
  });
});

