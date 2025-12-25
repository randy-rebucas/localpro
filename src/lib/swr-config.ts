/**
 * SWR Configuration
 * 
 * This file configures SWR (stale-while-revalidate) for data fetching.
 * SWR is used instead of TanStack Query for server state management.
 * 
 * Features:
 * - Automatic revalidation
 * - Request deduplication
 * - Error retry
 * - Focus revalidation
 * - Authentication-aware fetcher
 */

import { API_BASE_URL } from './api';
import { createAuthHeaders } from './auth-utils';
import { logger } from './logger';

export interface SWRFetcherOptions extends RequestInit {
  requireAuth?: boolean;
  skipAuth?: boolean;
}

/**
 * SWR fetcher function with authentication support
 * 
 * @param url - The API endpoint URL (can be relative or absolute)
 * @param options - Fetch options including authentication settings
 * @returns Promise with the parsed JSON response
 */
export async function swrFetcher<T = unknown>(
  url: string | null,
  options: SWRFetcherOptions = {}
): Promise<T> {
  if (!url) {
    throw new Error('URL is required');
  }

  // Build full URL if relative
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authentication if required (default: true)
  if (options.requireAuth !== false && !options.skipAuth) {
    const authHeaders = createAuthHeaders();
    if (authHeaders.Authorization) {
      Object.assign(headers, authHeaders);
    } else if (options.requireAuth) {
      throw new Error('Authentication required but no token found');
    }
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Handle token expiry
    if (response.status === 401) {
      logger.warn('SWR: Unauthorized request - token may be expired', { url: fullUrl });
      // Token expiry handling is done in client-api-utils
      throw new Error('Authentication failed');
    }

    // Handle other errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const error = new Error(
        `SWR request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
      );
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    // Parse and return JSON
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Enhance network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.error('SWR: Network error', error, { url: fullUrl });
      throw new Error(`Network error: Unable to connect to API at ${fullUrl}`);
    }
    throw error;
  }
}

/**
 * SWR configuration options
 * 
 * These options apply globally to all SWR hooks unless overridden
 */
export const swrConfig = {
  // Revalidate on focus
  revalidateOnFocus: true,
  
  // Revalidate on reconnect
  revalidateOnReconnect: true,
  
  // Revalidate on mount
  revalidateOnMount: true,
  
  // Dedupe interval (ms) - requests within this time are deduplicated
  dedupingInterval: 2000,
  
  // Focus throttle interval (ms) - throttle revalidation on focus
  focusThrottleInterval: 5000,
  
  // Error retry configuration
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Refresh interval (ms) - 0 means no automatic refresh
  refreshInterval: 0,
  
  // Keep previous data while revalidating
  keepPreviousData: true,
  
  // Should retry on error
  shouldRetryOnError: (error: Error) => {
    // Don't retry on 4xx errors (except 401 which might be temporary)
    if (error instanceof Error && 'status' in error) {
      const status = (error as Error & { status?: number }).status;
      if (status && status >= 400 && status < 500 && status !== 401) {
        return false;
      }
    }
    return true;
  },
  
  // On error callback
  onError: (error: Error, key: string) => {
    logger.error('SWR error', error, { key });
  },
  
  // On success callback
  onSuccess: (data: unknown, key: string) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('SWR success', { key });
    }
  },
};

/**
 * Helper to create SWR key with query parameters
 */
export function createSWRKey(
  endpoint: string,
  params?: Record<string, string | number | boolean | null | undefined>
): string | null {
  if (!endpoint) return null;
  
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value != null)
      .map(([key, value]) => [key, String(value)])
  ).toString();
  
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

