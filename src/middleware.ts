import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

// Cache for custom auth checks to avoid repeated API calls
const authCache = new Map<string, { isValid: boolean; timestamp: number }>();
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

// Helper function to check custom authentication
async function checkCustomAuth(request: NextRequest): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") || "";
  const sessionCookie = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1];

  if (!sessionCookie) {
    return false;
  }

  const cacheKey = sessionCookie;
  
  // Check cache first
  const cached = authCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.isValid;
  }

  try {
    // Decrypt and validate session
    const session = await decrypt(sessionCookie);
    const isValid = Boolean(session !== null && session.userId);
    
    // Cache the result
    authCache.set(cacheKey, {
      isValid,
      timestamp: Date.now(),
    });

    return isValid;
  } catch (error) {
    console.error("Custom auth check failed:", error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/public/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Define route patterns
  const protectedRoutes = ["/dashboard", "/profile", "/admin"];
  const authRoutes = ["/auth/signin", "/auth/signup"];
  const publicRoutes = ["/", "/about", "/contact", "/help"];

  // Check if the current path matches any route pattern
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  const isPublicRoute = publicRoutes.includes(pathname);

  // Check custom authentication
  const hasCustomAuth = await checkCustomAuth(request);

  // If user is authenticated
  if (hasCustomAuth) {
    // Redirect from auth routes to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Allow access to protected routes
    return NextResponse.next();
  }

  // If user is not authenticated
  if (isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Handle root path and other public routes
  if (pathname === "/" || isPublicRoute) {
    // Allow access to public routes
    return NextResponse.next();
  }

  // Default: allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - files with extensions (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public|.*\\..*).*)",
  ],
};
