"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Loading } from "@/components/ui/loading";
import { Error as ErrorComponent } from "@/components/ui/error";
import { useSession } from "@/hooks/useAuth";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { GlobalHeader } from "@/components/global-header";
// Lazy load footer - it's below the fold and doesn't need to load immediately
import { LazyMarketplaceFooter } from "@/lib/lazy-components";
import { usePathname, useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";
import { MonitoringProviders } from "@/components/monitoring";
import { UnregisterServiceWorker } from "@/components/unregister-sw";
import { usePreferredFeature } from "@/hooks/usePreferredFeature";
import { PreferredFeaturePrompt } from "@/components/preferred-feature-prompt";
import { FloatingFeatureSelector } from "@/components/floating-feature-selector";
import { PerformanceDebug } from "@/components/performance-debug";
import { PACKAGE_REGISTRY } from "@/shared/config/package-registry";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{
    name?: string;
    role?: string;
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    notificationPreferences?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      marketing?: boolean;
    };
    profileComplete?: boolean;
    locationComplete?: boolean;
    notificationsComplete?: boolean;
    onboardingComplete?: boolean;
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
  const router = useRouter();
  const { preferredFeature } = usePreferredFeature();

  // Use the auth redirect hook
  const { redirectToLogin } = useAuthRedirect();

  // Refs to prevent duplicate fetches
  const userFetchedRef = useRef(false);
  const fetchedUserIdRef = useRef<string | null>(null);
  const fetchInProgressRef = useRef(false);
  const preferredFeatureRedirectedRef = useRef(false);
  const onboardingRedirectedRef = useRef(false);

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
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isNetworkError = errorMessage.includes('Failed to fetch') || 
                                 errorMessage.includes('NetworkError') ||
                                 errorMessage.includes('Network request failed');
          
          // Log network errors at debug level to reduce console noise
          // Critical errors (auth, server errors) are still logged as errors
          if (isNetworkError) {
            logger.debug('Network error fetching user data', { 
              userId, 
              errorMessage: errorMessage 
            });
            // For network errors, don't break the UI - just silently fail
            // The session from useSession should be sufficient for most cases
            fetchInProgressRef.current = false;
            setLoading(false);
            return;
          }
          
          // Log other errors normally
          logger.error('Error fetching user data', error instanceof Error ? error : new Error(errorMessage), { userId });
          
          if (error instanceof Error && error.message.includes('401')) {
            redirectToLogin();
            fetchInProgressRef.current = false;
            return;
          }
          
          // Only set error state for non-network errors
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

  // Smart redirect logic: Check profile completion and redirect to appropriate onboarding step
  useEffect(() => {
    // Skip if still loading or not authenticated
    if (loading || status !== "authenticated" || !session || !user) {
      return;
    }

    // Skip if already on an onboarding route to prevent redirect loops
    if (pathname?.startsWith('/onboarding')) {
      logger.debug('Already on onboarding route, skipping redirect check', { pathname });
      return;
    }

    // Skip if already redirected in this session
    if (onboardingRedirectedRef.current) {
      return;
    }

    // Check profile completion status
    const hasBasicProfile = user.firstName && user.lastName && (user.phone || user.email);
    const hasLocation = user.address && user.city && user.state && user.country;
    const hasNotificationPrefs = user.notificationPreferences && 
      (typeof user.notificationPreferences.email !== 'undefined' || 
       typeof user.notificationPreferences.sms !== 'undefined' || 
       typeof user.notificationPreferences.push !== 'undefined');
    const onboardingComplete = user.onboardingComplete === true;

    let redirectPath: string | null = null;

    // Determine which step is incomplete and needs to be completed
    if (!hasBasicProfile) {
      redirectPath = '/onboarding';
      logger.info('Missing basic profile, redirecting to onboarding', { 
        userId: session.user?.id,
        hasFirstName: !!user.firstName,
        hasLastName: !!user.lastName,
        hasContact: !!(user.phone || user.email)
      });
    } else if (!hasLocation) {
      redirectPath = '/onboarding/location';
      logger.info('Missing location, redirecting to location setup', { 
        userId: session.user?.id,
        hasAddress: !!user.address,
        hasCity: !!user.city,
        hasState: !!user.state,
        hasCountry: !!user.country
      });
    } else if (!hasNotificationPrefs) {
      redirectPath = '/onboarding/notifications';
      logger.info('Missing notification preferences, redirecting to notifications setup', { 
        userId: session.user?.id,
        hasPrefs: !!user.notificationPreferences
      });
    } else if (!onboardingComplete) {
      redirectPath = '/onboarding/welcome';
      logger.info('Onboarding not marked complete, redirecting to welcome screen', { 
        userId: session.user?.id,
        onboardingComplete: user.onboardingComplete
      });
    }

    // Perform redirect if needed
    if (redirectPath) {
      onboardingRedirectedRef.current = true;
      logger.info('Redirecting to complete onboarding', { 
        from: pathname, 
        to: redirectPath,
        userId: session.user?.id
      });
      router.push(redirectPath);
    }
  }, [status, session, loading, user, pathname, router]);

  // Redirect to preferred feature if selected and on home/dashboard
  useEffect(() => {
    // Only redirect if:
    // 1. User is authenticated and loaded
    // 2. Has a preferred feature
    // 3. Is on home page (/) or dashboard
    // 4. Haven't redirected yet in this session
    // 5. Onboarding is complete (don't interfere with onboarding flow)
    if (
      status === "authenticated" &&
      session &&
      !loading &&
      user?.onboardingComplete &&
      preferredFeature &&
      !preferredFeatureRedirectedRef.current
    ) {
      const isHomePage = pathname === "/" || pathname === "/dashboard";
      const featureRoute = preferredFeature ? PACKAGE_REGISTRY[preferredFeature]?.route : undefined;

      if (isHomePage && featureRoute && pathname !== featureRoute) {
        logger.debug("Redirecting to preferred feature", {
          preferredFeature,
          featureRoute,
          currentPath: pathname,
        });
        preferredFeatureRedirectedRef.current = true;
        router.push(featureRoute);
      }
    }
  }, [status, session, loading, user?.onboardingComplete, preferredFeature, pathname, router]);

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
    <Providers>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Global Header */}
        <div className="bg-white/80 backdrop-blur-md border-gray-200/50 shadow-sm relative z-50">
          <GlobalHeader
            showRoleNavigation={true}
            showFavorites={true}
            notificationsDropdown={true}
            logoHref="/dashboard"
            showMobileMenu={false}
          />
        </div>

        {/* Main Content Area */}
        <main className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
          </div>

          {/* Content Container */}
          <div className="relative z-10">
            {isFullPageRoute ? (
              // Full page layout for dashboard (container handled in dashboard/layout.tsx)
              <div className="min-h-[calc(100vh-4rem)]">
                {children}
              </div>
            ) : (
              // Standard content layout with container
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">
                  {children}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Global Footer - Lazy loaded for better initial performance */}
        <LazyMarketplaceFooter />
      </div>
      <Toaster position="top-right" />
      <MonitoringProviders />
      <UnregisterServiceWorker />
      <PreferredFeaturePrompt />
      <FloatingFeatureSelector />
      <PerformanceDebug />

    </Providers>
  );
}
