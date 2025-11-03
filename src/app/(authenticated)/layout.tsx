"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import ErrorBoundary from "@/components/error-boundary";
import { Loading } from "@/components/ui/loading";
import { Error as ErrorComponent } from "@/components/ui/error";
import { useSession } from "@/hooks/useAuth";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { AuthDebug } from "@/components/auth-debug";
import { GlobalHeader } from "@/components/global-header";
import { usePathname } from "next/navigation";
import { logger } from "@/lib/logger";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{
    name?: string;
    role?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    profileCompleteness?: {
      percentage: number;
      completedFields: number;
      totalFields: number;
      missingFields: string[];
      fields: Record<string, { completed: boolean; required: boolean }>;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  // Use the auth redirect hook
  const { redirectToLogin } = useAuthRedirect();

  // Refs to prevent duplicate fetches
  const userFetchedRef = useRef(false);
  const fetchedUserIdRef = useRef<string | null>(null);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    logger.debug('Authenticated Layout useEffect', { status, hasSession: !!session, hasApiToken: !!getApiToken() });
    
    // Only redirect if we're sure the session is not loading and user is not authenticated
    if (status === "unauthenticated") {
      logger.debug('Redirecting: unauthenticated status');
      redirectToLogin();
      return;
    }
    
    // If we have a session but no API token, redirect to get fresh tokens
    const hasToken = getApiToken();
    if (status === "authenticated" && session && !hasToken) {
      logger.warn('Redirecting: Session exists but no API token', { userId: session.user?.id });
      redirectToLogin();
      return;
    }
  }, [status, session, redirectToLogin]);

  // Add a fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (status === "loading") {
        logger.warn('Session loading timeout - forcing unauthenticated state');
        setLoading(false);
      }
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, [status]);

  useEffect(() => {
    const hasToken = getApiToken();
    logger.debug('Main auth effect', { status, hasSession: !!session, hasApiToken: !!hasToken, userId: session?.user?.id });
    
    // Only fetch user data if we have a session AND API token
    if (status === "authenticated" && session?.user?.id && hasToken) {
      const userId = session.user.id;
      
      // Check if we've already fetched this user's data
      if (userFetchedRef.current && fetchedUserIdRef.current === userId && user !== null) {
        logger.debug('User data already fetched, skipping', { userId });
        setLoading(false);
        return;
      }
      
      // Prevent concurrent fetches
      if (fetchInProgressRef.current) {
        logger.debug('User data fetch already in progress, skipping', { userId });
        return;
      }
      
      logger.debug('Fetching user data', { userId });
      fetchInProgressRef.current = true;
      
      const fetchUser = async () => {
        try {
          if (!getApiToken()) {
            logger.warn('No API token, redirecting to login', { userId });
            redirectToLogin();
            fetchInProgressRef.current = false;
            return;
          }
          
          const endpoint = API_ENDPOINTS.usersById.includes('[id]')
            ? API_ENDPOINTS.usersById.replace('[id]', userId)
            : `${API_ENDPOINTS.usersById}/${userId}`;
          const url = `${API_BASE_URL}${endpoint}`;
          
          const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
          
          if (!response.ok) {
            if (response.status === 401) {
              logger.warn('Authentication error, redirecting to login', { userId, status: response.status });
              redirectToLogin();
              fetchInProgressRef.current = false;
              return;
            }
            throw new Error(`Failed to fetch user data: ${response.status}`);
          }
          
          const result = await response.json();
          const userData = result?.data || result?.user || result;
          
          logger.debug('User data fetched successfully', { userId });
          setUser(userData);
          userFetchedRef.current = true;
          fetchedUserIdRef.current = userId;
          fetchInProgressRef.current = false;
        } catch (error) {
          logger.error('Error fetching user data', error instanceof Error ? error : new Error(String(error)), { userId });
          if (error instanceof Error && error.message.includes('401')) {
            redirectToLogin();
            fetchInProgressRef.current = false;
            return;
          }
          setError("Failed to load user data. Please try refreshing the page.");
          fetchInProgressRef.current = false;
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    } else if (status === "loading") {
      setLoading(true);
    } else if (status === "authenticated" && !getApiToken()) {
      redirectToLogin();
      setLoading(false);
    } else if (status === "unauthenticated") {
      userFetchedRef.current = false;
      fetchedUserIdRef.current = null;
      fetchInProgressRef.current = false;
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [status, session?.user?.id, redirectToLogin, session, user]);

  // Check if we're on a full-page route that doesn't need the standard layout
  // Memoized to prevent unnecessary recalculations
  // This must be defined before any early returns
  const isFullPageRoute = useMemo(() => 
    pathname?.includes('/dashboard') || pathname === '/dashboard',
    [pathname]
  );

  if (loading || status === "loading") {
    return (
      <Loading
        variant="dashboard"
        text="Loading Dashboard"
        subtitle="Setting up your workspace..."
        fullScreen
      />
    );
  }

  if (error) {
    return (
      <ErrorComponent
        title="Something went wrong"
        message={error}
        fullScreen
        showRetry
        showGoHome
      />
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthDebug />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Global Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <GlobalHeader
            showRoleNavigation={true}
            showFavorites={true}
            showMessages={true}
            notificationsDropdown={true}
            logoHref="/dashboard"
            showMobileMenu={false}
          />
        </div>

        {/* Main Content Area */}
        <main className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
          </div>

          {/* Content Container */}
          <div className="relative z-10">
            {isFullPageRoute ? (
              // Full page layout for dashboard
              <div className="min-h-[calc(100vh-4rem)]">
                {children}
              </div>
            ) : (
              // Standard content layout
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="space-y-6">
                  {children}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer Spacer */}
        <div className="h-20"></div>
      </div>
    </ErrorBoundary>
  );
}
