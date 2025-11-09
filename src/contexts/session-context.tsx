"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api';
import { createAuthFetchOptions, getApiToken } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { Session, User } from '@/hooks/useAuth';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Global request deduplication - prevent multiple simultaneous requests
let sessionPromise: Promise<Session | null> | null = null;
let cachedSession: Session | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(cachedSession);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchSession = async (): Promise<Session | null> => {
    // If there's already a request in progress, wait for it
    if (sessionPromise) {
      return sessionPromise;
    }

    // Check cache first
    const now = Date.now();
    if (cachedSession && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedSession;
    }

    // Create new request
    sessionPromise = (async () => {
      try {
        if (!getApiToken()) {
          logger.debug('SessionProvider: No API token found');
          return null;
        }

        const url = `${API_BASE_URL}${API_ENDPOINTS.authMe}`;
        const response = await fetch(url, {
          ...createAuthFetchOptions({ method: 'GET' }),
        });

        if (!response.ok) {
          // Handle 429 rate limit gracefully
          if (response.status === 429) {
            logger.warn('SessionProvider: Rate limited, using cached session if available');
            return cachedSession; // Return cached session if available
          }
          logger.debug('SessionProvider: Response not ok', { status: response.status });
          return null;
        }

        const responseData = await response.json();
        const userData = responseData?.data || responseData?.user || responseData;

        if (!userData) {
          return null;
        }

        // Normalize user data
        const normalizedUser = {
          ...userData,
          id: userData.id || userData._id || userData.userId || '',
        };

        if (!normalizedUser.id) {
          return null;
        }

        const newSession: Session = { user: normalizedUser as User };
        
        // Update cache
        cachedSession = newSession;
        cacheTimestamp = now;
        
        return newSession;
      } catch (error) {
        logger.error('SessionProvider: Failed to fetch session', error instanceof Error ? error : new Error(String(error)));
        return cachedSession; // Return cached session on error
      } finally {
        sessionPromise = null;
      }
    })();

    return sessionPromise;
  };

  useEffect(() => {
    mountedRef.current = true;

    const loadSession = async () => {
      setLoading(true);
      const sessionData = await fetchSession();
      
      if (mountedRef.current) {
        setSession(sessionData);
        setLoading(false);
      }
    };

    loadSession();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = async () => {
    // Clear cache to force refresh
    cachedSession = null;
    cacheTimestamp = 0;
    
    setLoading(true);
    const sessionData = await fetchSession();
    
    if (mountedRef.current) {
      setSession(sessionData);
      setLoading(false);
    }
  };

  return (
    <SessionContext.Provider value={{ session, loading, refetch }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}

/**
 * Clear the session cache (useful for logout)
 * This clears the module-level cache variables
 */
export function clearSessionCache(): void {
  cachedSession = null;
  cacheTimestamp = 0;
  sessionPromise = null;
  logger.debug('Session cache cleared');
}

