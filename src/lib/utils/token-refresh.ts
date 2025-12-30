/**
 * Token refresh management utilities
 * Handles automatic token refresh before expiration
 */

import { getAuthToken, getRefreshToken, setAuthToken, setRefreshToken, removeAllTokens } from './cookies';
import { API_BASE_URL } from '@/lib/api';
import { logger } from '@/lib/logger';

let refreshTimer: NodeJS.Timeout | null = null;
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Decode JWT token to get expiration time
 */
function decodeToken(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    logger.error('Failed to decode token', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get token expiration time in milliseconds
 */
function getTokenExpiration(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  
  return decoded.exp * 1000; // Convert to milliseconds
}

/**
 * Check if token is expiring soon (within threshold)
 */
function isTokenExpiringSoon(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return false;
  
  const now = Date.now();
  const timeUntilExpiration = expiration - now;
  
  return timeUntilExpiration < REFRESH_THRESHOLD;
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<{ token: string; refreshToken: string } | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    logger.warn('No refresh token available');
    return null;
  }

  // Check if API_BASE_URL is available
  if (!API_BASE_URL) {
    logger.error('API_BASE_URL is not configured');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });

    if (!response.ok) {
      // Don't log 401 as error if it's expected (expired refresh token)
      if (response.status === 401) {
        logger.debug('Token refresh failed: refresh token expired or invalid');
      } else {
        logger.error('Token refresh failed', new Error(`HTTP ${response.status}`));
      }
      return null;
    }

    const data = await response.json();
    
    if (data.token && data.refreshToken) {
      return {
        token: data.token,
        refreshToken: data.refreshToken,
      };
    }

    logger.warn('Token refresh response missing tokens');
    return null;
  } catch (error) {
    // Only log network errors, not expected failures
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.error('Token refresh network error', error);
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug('Token refresh error', { error: errorMessage });
    }
    return null;
  }
}

/**
 * Initialize token tracking and set up automatic refresh
 */
export function initializeTokenTracking(accessToken: string, refreshToken: string): void {
  // Clear any existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  // Validate tokens exist
  if (!accessToken || !refreshToken) {
    logger.warn('Cannot initialize token tracking: missing tokens');
    return;
  }

  const expiration = getTokenExpiration(accessToken);
  if (!expiration) {
    logger.warn('Could not determine token expiration, skipping auto-refresh setup');
    return;
  }

  const now = Date.now();
  const timeUntilExpiration = expiration - now;
  
  // If token is already expired or expires in less than 1 minute, don't schedule refresh
  // This prevents immediate refresh attempts that could cause 401 errors
  if (timeUntilExpiration < 60 * 1000) {
    logger.warn('Token expires too soon, not scheduling auto-refresh');
    return;
  }

  const timeUntilRefresh = timeUntilExpiration - REFRESH_THRESHOLD;

  // Only schedule refresh if there's reasonable time left (at least 1 minute)
  if (timeUntilRefresh > 60 * 1000) {
    scheduleTokenRefresh(timeUntilRefresh);
  } else {
    logger.warn('Token refresh time too short, not scheduling auto-refresh');
  }
}

/**
 * Schedule token refresh
 */
function scheduleTokenRefresh(delay: number): void {
  refreshTimer = setTimeout(async () => {
    const newTokens = await refreshAccessToken();
    
    if (newTokens) {
      setAuthToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      
      // Schedule next refresh
      initializeTokenTracking(newTokens.token, newTokens.refreshToken);
    } else {
      // Refresh failed, clear tokens and redirect to login
      removeAllTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth?session=expired';
      }
    }
  }, delay);
}

/**
 * Get valid token, refreshing if needed
 */
export async function getValidToken(): Promise<string | null> {
  const token = getAuthToken();
  
  if (!token) {
    return null;
  }

  // Check if token is expiring soon
  if (isTokenExpiringSoon(token)) {
    const newTokens = await refreshAccessToken();
    
    if (newTokens) {
      setAuthToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      initializeTokenTracking(newTokens.token, newTokens.refreshToken);
      return newTokens.token;
    } else {
      // Refresh failed
      removeAllTokens();
      return null;
    }
  }

  return token;
}

/**
 * Clear token tracking
 */
export function clearTokenTracking(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

