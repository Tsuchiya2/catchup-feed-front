/**
 * CSRF Protection Utilities
 *
 * Implements Double Submit Cookie pattern for CSRF protection using cryptographically
 * secure token generation and constant-time comparison to prevent timing attacks.
 *
 * ## Overview
 *
 * This module provides server-side CSRF protection utilities for Next.js middleware.
 * It generates cryptographically secure tokens, sets them in both cookies and headers,
 * and validates them using the Double Submit Cookie pattern.
 *
 * ## Usage
 *
 * ### Setting CSRF Token (in Middleware)
 *
 * ```typescript
 * import { setCsrfToken } from '@/lib/security/csrf';
 * import { NextResponse } from 'next/server';
 *
 * export function middleware(request: NextRequest) {
 *   const response = NextResponse.next();
 *
 *   // Set CSRF token for authenticated users or login page
 *   if (isAuthenticated || isLoginPage) {
 *     setCsrfToken(response);
 *   }
 *
 *   return response;
 * }
 * ```
 *
 * ### Validating CSRF Token (in Middleware)
 *
 * ```typescript
 * import { validateCsrfToken } from '@/lib/security/csrf';
 * import { NextRequest, NextResponse } from 'next/server';
 *
 * export function middleware(request: NextRequest) {
 *   // Validate CSRF for state-changing requests
 *   if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
 *     if (!validateCsrfToken(request)) {
 *       return NextResponse.json(
 *         { error: 'CSRF validation failed' },
 *         { status: 403 }
 *       );
 *     }
 *   }
 *
 *   return NextResponse.next();
 * }
 * ```
 *
 * ## Security Features
 *
 * - **Cryptographic Randomness**: Uses Web Crypto API for secure token generation
 * - **Timing Attack Prevention**: Constant-time string comparison
 * - **Double Submit Cookie**: Validates cookie value against header value
 * - **SameSite Cookies**: Strict mode prevents cross-site sending
 * - **HttpOnly Cookies**: Prevents JavaScript access to cookie value
 * - **Secure Cookies**: HTTPS-only in production
 *
 * ## Token Format
 *
 * - **Length**: 43 characters (base64url encoding of 32 bytes)
 * - **Encoding**: URL-safe base64 (no padding, uses - and _ instead of + and /)
 * - **Entropy**: 256 bits (32 bytes of random data)
 *
 * @module csrf
 * @see docs/api/csrf-protection.md - Complete API documentation
 * @see docs/designs/csrf-protection.md - Design document
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Generate a cryptographically secure CSRF token
 *
 * Uses Web Crypto API to generate 32 bytes of random data, then encodes it
 * as base64url (URL-safe base64 without padding) for use in cookies and headers.
 *
 * @returns {string} A 43-character base64url-encoded random token
 *
 * @example
 * const token = generateCsrfToken();
 * // Returns: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v"
 */
export function generateCsrfToken(): string {
  // Generate 32 bytes of cryptographically random data
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);

  // Convert to base64url (URL-safe, no padding)
  return base64UrlEncode(buffer);
}

/**
 * Set CSRF token in both cookie and response header
 *
 * Implements the Double Submit Cookie pattern by:
 * 1. Setting an HttpOnly cookie (secure, SameSite=Strict)
 * 2. Setting a response header for client-side reading
 *
 * @param {NextResponse} response - Next.js response object to modify
 * @returns {NextResponse} Modified response with CSRF token set
 *
 * @example
 * const response = NextResponse.next();
 * setCsrfToken(response);
 * // Response now has csrf_token cookie and X-CSRF-Token header
 */
export function setCsrfToken(response: NextResponse): NextResponse {
  const token = generateCsrfToken();

  // Set as HttpOnly cookie (cannot be read by JavaScript)
  response.cookies.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Set as response header (for client to read and send back in requests)
  response.headers.set('X-CSRF-Token', token);

  return response;
}

/**
 * Validate CSRF token using Double Submit Cookie pattern
 *
 * Compares the token from the HttpOnly cookie with the token from the custom
 * header. Both must exist and match exactly (using constant-time comparison).
 *
 * @param {NextRequest} request - Next.js request object containing cookies and headers
 * @returns {boolean} True if tokens exist and match, false otherwise
 *
 * @example
 * export function middleware(request: NextRequest) {
 *   if (request.method === 'POST') {
 *     if (!validateCsrfToken(request)) {
 *       return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
 *     }
 *   }
 * }
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Get token from cookie (set by server)
  const cookieToken = request.cookies.get('csrf_token')?.value;

  // Get token from custom header (set by client)
  const headerToken = request.headers.get('X-CSRF-Token');

  // Both tokens must exist
  if (!cookieToken || !headerToken) {
    logger.warn('CSRF validation failed: missing token', {
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
      path: request.nextUrl.pathname,
      method: request.method,
      reason:
        !cookieToken && !headerToken
          ? 'both_missing'
          : !cookieToken
            ? 'cookie_missing'
            : 'header_missing',
    });
    return false;
  }

  // Tokens must match (constant-time comparison to prevent timing attacks)
  const isValid = timingSafeEqual(cookieToken, headerToken);

  if (!isValid) {
    logger.warn('CSRF validation failed: token mismatch', {
      path: request.nextUrl.pathname,
      method: request.method,
      reason: 'token_mismatch',
    });
  } else {
    // Debug logging for successful validation
    logger.debug('CSRF validation succeeded', {
      path: request.nextUrl.pathname,
      method: request.method,
    });
  }

  return isValid;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 *
 * Uses constant-time comparison by XORing each character and accumulating
 * the result. This prevents attackers from using timing information to
 * deduce the token value character by character.
 *
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {boolean} True if strings are equal, false otherwise
 *
 * @example
 * timingSafeEqual('secret123', 'secret123'); // true
 * timingSafeEqual('secret123', 'secret456'); // false
 * timingSafeEqual('short', 'verylongstring'); // false (different lengths)
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Different lengths always fail (this is safe to short-circuit)
  if (a.length !== b.length) {
    return false;
  }

  // Constant-time comparison: XOR each character and accumulate result
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  // Result is 0 if and only if all characters matched
  return result === 0;
}

/**
 * Base64URL encoding (URL-safe base64 without padding)
 *
 * Converts a Uint8Array to base64url format by:
 * 1. Converting to standard base64
 * 2. Replacing + with - (URL-safe)
 * 3. Replacing / with _ (URL-safe)
 * 4. Removing = padding
 *
 * @param {Uint8Array} buffer - Binary data to encode
 * @returns {string} Base64url-encoded string (43 characters for 32-byte input)
 *
 * @example
 * const buffer = new Uint8Array([1, 2, 3, 4, 5]);
 * base64UrlEncode(buffer); // Returns: "AQIDBAU"
 */
export function base64UrlEncode(buffer: Uint8Array): string {
  // Convert Uint8Array to base64 string
  const base64 = btoa(String.fromCharCode(...buffer));

  // Make URL-safe and remove padding
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
