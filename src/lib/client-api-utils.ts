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
  
  return !!apiToken;
}

/**
 * Get authentication headers for client-side requests
 */
function getAuthHeaders(): HeadersInit {
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
    // Enhanced error message with debugging info
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `No API token found. Available cookies: ${document.cookie || 'none'}`
      : 'No authentication token found';
    throw new Error(errorMessage);
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
} {
  let errorMessage = "Internal server error";
  let statusCode = 500;
  let details: string | undefined;

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      errorMessage = "Request timeout - the service is taking too long to respond";
      statusCode = 504;
    } else if (error.message.includes('fetch failed')) {
      errorMessage = "Unable to connect to service - please try again later";
      statusCode = 503;
    } else if (error.message.includes("No authentication token found")) {
      errorMessage = "Authentication required";
      statusCode = 401;
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
    details
  };
}

/**
 * Standardized API route wrapper for client-side requests
 */
export async function handleClientApiRoute<T = unknown>(
  handler: () => Promise<T>,
  context: string = "API request"
): Promise<{ data?: T; error?: string; status: number; details?: string }> {
  try {
    const data = await handler();
    return { data, status: 200 };
  } catch (error) {
    const errorResponse = handleClientApiError(error, context);
    return {
      error: errorResponse.error,
      status: errorResponse.status,
      details: errorResponse.details
    };
  }
}
