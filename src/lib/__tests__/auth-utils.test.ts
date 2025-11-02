/**
 * Auth Utils Tests
 * Tests for authentication utility functions
 */

import { getApiToken, createAuthFetchOptions } from '../auth-utils';

// Mock document.cookie
const mockCookies: string[] = [];
Object.defineProperty(document, 'cookie', {
  get: () => mockCookies.join('; '),
  set: (value: string) => {
    const [name] = value.split('=');
    const existingIndex = mockCookies.findIndex(c => c.startsWith(name));
    if (existingIndex >= 0) {
      mockCookies[existingIndex] = value;
    } else {
      mockCookies.push(value);
    }
  },
  configurable: true,
});

describe('Auth Utils', () => {
  beforeEach(() => {
    mockCookies.length = 0;
  });

  describe('getApiToken', () => {
    it('should return null when no cookies are set', () => {
      expect(getApiToken()).toBeNull();
    });

    it('should return api-token cookie when present', () => {
      document.cookie = 'api-token=test-token-123';
      expect(getApiToken()).toBe('test-token-123');
    });

    it('should prefer api-token over session cookie', () => {
      document.cookie = 'session=session-token-456';
      document.cookie = 'api-token=api-token-123';
      expect(getApiToken()).toBe('api-token-123');
    });

    it('should fall back to session cookie when api-token is not present', () => {
      document.cookie = 'session=session-token-456';
      expect(getApiToken()).toBe('session-token-456');
    });
  });

  describe('createAuthFetchOptions', () => {
    beforeEach(() => {
      document.cookie = 'api-token=test-token-123';
    });

    it('should include Authorization header when token exists', () => {
      const options = createAuthFetchOptions({ method: 'GET' });
      expect(options.headers).toMatchObject({
        'Authorization': 'Bearer test-token-123',
      });
    });

    it('should include Content-Type header', () => {
      const options = createAuthFetchOptions({ method: 'GET' });
      expect(options.headers).toMatchObject({
        'Content-Type': 'application/json',
      });
    });

    it('should include credentials', () => {
      const options = createAuthFetchOptions({ method: 'GET' });
      expect(options.credentials).toBe('include');
    });

    it('should merge with existing headers', () => {
      const options = createAuthFetchOptions({
        method: 'POST',
        headers: { 'Custom-Header': 'value' },
      });
      expect(options.headers).toMatchObject({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-123',
        'Custom-Header': 'value',
      });
    });

    it('should include body when provided', () => {
      const body = JSON.stringify({ test: 'data' });
      const options = createAuthFetchOptions({ method: 'POST', body });
      expect(options.body).toBe(body);
    });
  });
});

