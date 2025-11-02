// Utility functions for authentication
import { logger } from './logger';

/**
 * Get API token from cookies (prioritizes api-token cookie from mobile auth)
 * Falls back to session cookie for backward compatibility
 */
export function getApiToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  
  // First, try to get api-token cookie (used by mobile authentication)
  const apiTokenCookie = cookies.find(cookie => 
    cookie.trim().startsWith('api-token=')
  );
  
  if (apiTokenCookie) {
    const token = apiTokenCookie.split('=')[1];
    if (token && token.trim() !== '') {
      return token;
    }
  }
  
  // Fallback to session cookie for backward compatibility
  const sessionCookie = cookies.find(cookie => 
    cookie.trim().startsWith('session=')
  );
  
  const token = sessionCookie ? sessionCookie.split('=')[1] : null;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Token check', {
      hasApiToken: !!apiTokenCookie,
      hasSessionToken: !!sessionCookie,
      cookieCount: cookies.length,
      tokenLength: token?.length || 0
    });
  }
  
  return token;
}

/**
 * Get session token from cookies (legacy function, kept for backward compatibility)
 * @deprecated Use getApiToken() instead for better mobile auth support
 */
export function getSessionToken(): string | null {
  return getApiToken();
}

/**
 * Create headers with API token for authenticated requests
 * Uses api-token cookie (from mobile auth) or falls back to session cookie
 */
export function createAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const apiToken = getApiToken();
  
  return {
    'Content-Type': 'application/json',
    ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
    ...additionalHeaders
  };
}

/**
 * Create fetch options with authentication
 * Uses api-token cookie (from mobile auth response) or falls back to session cookie
 * All secure REST API requests will use Authorization: Bearer {token}
 */
export function createAuthFetchOptions(options: RequestInit = {}): RequestInit {
  const apiToken = getApiToken();
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    logger.debug('createAuthFetchOptions', {
      hasApiToken: !!apiToken,
      tokenLength: apiToken?.length || 0,
      allCookies: typeof document !== 'undefined' ? document.cookie : 'N/A'
    });
  }
  
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
      ...options.headers
    },
    credentials: 'include'
  };
}

/**
 * Create fetch options with Bearer token authentication (for API clients)
 */
export function createBearerTokenOptions(token: string, options: RequestInit = {}): RequestInit {
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  };
}

/**
 * Create standardized headers for external API requests
 * Ensures all requests have Content-Type and Authorization headers
 */
export function createExternalApiHeaders(token: string, additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...additionalHeaders
  };
}

/**
 * Extract Bearer token from request headers (for server-side use)
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}