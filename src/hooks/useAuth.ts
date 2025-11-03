"use client";

import { useState, useEffect, useContext } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api';
import { createAuthFetchOptions, getApiToken } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { SessionContext } from '@/contexts/session-context';

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
  // Try to use shared context if available (will work when SessionProvider is in tree)
  const context = useContext(SessionContext);
  if (context !== undefined) {
    const { session, loading } = context;
    return { 
      data: session, 
      status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated' 
    };
  }

  // Fallback implementation (used if SessionProvider is not in tree)
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

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
