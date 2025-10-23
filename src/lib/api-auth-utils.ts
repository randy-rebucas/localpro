import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";

/**
 * Extract session token from request headers or cookies
 */
export function getSessionTokenFromRequest(request: NextRequest): string | null {
  // First, try to get Bearer token from Authorization header
  const authHeader = request.headers.get("authorization");
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  // Fallback to session cookie
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1] || null;
}

/**
 * Get the actual API token from session data
 * This prioritizes the real API token over the session token
 */
export async function getApiTokenFromSession(request: NextRequest): Promise<string | null> {
  try {
    const session = await getServerSession(request);
    
    // If we have the actual API token from the external service, use it
    if (session?.apiToken) {
      return session.apiToken;
    }
    
    // Fallback to session token extraction
    return getSessionTokenFromRequest(request);
  } catch (error) {
    console.error("Error getting API token from session:", error);
    return getSessionTokenFromRequest(request);
  }
}

/**
 * Create authenticated fetch options for external API calls
 * This function properly extracts the session token and creates headers in the correct order
 */
export async function createAuthenticatedFetchOptions(
  request: NextRequest, 
  options: RequestInit = {}
): Promise<RequestInit> {
  // Try to get the actual API token first, fallback to session token
  const apiToken = await getApiTokenFromSession(request);
  
  if (!apiToken) {
    throw new Error("No session token found");
  }

  return {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiToken}`,
      ...options.headers
    },
    signal: AbortSignal.timeout(30000)
  };
}

/**
 * Create authenticated fetch options using session data directly
 * This is the preferred method for API routes that have already validated the session
 */
export function createAuthenticatedFetchOptionsFromSession(
  session: { user: { id: string } },
  options: RequestInit = {}
): RequestInit {
  // We need to get the actual session token, not just the user ID
  // This function should be used with the session token from the request
  throw new Error("This function requires the actual session token, not just user data. Use createAuthenticatedFetchOptions instead.");
}

/**
 * Make authenticated request to external API using session data
 * This is the preferred method for API routes
 */
export async function makeAuthenticatedRequestFromSession(
  session: { user: { id: string } },
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // This function needs the actual session token, not just user data
  throw new Error("This function requires the actual session token. Use makeAuthenticatedRequest instead.");
}

/**
 * Make authenticated request to external API using request object
 * This method extracts the session token from the request
 */
export async function makeAuthenticatedRequest(
  request: NextRequest,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fetchOptions = await createAuthenticatedFetchOptions(request, options);
  return fetch(url, fetchOptions);
}

/**
 * Standardized API route handler that follows the proper flow:
 * 1. Extract session from request
 * 2. Validate authentication
 * 3. Forward request to external API with proper headers
 */
export async function handleApiRequest(
  request: NextRequest,
  externalUrl: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getServerSession(request);
  
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  // Use the request-based authentication instead of session-based
  return makeAuthenticatedRequest(request, externalUrl, options);
}

/**
 * Make authenticated request using API endpoint constant
 * This provides type safety and consistency with predefined endpoints
 */
export async function makeAuthenticatedRequestWithEndpoint(
  request: NextRequest,
  endpoint: keyof typeof API_ENDPOINTS,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
  return makeAuthenticatedRequest(request, url, options);
}

/**
 * Make authenticated request with dynamic endpoint path
 * Combines base endpoint with dynamic parameters
 */
export async function makeAuthenticatedRequestWithPath(
  request: NextRequest,
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
  
  return makeAuthenticatedRequest(request, url, options);
}

/**
 * Helper to build full API URL with endpoint constant
 */
export function buildApiUrl(endpoint: keyof typeof API_ENDPOINTS, pathParams: string[] = [], queryParams: Record<string, string> = {}): string {
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
 * Make unauthenticated request to external API (for public endpoints)
 * This is used for endpoints that don't require authentication
 */
export async function makePublicRequest(
  endpoint: keyof typeof API_ENDPOINTS,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
  
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    signal: AbortSignal.timeout(30000)
  });
}

/**
 * Enhanced API request handler with endpoint constants
 * Provides better type safety and consistency
 */
export async function handleApiRequestWithEndpoint(
  request: NextRequest,
  endpoint: keyof typeof API_ENDPOINTS,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getServerSession(request);
  
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const url = `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
  return makeAuthenticatedRequest(request, url, options);
}

/**
 * Standardized error response handler
 * Provides consistent error handling across all API routes
 */
export function createErrorResponse(
  error: unknown,
  context: string = "API request"
): { error: string; status: number; details?: string } {
  let errorMessage = "Internal server error";
  let statusCode = 500;
  let details: string | undefined;

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      errorMessage = "Request timeout - the external service is taking too long to respond";
      statusCode = 504;
    } else if (error.message.includes('fetch failed')) {
      errorMessage = "Unable to connect to external service - please try again later";
      statusCode = 503;
    } else if (error.message.includes("Authentication required")) {
      errorMessage = "Authentication required";
      statusCode = 401;
    } else if (error.message.includes("No session token found")) {
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
 * Standardized API route wrapper with error handling
 * Provides consistent error handling and response formatting
 */
export async function handleApiRoute<T = unknown>(
  handler: () => Promise<T>,
  context: string = "API request"
): Promise<{ data?: T; error?: string; status: number; details?: string }> {
  try {
    const data = await handler();
    return { data, status: 200 };
  } catch (error) {
    const errorResponse = createErrorResponse(error, context);
    return {
      error: errorResponse.error,
      status: errorResponse.status,
      details: errorResponse.details
    };
  }
}