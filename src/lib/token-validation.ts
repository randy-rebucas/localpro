"use client";

import { isAuthenticated, clearAllAuthData } from "./client-api-utils";
import { API_BASE_URL, API_ENDPOINTS } from "./api";
import { createAuthFetchOptions } from "./auth-utils";
import { logger } from "./logger";

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  shouldRedirect?: boolean;
}

/**
 * Validate the current authentication token
 * @returns Promise with validation result
 */
export async function validateToken(): Promise<TokenValidationResult> {
  try {
    // Check if we have an API token
    if (!isAuthenticated()) {
      return {
        isValid: false,
        error: "No authentication token found",
        shouldRedirect: true
      };
    }

    // Try to make a simple authenticated request to validate the token
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authMe}`, createAuthFetchOptions({
      method: 'GET',
      credentials: 'include',
    }));

    if (response.ok) {
      return {
        isValid: true
      };
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: "Token expired or invalid",
        shouldRedirect: true
      };
    } else {
      return {
        isValid: false,
        error: `Token validation failed with status: ${response.status}`
      };
    }
  } catch (error) {
    logger.error("Token validation error", error instanceof Error ? error : new Error(String(error)));
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error during token validation"
    };
  }
}

/**
 * Validate token and handle expiry automatically
 * @returns Promise indicating if token is valid
 */
export async function validateTokenWithFallback(): Promise<boolean> {
  const result = await validateToken();
  
  if (!result.isValid && result.shouldRedirect) {
    logger.warn("Token validation failed, clearing auth data and redirecting to login");
    
    // Clear all authentication data
    clearAllAuthData();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
    
    return false;
  }
  
  return result.isValid;
}

/**
 * Check if token is likely expired based on common patterns
 * @returns boolean indicating if token might be expired
 */
export function isTokenLikelyExpired(): boolean {
  try {
    // Check if we have an API token
    if (!isAuthenticated()) {
      return true;
    }

    // Check if there are any stored error messages indicating auth issues
    if (typeof window !== 'undefined') {
      const lastError = localStorage.getItem('lastAuthError');
      if (lastError && lastError.includes('401')) {
        return true;
      }
    }

    return false;
  } catch {
    return true;
  }
}

/**
 * Store authentication error for later checking
 * @param error The error message
 */
export function storeAuthError(error: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastAuthError', error);
    // Clear after 5 minutes
    setTimeout(() => {
      localStorage.removeItem('lastAuthError');
    }, 5 * 60 * 1000);
  }
}

/**
 * Clear stored authentication error
 */
export function clearAuthError(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lastAuthError');
  }
}

/**
 * Hook for token validation in React components
 */
export function useTokenValidation() {
  const validateTokenNow = () => validateToken();
  const validateWithFallback = () => validateTokenWithFallback();
  const checkIfExpired = () => isTokenLikelyExpired();
  
  return {
    validateToken: validateTokenNow,
    validateWithFallback,
    isLikelyExpired: checkIfExpired,
    storeError: storeAuthError,
    clearError: clearAuthError
  };
}
