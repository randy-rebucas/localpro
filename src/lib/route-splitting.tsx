/**
 * Route-Based Code Splitting Utilities
 * 
 * This file provides utilities for implementing route-based code splitting
 * to further optimize bundle sizes by splitting code at the route level.
 */

import React from 'react';
import dynamic from 'next/dynamic';

/**
 * Lazy load admin pages - only load when user navigates to admin routes
 * This helps reduce initial bundle size significantly
 */

// Admin Pages - Heavy components that can be lazy loaded
export const LazyAdminUsersPage = dynamic(
  () => import('@/app/admin/users/page'),
  {
    loading: () => <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>,
  }
);

export const LazyAdminAnalyticsPage = dynamic(
  () => import('@/app/admin/analytics/page'),
  {
    loading: () => <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>,
  }
);

/**
 * Preload route on hover or before navigation
 * Useful for improving perceived performance
 * 
 * @example
 * <Link
 *   href="/admin/users"
 *   onMouseEnter={() => preloadRoute('/admin/users')}
 * >
 *   Users
 * </Link>
 */
export async function preloadRoute(route: string) {
  try {
    // Map routes to their dynamic imports
    const routeMap: Record<string, () => Promise<unknown>> = {
      '/admin/users': () => import('@/app/admin/users/page'),
      '/admin/analytics': () => import('@/app/admin/analytics/page'),
      '/admin/payments': () => import('@/app/admin/payments/page'),
      '/admin/finance': () => import('@/app/admin/finance/page'),
      '/admin/marketplace': () => import('@/app/admin/marketplace/page'),
      '/admin/supplies': () => import('@/app/admin/supplies/page'),
      '/admin/rentals': () => import('@/app/admin/rentals/page'),
      '/admin/academy': () => import('@/app/admin/academy/page'),
      '/admin/ads': () => import('@/app/admin/ads/page'),
      '/admin/jobs': () => import('@/app/admin/jobs/page'),
      '/admin/providers': () => import('@/app/admin/providers/page'),
      '/admin/errors': () => import('@/app/admin/errors/page'),
      '/admin/logs': () => import('@/app/admin/logs/page'),
      '/admin/audit': () => import('@/app/admin/audit/page'),
      '/admin/trust-verification': () => import('@/app/admin/trust-verification/page'),
      '/admin/referrals': () => import('@/app/admin/referrals/page'),
      '/admin/subscriptions': () => import('@/app/admin/subscriptions/page'),
      '/admin/plus': () => import('@/app/admin/plus/page'),
      '/admin/communication': () => import('@/app/admin/communication/page'),
      '/admin/settings': () => import('@/app/admin/settings/page'),
      '/admin/app-settings': () => import('@/app/admin/app-settings/page'),
    };

    const loader = routeMap[route];
    if (loader) {
      await loader();
    }
  } catch (error) {
    // Silently fail - route will load when navigated to
    console.debug(`Failed to preload route: ${route}`, error);
  }
}

/**
 * Hook for preloading routes on hover
 * 
 * @example
 * const preloadHandlers = usePreloadRoute('/admin/users');
 * 
 * <Link
 *   href="/admin/users"
 *   {...preloadHandlers}
 * >
 *   Users
 * </Link>
 */
export function usePreloadRoute(route: string) {
  return {
    onMouseEnter: () => preloadRoute(route),
    onFocus: () => preloadRoute(route), // For keyboard navigation
  };
}

