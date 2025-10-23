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
 * Create authenticated fetch options for external API calls
 * This function properly extracts the session token and creates headers in the correct order
 */
export function createAuthenticatedFetchOptions(
  request: NextRequest, 
  options: RequestInit = {}
): RequestInit {
  const sessionToken = getSessionTokenFromRequest(request);
  
  if (!sessionToken) {
    throw new Error("No session token found");
  }

  return {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sessionToken}`,
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
  return {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.user.id}`,
      ...options.headers
    },
    signal: AbortSignal.timeout(30000)
  };
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
  const fetchOptions = createAuthenticatedFetchOptionsFromSession(session, options);
  return fetch(url, fetchOptions);
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
  const fetchOptions = createAuthenticatedFetchOptions(request, options);
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

  return makeAuthenticatedRequestFromSession(session, externalUrl, options);
}

/**
 * Make authenticated request using API endpoint constant
 * This provides type safety and consistency with predefined endpoints
 */
export async function makeAuthenticatedRequestWithEndpoint(
  session: { user: { id: string } },
  endpoint: keyof typeof API_ENDPOINTS,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
  return makeAuthenticatedRequestFromSession(session, url, options);
}

/**
 * Make authenticated request with dynamic endpoint path
 * Combines base endpoint with dynamic parameters
 */
export async function makeAuthenticatedRequestWithPath(
  session: { user: { id: string } },
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
  
  return makeAuthenticatedRequestFromSession(session, url, options);
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

  return makeAuthenticatedRequestWithEndpoint(session, endpoint, options);
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