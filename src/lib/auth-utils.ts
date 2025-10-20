// Utility functions for authentication

/**
 * Get session token from cookies
 */
export function getSessionToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const sessionCookie = cookies.find(cookie => 
    cookie.trim().startsWith('session=')
  );
  
  return sessionCookie ? sessionCookie.split('=')[1] : null;
}

/**
 * Create headers with session token for authenticated requests
 */
export function createAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const sessionToken = getSessionToken();
  
  return {
    'Content-Type': 'application/json',
    ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
    ...additionalHeaders
  };
}

/**
 * Create fetch options with authentication
 */
export function createAuthFetchOptions(options: RequestInit = {}): RequestInit {
  const sessionToken = getSessionToken();
  
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
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
 * Extract Bearer token from request headers (for server-side use)
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}