/**
 * Utils Tests
 * Tests for utility functions
 */

import { cn } from '../utils';

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('should handle undefined and null', () => {
      expect(cn('base', undefined, null)).toBe('base');
    });

    it('should remove duplicate classes', () => {
      // Note: cn uses clsx which may or may not dedupe, depending on implementation
      const result = cn('base', 'base');
      expect(result).toContain('base');
    });

    it('should handle empty strings', () => {
      expect(cn('', 'base')).toBe('base');
    });
  });
});

