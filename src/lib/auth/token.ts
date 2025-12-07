/**
 * Token Storage Utilities
 *
 * Provides secure JWT token storage and retrieval using localStorage.
 * Includes token expiration checking and error handling.
 */

/**
 * localStorage key for storing the auth token
 */
const AUTH_TOKEN_KEY = 'catchup_feed_auth_token';

/**
 * Retrieve the authentication token from localStorage
 *
 * @returns The JWT token string, or null if not found or error occurred
 */
export function getAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') {
      // Server-side rendering - no localStorage available
      return null;
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Failed to retrieve auth token from localStorage:', error);
    return null;
  }
}

/**
 * Store the authentication token in localStorage
 *
 * @param token - The JWT token string to store
 */
export function setAuthToken(token: string): void {
  try {
    if (typeof window === 'undefined') {
      // Server-side rendering - no localStorage available
      console.warn('Cannot set auth token on server-side');
      return;
    }

    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store auth token in localStorage:', error);
    throw new Error('Failed to store authentication token');
  }
}

/**
 * Remove the authentication token from localStorage
 */
export function clearAuthToken(): void {
  try {
    if (typeof window === 'undefined') {
      // Server-side rendering - no localStorage available
      return;
    }

    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear auth token from localStorage:', error);
  }
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
 * @param token - The JWT token string to check
 * @returns True if the token is expired, false otherwise
 *
 * @remarks
 * This function decodes the JWT payload and checks the 'exp' claim.
 * Returns true (expired) if the token is invalid or cannot be decoded.
 */
export function isTokenExpired(token: string): boolean {
  try {
    if (!token || token.trim() === '') {
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

  return !isTokenExpired(token);
}
