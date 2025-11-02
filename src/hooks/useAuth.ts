"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api';
import { createAuthFetchOptions, getApiToken } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';

export interface User {
  id?: string;
  _id?: string; // MongoDB-style ID
  userId?: string; // Alternative ID field
  email: string;
  name: string;
  role: string;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        logger.debug('useSession: Fetching session', {
          cookies: typeof document !== 'undefined' ? document.cookie : 'N/A',
          location: typeof window !== 'undefined' ? window.location.href : 'N/A'
        });
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          logger.warn('useSession: Request timeout after 10 seconds');
          controller.abort();
        }, 10000); // 10 second timeout
        
        if (!getApiToken()) {
          logger.debug('useSession: No API token found');
          setSession(null);
          setLoading(false);
          return;
        }
        
        const url = `${API_BASE_URL}${API_ENDPOINTS.authMe}`;
        const response = await fetch(url, {
          ...createAuthFetchOptions({ method: 'GET' }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        logger.debug('useSession: Response received', {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.ok) {
          const responseData = await response.json();
          logger.debug('useSession: User data received', { hasData: !!responseData });
          
          // Handle different response structures: { success: true, data: {...} } or direct user object
          const userData = responseData?.data || responseData?.user || responseData;
          
          // Normalize user data: convert _id to id if needed
          const normalizedUser = userData ? {
            ...userData,
            id: userData.id || userData._id || userData.userId || '',
          } : null;
          
          if (normalizedUser && normalizedUser.id) {
            logger.debug('useSession: Normalized user ID', { userId: normalizedUser.id });
            setSession({ user: normalizedUser as User });
          } else {
            logger.warn('useSession: No valid user ID found in response');
            setSession(null);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          logger.debug('useSession: Response not ok', { status: response.status, errorData });
          setSession(null);
        }
      } catch (error) {
        logger.error('useSession: Failed to fetch session', error instanceof Error ? error : new Error(String(error)));
        if (error instanceof Error && error.name === 'AbortError') {
          logger.warn('useSession: Request was aborted due to timeout');
        }
        setSession(null);
      } finally {
        logger.debug('useSession: Setting loading to false');
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  // Add a fallback timeout to prevent infinite loading
  useEffect(() => {
        const fallbackTimeout = setTimeout(() => {
          if (loading) {
            logger.warn('useSession: Fallback timeout - forcing loading to false');
            setLoading(false);
          }
        }, 15000); // 15 second fallback timeout

    return () => clearTimeout(fallbackTimeout);
  }, [loading]);

  return { data: session, status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated' };
}

export async function signOut() {
  try {
    if (!getApiToken()) {
      window.location.href = '/auth';
      return;
    }
    
    const url = `${API_BASE_URL}${API_ENDPOINTS.authLogout}`;
    await fetch(url, createAuthFetchOptions({ method: 'POST' }));
    window.location.href = '/auth';
      } catch (error) {
        logger.error('Failed to sign out', error instanceof Error ? error : new Error(String(error)));
        // Still redirect even if logout request fails
        window.location.href = '/auth';
      }
}
