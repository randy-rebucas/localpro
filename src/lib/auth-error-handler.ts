"use client";

import { useRouter } from "next/navigation";

/**
 * Authentication Error Handler
 * Provides consistent handling of authentication errors across the application
 */

export interface AuthErrorOptions {
  redirectToLogin?: boolean;
  showToast?: boolean;
  fallbackAction?: () => void;
}

/**
 * Handle authentication errors consistently
 * @param error - The error object
 * @param options - Configuration options
 */
export function handleAuthError(
  error: unknown, 
  options: AuthErrorOptions = {}
): void {
  const {
    redirectToLogin = true,
    fallbackAction
  } = options;

  // Check if it's a 401 authentication error
  if ((error && typeof error === 'object' && 'status' in error && error.status === 401) || 
      (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 401)) {
    console.warn("Authentication failed - session may have expired");
    
    if (redirectToLogin) {
      // Clear any stored session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('session');
        sessionStorage.clear();
      }
      
      // Redirect to login page
      window.location.href = '/auth';
      return;
    }
    
    if (fallbackAction) {
      fallbackAction();
      return;
    }
  }
  
  // For other errors, log them
  console.error("Authentication error:", error);
}

/**
 * Check if an error is an authentication error
 * @param error - The error object
 * @returns boolean indicating if it's an auth error
 */
export function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorObj = error as Record<string, unknown>;
  
  // Check status directly
  if (errorObj.status === 401) return true;
  
  // Check response status
  if (errorObj.response && typeof errorObj.response === 'object') {
    const response = errorObj.response as Record<string, unknown>;
    if (response.status === 401) return true;
  }
  
  // Check message content
  if (typeof errorObj.message === 'string') {
    if (errorObj.message.includes('401') || errorObj.message.includes('Unauthorized')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Create a safe API call wrapper that handles auth errors
 * @param apiCall - The API function to call
 * @param options - Configuration options
 * @returns Promise that handles auth errors
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options: AuthErrorOptions = {}
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    if (isAuthError(error)) {
      handleAuthError(error, options);
      return null;
    }
    throw error;
  }
}

/**
 * Hook for handling authentication errors in React components
 */
export function useAuthErrorHandler() {
  const router = useRouter();
  
  const handleAuthError = (error: unknown, options: AuthErrorOptions = {}) => {
    const {
      redirectToLogin = true,
      fallbackAction
    } = options;

    if (isAuthError(error)) {
      console.warn("Authentication failed - session may have expired");
      
      if (redirectToLogin) {
        // Clear session data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('session');
          sessionStorage.clear();
        }
        
        // Use Next.js router for client-side navigation
        router.push('/auth');
        return;
      }
      
      if (fallbackAction) {
        fallbackAction();
        return;
      }
    }
    
    console.error("Authentication error:", error);
  };

  return { handleAuthError, isAuthError };
}

/**
 * Enhanced fetch wrapper that handles authentication errors
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param authOptions - Authentication error handling options
 * @returns Promise with auth error handling
 */
export async function authAwareFetch(
  url: string,
  options: RequestInit = {},
  authOptions: AuthErrorOptions = {}
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 401) {
      handleAuthError({ status: 401 }, authOptions);
      return response;
    }
    
    return response;
  } catch (error) {
    if (isAuthError(error)) {
      handleAuthError(error, authOptions);
    }
    throw error;
  }
}

/**
 * Session validation utility
 * Check if the current session is valid
 */
export function validateSession(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const session = localStorage.getItem('session');
    if (!session) return false;
    
    const sessionData = JSON.parse(session);
    const now = new Date().getTime();
    
    // Check if session has expired
    if (sessionData.expiresAt && sessionData.expiresAt < now) {
      localStorage.removeItem('session');
      return false;
    }
    
    return true;
  } catch {
    localStorage.removeItem('session');
    return false;
  }
}

/**
 * Clear session data
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('session');
    sessionStorage.clear();
  }
}
