/**
 * Resource Hints Utilities
 * 
 * Provides utilities for adding resource hints (prefetch, preload, preconnect)
 * to improve performance and perceived load times.
 */

/**
 * Prefetch a route for faster navigation
 * 
 * @param href - The route to prefetch
 * @example
 * prefetchRoute('/admin/users');
 */
export function prefetchRoute(href: string) {
  if (typeof window === 'undefined') return;
  
  // Use Next.js router prefetch if available
  // Next.js router is available on window but not in types
  const router = (window as { router?: { prefetch?: (href: string) => void } }).router;
  if (router?.prefetch) {
    try {
      router.prefetch(href);
    } catch {
      // Fallback to manual prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  } else {
    // Manual prefetch using link tag
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
}

/**
 * Preload a resource (CSS, JS, font, etc.)
 * 
 * @param href - Resource URL
 * @param as - Resource type ('script', 'style', 'font', 'image', etc.)
 * @param crossOrigin - CORS setting
 * @example
 * preloadResource('/fonts/custom.woff2', 'font', 'anonymous');
 */
export function preloadResource(
  href: string,
  as: string = 'script',
  crossOrigin?: string
) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossOrigin) {
    link.crossOrigin = crossOrigin;
  }
  document.head.appendChild(link);
}

/**
 * Preconnect to an origin for faster resource loading
 * 
 * @param origin - Origin URL
 * @param crossOrigin - CORS setting
 * @example
 * preconnectOrigin('https://api.example.com');
 */
export function preconnectOrigin(origin: string, crossOrigin?: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  if (crossOrigin) {
    link.crossOrigin = crossOrigin;
  }
  document.head.appendChild(link);
}

/**
 * DNS prefetch for faster domain resolution
 * 
 * @param domain - Domain to prefetch
 * @example
 * dnsPrefetch('https://cdn.example.com');
 */
export function dnsPrefetch(domain: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = domain;
  document.head.appendChild(link);
}

/**
 * Prefetch critical API endpoints
 * Useful for endpoints that are likely to be called soon
 * 
 * @param endpoint - API endpoint URL
 * @example
 * prefetchAPI('/api/user/profile');
 */
export function prefetchAPI(endpoint: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = endpoint;
  link.as = 'fetch';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/**
 * Batch prefetch multiple routes
 * 
 * @param routes - Array of routes to prefetch
 * @example
 * prefetchRoutes(['/admin/users', '/admin/analytics', '/dashboard']);
 */
export function prefetchRoutes(routes: string[]) {
  routes.forEach(route => prefetchRoute(route));
}

/**
 * Preconnect to critical third-party origins
 * Call this early in the app lifecycle
 * 
 * @example
 * preconnectCriticalOrigins();
 */
export function preconnectCriticalOrigins() {
  if (typeof window === 'undefined') return;
  
  const origins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    // Add your API domain here
    // 'https://api.example.com',
  ];
  
  origins.forEach(origin => {
    preconnectOrigin(origin, 'anonymous');
  });
}

