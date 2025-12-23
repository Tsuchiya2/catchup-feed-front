/**
 * Next.js Middleware for Protected Routes
 *
 * This middleware protects routes that require authentication and CSRF attacks.
 * It checks for a valid JWT token and redirects unauthenticated users to the login page.
 * It also validates CSRF tokens for state-changing requests (POST, PUT, PATCH, DELETE).
 *
 * NOTE: Next.js middleware runs on the Edge runtime, which doesn't have access to localStorage.
 * This middleware validates token expiration and handles route protection.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';
import { validateCsrfToken, setCsrfToken } from '@/lib/security/csrf';

/**
 * HTTP methods that change state and require CSRF protection
 */
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Routes exempt from CSRF validation (webhooks, health checks, etc.)
 */
const CSRF_EXEMPT_ROUTES = ['/api/health', '/api/webhooks'];

/**
 * Protected route patterns
 * These routes require authentication
 */
const PROTECTED_ROUTES = ['/dashboard', '/articles', '/sources'];

/**
 * Public route patterns
 * These routes are accessible without authentication
 */
const PUBLIC_ROUTES = ['/', '/login'];

/**
 * Check if a path matches any of the protected routes
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path matches any of the public routes
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route);
}

/**
 * Check if a route is exempt from CSRF validation
 */
function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Validate JWT token by checking its expiration
 * Returns true if token is valid (not expired), false otherwise
 *
 * NOTE: This only checks expiration, not signature verification.
 * Full signature verification requires the secret key, which is on the backend.
 * The backend will perform full validation when the token is used for API calls.
 *
 * @param token - JWT token string
 * @returns true if token is valid and not expired
 */
function isTokenValid(token: string): boolean {
  try {
    const payload = decodeJwt(token);

    // Check if token has an expiration claim
    if (!payload.exp) {
      // No expiration claim - consider valid (backend will verify)
      return true;
    }

    // Check if token has expired
    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();

    // Add a 30-second buffer to account for clock skew
    const bufferMs = 30 * 1000;

    return currentTime < expirationTime + bufferMs;
  } catch {
    // Invalid token format
    return false;
  }
}

/**
 * Middleware function
 *
 * @param request - Next.js request object
 * @returns Next.js response (redirect or continue)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Phase 1: CSRF Validation for state-changing requests
  // This runs BEFORE authentication checks
  if (STATE_CHANGING_METHODS.includes(method) && !isCsrfExempt(pathname)) {
    const isValidCsrf = validateCsrfToken(request);
    if (!isValidCsrf) {
      return NextResponse.json(
        {
          error: 'CSRF token validation failed',
          message:
            'Your request could not be verified. Please refresh the page and try again.',
        },
        { status: 403 }
      );
    }
  }

  // Phase 2: Authentication check
  // Check for auth token in cookies (set by client-side after login)
  const token = request.cookies.get('catchup_feed_auth_token')?.value;
  const hasValidToken = token ? isTokenValid(token) : false;

  // Protected routes: redirect to /login if no valid token
  if (isProtectedRoute(pathname) && !hasValidToken) {
    const loginUrl = new URL('/login', request.url);
    // Add redirect parameter to return to original destination after login
    loginUrl.searchParams.set('redirect', pathname);

    // Clear expired token from cookies
    const response = NextResponse.redirect(loginUrl);
    if (token && !hasValidToken) {
      response.cookies.delete('catchup_feed_auth_token');
    }
    return response;
  }

  // Login page: redirect to /dashboard if already authenticated with valid token
  if (pathname === '/login' && hasValidToken) {
    // Check if there's a redirect parameter
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const dashboardUrl = new URL(redirectParam || '/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Phase 3: Set CSRF token for authenticated users and login page
  const response = NextResponse.next();

  // Set CSRF token for authenticated users or login page visitors
  if (hasValidToken || pathname === '/login') {
    setCsrfToken(response);
  }

  return response;
}

/**
 * Matcher configuration
 * Specifies which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
