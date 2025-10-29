"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, clearAllAuthData } from "@/lib/client-api-utils";

/**
 * Custom hook to handle authentication redirects
 * Prevents infinite redirect loops and provides reliable redirects
 */
export function useAuthRedirect() {
  const redirectAttempted = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const redirectToLogin = () => {
    console.log("🔄 redirectToLogin called");
    console.log("🔄 Current state:", {
      redirectAttempted: redirectAttempted.current,
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
      currentURL: typeof window !== 'undefined' ? window.location.href : 'N/A'
    });

    // Prevent multiple redirect attempts
    if (redirectAttempted.current) {
      console.log("🟡 Redirect already attempted, skipping");
      return;
    }

    // Check if we're already on auth page
    if (typeof window !== 'undefined' && window.location.pathname === '/auth') {
      console.log("🟡 Already on auth page, skipping redirect");
      return;
    }

    console.log("🔄 Attempting redirect to login");
    redirectAttempted.current = true;

    // Clear session data before redirecting
    if (typeof window !== 'undefined') {
      console.log("🧹 Clearing session data before redirect");
      clearAllAuthData();
    }

    // Clear any existing timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    // Use Next.js router for client-side navigation instead of window.location.href
    redirectTimeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined') {
        console.log("🔄 Executing redirect to /auth using Next.js router");
        try {
          router.push('/auth');
        } catch (error) {
          console.error("🔄 Router push failed, falling back to window.location:", error);
          window.location.href = '/auth';
        }
      }
    }, 50);
  };

  const resetRedirect = () => {
    redirectAttempted.current = false;
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  return {
    redirectToLogin,
    resetRedirect,
    hasRedirected: redirectAttempted.current
  };
}

/**
 * Hook to check authentication status and handle redirects
 */
export function useAuthStatus() {
  const { redirectToLogin } = useAuthRedirect();

  const checkAuthAndRedirect = (status: string, session: unknown) => {
    console.log("🔍 Auth Status Check:", { status, hasSession: !!session, isAuthenticated: isAuthenticated() });

    // Handle unauthenticated users
    if (status === "unauthenticated") {
      console.log("🔴 User is unauthenticated, redirecting to login");
      redirectToLogin();
      return false;
    }

    // Handle users with session but no API token
    if (status === "authenticated" && !isAuthenticated()) {
      console.log("🔴 User has session but no API token, redirecting to login");
      redirectToLogin();
      return false;
    }

    // User is properly authenticated
    if (status === "authenticated" && isAuthenticated()) {
      console.log("🟢 User is properly authenticated");
      return true;
    }

    // Still loading
    console.log("🟡 Authentication status is loading");
    return null; // null means still loading
  };

  return {
    checkAuthAndRedirect,
    redirectToLogin
  };
}
