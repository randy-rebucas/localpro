import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";
import { logger } from "@/lib/logger";

// Cache for authentication checks to improve performance
const authCache = new Map<string, { 
  isValid: boolean; 
  userRole?: string; 
  userId?: string;
  apiToken?: string;
  timestamp: number 
}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of authCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      authCache.delete(key);
    }
  }
}, CACHE_DURATION);

// Helper function to check authentication and get user role
async function checkAuth(request: NextRequest): Promise<{ 
  isAuthenticated: boolean; 
  userRole?: string; 
  userId?: string;
  apiToken?: string;
}> {
  // First, try to get Bearer token from Authorization header
  const authHeader = request.headers.get("authorization");
  let sessionToken: string | null = null;
  let apiToken: string | null = null;
  
  // Get cookies
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(';').map(c => c.trim());
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // Bearer token can be either api-token or session token
    const bearerToken = authHeader.substring(7);
    sessionToken = bearerToken;
    apiToken = bearerToken;
  } else {
    // Check for api-token cookie first (stored directly as cookie from external API)
    const apiTokenCookie = cookies.find(c => c.startsWith('api-token='));
    if (apiTokenCookie) {
      apiToken = apiTokenCookie.split('=')[1];
    }
    
    // Get session cookie for user info
    const sessionCookie = cookies.find(c => c.startsWith('session='));
    sessionToken = sessionCookie?.split('=')[1] || null;
  }

  // If we have api-token but no session, allow authentication based on api-token
  // The api-token is a JWT from external API, so we consider it valid authentication
  if (!sessionToken && apiToken) {
    const cacheKey = `api-token-${apiToken}`;
    
    // Check cache first
    const cached = authCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { 
        isAuthenticated: cached.isValid, 
        userRole: cached.userRole,
        userId: cached.userId,
        apiToken: cached.apiToken
      };
    }

    // Allow authentication with api-token (user info will be fetched client-side)
    authCache.set(cacheKey, {
      isValid: true,
      userRole: undefined, // Will be fetched client-side
      userId: undefined, // Will be fetched client-side
      apiToken: apiToken,
      timestamp: Date.now(),
    });

    return { 
      isAuthenticated: true, 
      userRole: undefined,
      userId: undefined,
      apiToken: apiToken
    };
  }

  // Need at least session token or api-token for authentication check
  if (!sessionToken && !apiToken) {
    return { isAuthenticated: false };
  }

  const cacheKey = `${sessionToken || 'no-session'}-${apiToken || 'no-api-token'}`;
  
  // Check cache first
  const cached = authCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { 
      isAuthenticated: cached.isValid, 
      userRole: cached.userRole,
      userId: cached.userId,
      apiToken: cached.apiToken
    };
  }

  try {
    // Decrypt and validate session cookie to get user info
    if (sessionToken) {
      const session = await decrypt(sessionToken);
      const isValid = Boolean(session !== null && session.userId);
      
      // Prioritize api-token cookie, fallback to apiToken from session
      const finalApiToken = apiToken || session?.apiToken || undefined;
      
      // Cache the result
      authCache.set(cacheKey, {
        isValid,
        userRole: session?.role,
        userId: session?.userId,
        apiToken: finalApiToken,
        timestamp: Date.now(),
      });

      return { 
        isAuthenticated: isValid, 
        userRole: session?.role,
        userId: session?.userId,
        apiToken: finalApiToken
      };
    }
    
    // If we only have api-token (already handled above, but keeping as fallback)
    if (apiToken) {
      return { 
        isAuthenticated: true, 
        apiToken: apiToken
      };
    }
    
    return { isAuthenticated: false };
  } catch (error) {
    logger.error("Auth check failed", error instanceof Error ? error : new Error(String(error)), { hasApiToken: !!apiToken });
    // If session decryption fails but we have api-token, still allow
    if (apiToken) {
      return { 
        isAuthenticated: true, 
        apiToken: apiToken
      };
    }
    return { isAuthenticated: false };
  }
}

// Define route patterns and their access requirements
const ROUTE_PATTERNS = {
  // Public routes - no authentication required
  public: [
    "/",
    "/about", 
    "/contact", 
    "/help",
    "/privacy",
    "/terms"
  ],
  
  // Authentication routes - redirect if already authenticated
  auth: [
    "/auth"
  ],
  
  // Protected routes - require authentication
  protected: [
    "/dashboard",
    "/profile"
  ],
  
  // Admin routes - require admin role
  admin: [
    "/admin"
  ],
  
  // API routes that require authentication (Bearer token or session cookie)
  protectedApi: [
    "/api/auth/me",
    "/api/auth/profile",
    "/api/auth/upload-avatar",
    "/api/auth/upload-portfolio",
    "/api/auth/logout",
    "/api/users/",
    "/api/marketplace/my-",
    "/api/academy/my-",
    "/api/rentals/my-",
    "/api/supplies/my-",
    "/api/ads/my-",
    "/api/finance/",
    "/api/communication/",
    "/api/analytics/",
    "/api/providers/profile/",
    "/api/providers/dashboard/"
  ],
  
  // API routes that require Bearer token authentication (no session cookie fallback)
  bearerTokenApi: [
    "/api/marketplace/bookings",
    "/api/academy/",
    "/api/rentals/",
    "/api/supplies/",
    "/api/ads/",
    "/api/finance/",
    "/api/analytics/",
    "/api/providers/",
    "/api/jobs/",
    "/api/maps/",
    "/api/settings/"
  ],
  
  // API routes that require admin role
  adminApi: [
    "/api/providers/admin/",
    "/api/analytics/",
    "/api/settings/"
  ]
};

// Helper function to check if path matches any pattern
function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('/')) {
      return pathname.startsWith(pattern);
    }
    return pathname === pattern || pathname.startsWith(pattern + '/');
  });
}

// Helper function to check if request has Bearer token
function hasBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader !== null && authHeader.startsWith("Bearer ");
}

// Helper function to check if user role has access to a specific route
function hasRouteAccess(userRole: string, pathname: string): boolean {
  // Admin routes - only admin role
  if (pathname.startsWith("/admin")) {
    return userRole === "admin";
  }

  // Service creation routes - service providers only
  if (pathname.includes("/create-service") || pathname.includes("/my-services")) {
    return ["provider", "agency_owner", "agency_admin", "admin"].includes(userRole);
  }

  // Job creation routes - service providers only
  if (pathname.includes("/create-job") || pathname.includes("/my-jobs")) {
    return ["provider", "agency_owner", "agency_admin", "admin"].includes(userRole);
  }

  // Supply creation routes - suppliers only
  if (pathname.includes("/create-supply") || pathname.includes("/my-supplies")) {
    return ["supplier", "admin"].includes(userRole);
  }

  // Course creation routes - instructors only
  if (pathname.includes("/create-course") || pathname.includes("/my-created-courses")) {
    return ["instructor", "admin"].includes(userRole);
  }

  // Rental creation routes - service providers only
  if (pathname.includes("/create-rental") || pathname.includes("/my-rentals")) {
    return ["provider", "agency_owner", "agency_admin", "admin"].includes(userRole);
  }

  // Analytics routes - business roles only
  if (pathname.includes("/analytics")) {
    return ["provider", "supplier", "instructor", "agency_owner", "agency_admin", "admin"].includes(userRole);
  }

  // Finance routes - business roles only
  if (pathname.includes("/finance")) {
    return ["provider", "supplier", "instructor", "agency_owner", "agency_admin", "admin"].includes(userRole);
  }

  // Agency management routes - agency roles only
  if (pathname.includes("/agency")) {
    return ["agency_owner", "agency_admin", "admin"].includes(userRole);
  }

  // Default: allow access
  return true;
}

// Helper function to check if path is a static file or Next.js internal route
function isStaticOrInternal(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/test") ||
    // Match files with common static file extensions
    /\.(css|js|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/i.test(pathname)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block service worker requests - return 404
  if (pathname === '/sw.js' || pathname.startsWith('/sw.js')) {
    return new NextResponse(null, { status: 404 });
  }

  // Skip middleware for static files and Next.js internal routes
  if (isStaticOrInternal(pathname)) {
    return NextResponse.next();
  }

  // Get authentication status
  const { isAuthenticated, userRole } = await checkAuth(request);

  // Handle API routes
  if (pathname.startsWith("/api/")) {
    // Public API routes - allow access (auth endpoints like send-code, verify-code)
    if (!matchesPattern(pathname, ROUTE_PATTERNS.protectedApi) && 
        !matchesPattern(pathname, ROUTE_PATTERNS.bearerTokenApi) &&
        !matchesPattern(pathname, ROUTE_PATTERNS.adminApi)) {
      return NextResponse.next();
    }

    // Bearer token API routes - require Bearer token authentication
    if (matchesPattern(pathname, ROUTE_PATTERNS.bearerTokenApi)) {
      if (!hasBearerToken(request)) {
        return NextResponse.json(
          { error: "Bearer token required" },
          { status: 401 }
        );
      }
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // Protected API routes - require authentication (Bearer token or session cookie)
    if (matchesPattern(pathname, ROUTE_PATTERNS.protectedApi)) {
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // Admin API routes - require admin role
    if (matchesPattern(pathname, ROUTE_PATTERNS.adminApi)) {
      if (!hasBearerToken(request)) {
        return NextResponse.json(
          { error: "Bearer token required" },
          { status: 401 }
        );
      }
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }
      if (userRole !== "admin") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  }

  // Handle page routes
  const isPublicRoute = matchesPattern(pathname, ROUTE_PATTERNS.public);
  const isAuthRoute = matchesPattern(pathname, ROUTE_PATTERNS.auth);
  const isProtectedRoute = matchesPattern(pathname, ROUTE_PATTERNS.protected);
  const isAdminRoute = matchesPattern(pathname, ROUTE_PATTERNS.admin);

  // Admin routes - allow through and let client-side layout handle auth/role checks
  // This ensures the page can load and the admin layout can check authentication
  if (isAdminRoute) {
    // If we have a role and it's not admin, redirect to dashboard
    if (userRole !== undefined && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Otherwise, allow access - client-side layout will handle authentication and role checks
    return NextResponse.next();
  }

  // If user is authenticated
  if (isAuthenticated) {
    // Redirect from auth routes to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Check role-based route access
    // Only check if we have a role defined
    if (userRole && !hasRouteAccess(userRole, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Allow access to protected routes
    if (isProtectedRoute) {
      return NextResponse.next();
    }
  }

  // If user is not authenticated
  if (isProtectedRoute) {
    // Store the intended destination for redirect after login
    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Allow access to public routes and auth routes
  if (isPublicRoute || isAuthRoute) {
    return NextResponse.next();
  }

  // Default: allow access (for any unmatched routes)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files including CSS)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml (metadata files)
     * - files with extensions (images, CSS, JS, etc.)
     * - public folder
     */
    "/((?!_next/static|_next/image|_next/css|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)|public).*)",
  ],
};
