"use client";

import { useState, useEffect } from 'react';
import { makeClientAuthenticatedRequestWithEndpointSafe } from '@/lib/client-api-utils';
import { API_ENDPOINTS } from '@/lib/api';

export interface User {
  id: string;
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
        console.log('🔍 useSession: Fetching session...');
        console.log('🔍 useSession: Current cookies:', document.cookie);
        console.log('🔍 useSession: Window location:', window.location.href);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⚠️ useSession: Request timeout after 10 seconds');
          controller.abort();
        }, 10000); // 10 second timeout
        
        const response = await makeClientAuthenticatedRequestWithEndpointSafe(
          'authMe' as keyof typeof API_ENDPOINTS,
          { method: 'GET', signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        console.log('🔍 useSession: Response status:', response.status);
        console.log('🔍 useSession: Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const userData = await response.json();
          console.log('🔍 useSession: User data received:', userData);
          setSession({ user: userData });
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log('🔍 useSession: Response not ok, error data:', errorData);
          setSession(null);
        }
      } catch (error) {
        console.error('🔍 useSession: Failed to fetch session:', error);
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('⚠️ useSession: Request was aborted due to timeout');
        }
        setSession(null);
      } finally {
        console.log('🔍 useSession: Setting loading to false');
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  // Add a fallback timeout to prevent infinite loading
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        console.log('⚠️ useSession: Fallback timeout - forcing loading to false');
        setLoading(false);
      }
    }, 15000); // 15 second fallback timeout

    return () => clearTimeout(fallbackTimeout);
  }, [loading]);

  return { data: session, status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated' };
}

export async function signOut() {
  try {
    await makeClientAuthenticatedRequestWithEndpointSafe(
      'authLogout' as keyof typeof API_ENDPOINTS,
      { method: 'POST' }
    );
    window.location.href = '/auth';
  } catch (error) {
    console.error('Failed to sign out:', error);
  }
}
