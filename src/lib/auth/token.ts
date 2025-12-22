/**
 * Token Storage Utilities
 *
 * DEPRECATED: This module is deprecated in favor of TokenManager.
 * These functions are now wrappers around TokenManager for backward compatibility.
 * New code should import from '@/lib/auth/TokenManager' instead.
 *
 * Provides secure JWT token storage and retrieval using TokenManager.
 * Includes token expiration checking and error handling.
 */

import {
  getAuthToken as getAuthTokenFromManager,
  setAuthToken as setAuthTokenToManager,
  clearAuthToken as clearAuthTokenFromManager,
  isTokenExpired as isTokenExpiredFromManager,
} from '@/lib/auth/TokenManager';

/**
 * Retrieve the authentication token from TokenManager
 *
 * @deprecated Use getAuthToken from '@/lib/auth/TokenManager' instead
 * @returns The JWT token string, or null if not found or error occurred
 */
export function getAuthToken(): string | null {
  return getAuthTokenFromManager();
}

/**
 * Store the authentication token in TokenManager
 *
 * @deprecated Use setAuthToken from '@/lib/auth/TokenManager' instead
 * @param token - The JWT token string to store
 */
export function setAuthToken(token: string): void {
  setAuthTokenToManager(token);
}

/**
 * Remove the authentication token from TokenManager
 *
 * @deprecated Use clearAuthToken from '@/lib/auth/TokenManager' instead
 */
export function clearAuthToken(): void {
  clearAuthTokenFromManager();
}

/**
 * Decode JWT payload without verification
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64url payload
    const payload = parts[1];
    if (!payload) {
      return null;
    }
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT payload:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 *
 * @deprecated Use isTokenExpired from '@/lib/auth/TokenManager' instead
 * @param token - The JWT token string to check
 * @returns True if the token is expired, false otherwise
 *
 * @remarks
 * This function decodes the JWT payload and checks the 'exp' claim.
 * Returns true (expired) if the token is invalid or cannot be decoded.
 */
export function isTokenExpired(token?: string): boolean {
  // If token is provided, decode and check expiry
  if (token) {
    try {
      if (token.trim() === '') {
        return true;
      }

      const payload = decodeJWTPayload(token);
      if (!payload || !payload.exp) {
        // Invalid token or no expiration claim
        return true;
      }

      const exp = payload.exp as number;
      const now = Math.floor(Date.now() / 1000);

      // Token is expired if current time >= expiration time
      return now >= exp;
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      // Consider invalid tokens as expired
      return true;
    }
  }

  // If no token provided, use TokenManager
  return isTokenExpiredFromManager();
}

/**
 * Check if the user is authenticated with a valid token
 *
 * @returns True if a valid, non-expired token exists
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  return !isTokenExpiredFromManager();
}
