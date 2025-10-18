"use client";

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  firstName?: string;
  lastName?: string;
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
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setSession({ user: userData });
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
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
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/signin';
  } catch (error) {
    console.error('Failed to sign out:', error);
  }
}
