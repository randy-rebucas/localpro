import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

// Cache for authentication checks to improve performance
const authCache = new Map<string, { 
  isValid: boolean; 
  userRole?: string; 
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
  userId?: string 
}> {
  // First, try to get Bearer token from Authorization header
  const authHeader = request.headers.get("authorization");
  let sessionToken: string | null = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    sessionToken = authHeader.substring(7);
  } else {
    // Fallback to session cookie
    const cookieHeader = request.headers.get("cookie") || "";
    sessionToken = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('session='))
      ?.split('=')[1] || null;
  }

  if (!sessionToken) {
    return { isAuthenticated: false };
  }

  const cacheKey = sessionToken;
  
  // Check cache first
  const cached = authCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { 
      isAuthenticated: cached.isValid, 
      userRole: cached.userRole 
    };
  }

  try {
    // Decrypt and validate session
    const session = await decrypt(sessionToken);
    const isValid = Boolean(session !== null && session.userId);
    
    // Cache the result
    authCache.set(cacheKey, {
      isValid,
      userRole: session?.role,
      timestamp: Date.now(),
    });

    return { 
      isAuthenticated: isValid, 
      userRole: session?.role,
      userId: session?.userId
    };
  } catch (error) {
    console.error("Auth check failed:", error);
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

// Helper function to check if path is a static file or Next.js internal route
function isStaticOrInternal(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/test") ||
    pathname.includes(".") // Files with extensions
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // If user is authenticated
  if (isAuthenticated) {
    // Redirect from auth routes to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Check admin access
    if (isAdminRoute && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Allow access to protected and admin routes
    if (isProtectedRoute || isAdminRoute) {
      return NextResponse.next();
    }
  }

  // If user is not authenticated
  if (isProtectedRoute || isAdminRoute) {
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml (metadata files)
     * - files with extensions (images, etc.)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*|public).*)",
  ],
};
