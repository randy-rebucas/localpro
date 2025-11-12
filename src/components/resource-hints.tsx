"use client";

/**
 * Resource Hints Component
 * 
 * Adds resource hints to the document head for better performance.
 * Should be included in the root layout or early in the app.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { preconnectCriticalOrigins, prefetchRoute } from '@/lib/resource-hints';

/**
 * Critical routes to prefetch on mount
 * These are routes users are likely to visit
 */
const CRITICAL_ROUTES = [
  '/dashboard',
  '/marketplace',
  '/admin',
];

/**
 * Resource Hints Provider
 * Automatically adds resource hints and prefetches critical routes
 */
export function ResourceHints() {
  const pathname = usePathname();

  useEffect(() => {
    // Preconnect to critical origins
    preconnectCriticalOrigins();

    // Prefetch critical routes
    CRITICAL_ROUTES.forEach(route => {
      if (route !== pathname) {
        prefetchRoute(route);
      }
    });
  }, [pathname]);

  return null; // This component doesn't render anything
}

/**
 * Hook to prefetch a route on hover
 * 
 * @example
 * const prefetchHandlers = usePrefetchOnHover('/admin/users');
 * <Link href="/admin/users" {...prefetchHandlers}>Users</Link>
 */
export function usePrefetchOnHover(route: string) {
  return {
    onMouseEnter: () => prefetchRoute(route),
    onFocus: () => prefetchRoute(route),
  };
}

