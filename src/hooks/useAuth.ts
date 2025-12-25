/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/auth/hooks/useAuth' instead.
 */
export * from '@/features/auth/hooks/useAuth';
import { useState, useContext, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api';
import { createAuthFetchOptions, getApiToken } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { SessionContext, clearSessionCache } from '@/contexts/session-context';

export interface User {
  id?: string;
  _id?: string; // MongoDB-style ID
  userId?: string; // Alternative ID field
  email: string;
  name: string;
  roles: string[]; // Multi-role support (array of roles)
  phone: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
  experience?: string;
  avatar?: string;
  portfolio?: unknown[];
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
}

export interface Session {
  user: User;
}

export function useSession() {
  // Always call hooks in the same order
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Try to use shared context if available (will work when SessionProvider is in tree)
  const context = useContext(SessionContext);
  
  useEffect(() => {
    // Skip fetching if we have context (SessionProvider handles it)
    if (context !== undefined) {
      return;
    }
    const fetchSession = async () => {
      try {
        if (!getApiToken()) {
          logger.debug('useSession: No API token found');
          setSession(null);
          setLoading(false);
          return;
        }
        
        const url = `${API_BASE_URL}${API_ENDPOINTS.authMe}`;
        const response = await fetch(url, {
          ...createAuthFetchOptions({ method: 'GET' }),
        });
        
        if (response.ok) {
          const responseData = await response.json();
          const userData = responseData?.data || responseData?.user || responseData;
          
          const normalizedUser = userData ? {
            ...userData,
            id: userData.id || userData._id || userData.userId || '',
          } : null;
          
          if (normalizedUser && normalizedUser.id) {
            setSession({ user: normalizedUser as User });
          } else {
            setSession(null);
          }
        } else {
          // Handle 429 gracefully
          if (response.status === 429) {
            logger.warn('useSession: Rate limited');
          }
          setSession(null);
        }
      } catch (error) {
        logger.error('useSession: Failed to fetch session', error instanceof Error ? error : new Error(String(error)));
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [context]);

  // If context is available, use it; otherwise use local state
  if (context !== undefined) {
    const { session: contextSession, loading: contextLoading } = context;
    return { 
      data: contextSession, 
      status: contextLoading ? 'loading' : contextSession ? 'authenticated' : 'unauthenticated' 
    };
  }

  return { data: session, status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated' };
}

export async function signOut() {
  try {
    // Call logout API endpoint if we have a token
    if (getApiToken()) {
      try {
        const url = `${API_BASE_URL}${API_ENDPOINTS.authLogout}`;
        await fetch(url, createAuthFetchOptions({ method: 'POST' }));
      } catch (apiError) {
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        logger.warn('Logout API call failed, continuing with local cleanup', { error: errorMessage });
      }
    }
    
    // Clear all authentication data (cookies, localStorage, sessionStorage)
    if (typeof window !== 'undefined') {
      // Clear cookies - specifically session and api-token
      const cookiesToClear = ['session', 'api-token', 'auth-token', 'token', 'access-token', 'refresh-token'];
      const domain = window.location.hostname;
      
      cookiesToClear.forEach(cookieName => {
        // Clear with different path and domain combinations
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${domain}`;
      });
      
      // Clear all cookies (fallback for any other auth cookies)
      document.cookie.split(";").forEach(function(cookie) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.trim().substring(0, eqPos) : cookie.trim();
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${domain}`;
        }
      });
      
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
      
      // Clear SessionContext cache
      clearSessionCache();
      
      logger.debug('All authentication data cleared');
    }
    
    // Redirect to auth page
    window.location.href = '/auth';
  } catch (error) {
    logger.error('Failed to sign out', error instanceof Error ? error : new Error(String(error)));
    // Still clear local data and redirect even if something fails
    if (typeof window !== 'undefined') {
      // Force clear cookies
      document.cookie.split(";").forEach(function(cookie) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.trim().substring(0, eqPos) : cookie.trim();
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });
      localStorage.clear();
      sessionStorage.clear();
    }
    window.location.href = '/auth';
  }
}
