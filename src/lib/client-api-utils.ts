import { API_BASE_URL, API_ENDPOINTS } from './api';

/**
 * Client-side API utilities for frontend components
 * These functions work with the browser's fetch API and handle authentication
 */

/**
 * Check if user is authenticated (has API token)
 */
export function isAuthenticated(): boolean {
  const apiToken = document.cookie
    .split(';')
    .find(c => c.trim().startsWith('api-token='))
    ?.split('=')[1];
  
  return !!apiToken && apiToken.trim() !== '';
}

/**
 * Clear the API token cookie (useful when token is invalid)
 */
export function clearApiToken(): void {
  document.cookie = 'api-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}

/**
 * Get authentication headers for client-side requests
 */
function getAuthHeaders(): HeadersInit | null {
  // Debug: Log all cookies in development
  if (process.env.NODE_ENV === 'development') {
    console.log('All cookies:', document.cookie);
  }

  // Get API token cookie from browser (non-httpOnly cookie)
  const apiToken = document.cookie
    .split(';')
    .find(c => c.trim().startsWith('api-token='))
    ?.split('=')[1];

  if (!apiToken) {
    // Return null instead of throwing error to allow graceful handling
    return null;
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiToken}`,
  };
}

/**
 * Make authenticated request using API endpoint constant (client-side)
 */
export async function makeClientAuthenticatedRequestWithEndpoint(
  endpoint: keyof typeof API_ENDPOINTS,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
  const authHeaders = getAuthHeaders();
  
  if (!authHeaders) {
    throw new Error("No authentication token found - please log in");
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}

/**
 * Make authenticated request with dynamic endpoint path (client-side)
 */
export async function makeClientAuthenticatedRequestWithPath(
  baseEndpoint: keyof typeof API_ENDPOINTS,
  pathParams: string[] = [],
  queryParams: Record<string, string> = {},
  options: RequestInit = {}
): Promise<Response> {
  let url = `${API_BASE_URL}${API_ENDPOINTS[baseEndpoint]}`;
  
  // Add path parameters
  if (pathParams.length > 0) {
    url += `/${pathParams.join('/')}`;
  }
  
  // Add query parameters
  const queryString = new URLSearchParams(queryParams).toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  const authHeaders = getAuthHeaders();
  
  if (!authHeaders) {
    throw new Error("No authentication token found - please log in");
  }
  
  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🌐 Making authenticated request to:', url);
    console.log('🔑 Auth headers:', authHeaders);
    console.log('📡 API_BASE_URL:', API_BASE_URL);
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}

/**
 * Build API URL with endpoint constant (client-side)
 */
export function buildClientApiUrl(
  endpoint: keyof typeof API_ENDPOINTS, 
  pathParams: string[] = [], 
  queryParams: Record<string, string> = {}
): string {
  let url = `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
  
  if (pathParams.length > 0) {
    url += `/${pathParams.join('/')}`;
  }
  
  const queryString = new URLSearchParams(queryParams).toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  return url;
}

/**
 * Make public request to external API (client-side)
 */
export async function makeClientPublicRequest(
  endpoint: keyof typeof API_ENDPOINTS,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Standardized error handler for client-side requests
 */
export function handleClientApiError(error: unknown, context: string = "API request"): {
  error: string;
  status: number;
  details?: string;
  isAuthError?: boolean;
} {
  let errorMessage = "Internal server error";
  let statusCode = 500;
  let details: string | undefined;
  let isAuthError = false;

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      errorMessage = "Request timeout - the service is taking too long to respond";
      statusCode = 504;
    } else if (error.message.includes('fetch failed') || error.message.includes('Failed to fetch')) {
      errorMessage = "Unable to connect to service - please check your internet connection and try again";
      statusCode = 503;
    } else if (error.message.includes("No authentication token found")) {
      errorMessage = "Authentication required";
      statusCode = 401;
      isAuthError = true;
    } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      errorMessage = "Authentication expired - please log in again";
      statusCode = 401;
      isAuthError = true;
    } else {
      errorMessage = error.message;
    }
  }

  // Add development details
  if (process.env.NODE_ENV === 'development') {
    details = error instanceof Error ? error.message : String(error);
  }

  console.error(`${context} error:`, error);
  
  return {
    error: errorMessage,
    status: statusCode,
    details,
    isAuthError
  };
}

/**
 * Standardized API route wrapper for client-side requests
 */
export async function handleClientApiRoute<T = unknown>(
  handler: () => Promise<T>,
  context: string = "API request"
): Promise<{ data?: T; error?: string; status: number; details?: string; isAuthError?: boolean }> {
  try {
    const data = await handler();
    return { data, status: 200 };
  } catch (error) {
    const errorResponse = handleClientApiError(error, context);
    return {
      error: errorResponse.error,
      status: errorResponse.status,
      details: errorResponse.details,
      isAuthError: errorResponse.isAuthError
    };
  }
}

/**
 * Reliable redirect function that works in all contexts
 */
export function redirectToLogin(): void {
  console.log("🔄 redirectToLogin() called");
  console.log("🔄 Current URL:", typeof window !== 'undefined' ? window.location.href : 'N/A');
  console.log("🔄 Current pathname:", typeof window !== 'undefined' ? window.location.pathname : 'N/A');
  
  if (typeof window !== 'undefined') {
    // Check if we're already on the auth page to prevent loops
    if (window.location.pathname === '/auth') {
      console.log("🔄 Already on auth page, skipping redirect");
      return;
    }
    
    console.log("🔄 Using window.location.href redirect");
    
    // Add a small delay to prevent rapid redirects
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }, 100);
  } else {
    console.log("🔄 Window not available, cannot redirect");
  }
}

/**
 * Comprehensive function to clear all authentication and session data
 */
export function clearAllAuthData(): void {
  console.log("🧹 Clearing all authentication and session data");
  
  if (typeof window !== 'undefined') {
    // Clear API token first
    clearApiToken();
    
    // Clear localStorage auth data
    const authKeys = [
      'session',
      'auth-token', 
      'api-token',
      'user',
      'lastAuthError',
      'auth-session',
      'user-session',
      'token',
      'access-token',
      'refresh-token'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage completely
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(cookie) { 
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
    });
    
    console.log("✅ All auth data cleared from localStorage, sessionStorage, and cookies");
  }
}

/**
 * Handle expired token by clearing auth data and redirecting to login
 */
export function handleExpiredToken(): void {
  console.warn("Token expired - clearing auth data and redirecting to login");
  
  // Clear all authentication data
  clearAllAuthData();
  
  // Redirect to login page
  redirectToLogin();
}

/**
 * Check if a response indicates an expired token
 */
export function isExpiredTokenResponse(response: Response): boolean {
  return response.status === 401;
}

/**
 * Enhanced authenticated request with automatic token expiry handling
 * Supports query parameters via options.query (custom extension to RequestInit)
 */
export async function makeClientAuthenticatedRequestWithEndpointSafe(
  endpoint: keyof typeof API_ENDPOINTS,
  options: RequestInit & { query?: Record<string, string> } = {}
): Promise<Response> {
  const { query, ...fetchOptions } = options;
  
  // Validate API_BASE_URL
  if (!API_BASE_URL || typeof API_BASE_URL !== 'string' || API_BASE_URL.trim() === '') {
    console.error('API_BASE_URL is not configured:', API_BASE_URL);
    throw new Error('API base URL is not configured. Please check your environment variables.');
  }
  
  // Validate endpoint exists
  if (!API_ENDPOINTS[endpoint]) {
    console.error('Invalid endpoint:', endpoint);
    throw new Error(`Invalid API endpoint: ${String(endpoint)}`);
  }
  
  // Build URL with query parameters if provided
  let url = `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
  if (query && Object.keys(query).length > 0) {
    const queryString = new URLSearchParams(query).toString();
    url += `?${queryString}`;
  }

  // Validate URL is properly formed
  try {
    new URL(url);
  } catch {
    console.error('Invalid URL constructed:', url);
    throw new Error(`Invalid API URL: ${url}. Please check API_BASE_URL configuration.`);
  }

  try {
    const authHeaders = getAuthHeaders();
    
    if (!authHeaders) {
      throw new Error("No authentication token found - please log in");
    }
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 Making authenticated request:', {
        url,
        endpoint,
        method: fetchOptions.method || 'GET',
        hasAuth: !!authHeaders
      });
    }
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...authHeaders,
        ...fetchOptions.headers,
      },
    });
    
    // Check if token is expired
    if (isExpiredTokenResponse(response)) {
      handleExpiredToken();
      throw new Error("Authentication expired - please log in again");
    }
    
    return response;
  } catch (error) {
    // Enhance error message for network failures
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      const enhancedError = new Error(
        `Network error: Unable to connect to API at ${url}. ` +
        `This could be due to: 1) Server is not running, 2) CORS configuration issue, 3) Network connectivity problem. ` +
        `Please check if the API server is running and accessible.`
      );
      // Preserve original error for debugging
      (enhancedError as Error & { originalError?: Error }).originalError = error;
      console.error('Network request failed:', {
        url,
        endpoint,
        apiBaseUrl: API_BASE_URL,
        error: enhancedError.message,
        originalError: error
      });
      throw enhancedError;
    }
    
    // If it's an auth error, handle it
    if (error instanceof Error && (error.message.includes("401") || error.message.includes("Unauthorized"))) {
      handleExpiredToken();
    }
    throw error;
  }
}

/**
 * Enhanced authenticated request with path and automatic token expiry handling
 */
export async function makeClientAuthenticatedRequestWithPathSafe(
  baseEndpoint: keyof typeof API_ENDPOINTS,
  pathParams: string[] = [],
  queryParams: Record<string, string> = {},
  options: RequestInit = {}
): Promise<Response> {
  // Check if we have authentication headers before making the request
  const authHeaders = getAuthHeaders();
  if (!authHeaders) {
    throw new Error("No authentication token found - please log in");
  }

  try {
    const response = await makeClientAuthenticatedRequestWithPath(baseEndpoint, pathParams, queryParams, options);
    
    // Check if token is expired
    if (isExpiredTokenResponse(response)) {
      handleExpiredToken();
      throw new Error("Authentication expired - please log in again");
    }
    
    return response;
  } catch (error) {
    // If it's an auth error, handle it
    if (error instanceof Error && (error.message.includes("401") || error.message.includes("Unauthorized") || error.message.includes("No authentication token"))) {
      handleExpiredToken();
    }
    throw error;
  }
}
