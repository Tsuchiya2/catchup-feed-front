/**
 * CSRF Token Manager
 *
 * Client-side CSRF token management for Double Submit Cookie pattern.
 * Extracts tokens from response headers and injects them into request headers.
 *
 * ## Features
 *
 * - **Singleton Pattern**: Consistent token state across the application
 * - **SessionStorage**: Token persistence across page reloads (not tabs)
 * - **SSR-Safe**: Checks for window availability before browser APIs
 * - **Zero Dependencies**: Uses only built-in browser APIs
 *
 * ## Usage
 *
 * ### Basic Usage with Utility Functions
 *
 * ```typescript
 * import {
 *   getCsrfToken,
 *   setCsrfTokenFromResponse,
 *   clearCsrfToken,
 *   addCsrfTokenToHeaders
 * } from '@/lib/security/CsrfTokenManager';
 *
 * // 1. Extract token from login response
 * const loginResponse = await fetch('/api/auth/login', {
 *   method: 'POST',
 *   body: JSON.stringify(credentials),
 * });
 * setCsrfTokenFromResponse(loginResponse);
 *
 * // 2. Include token in subsequent requests
 * const headers = {
 *   'Content-Type': 'application/json',
 *   'X-CSRF-Token': getCsrfToken() || '',
 * };
 *
 * await fetch('/api/posts', {
 *   method: 'POST',
 *   headers,
 *   body: JSON.stringify(data),
 * });
 *
 * // 3. Clear token on logout
 * clearCsrfToken();
 * ```
 *
 * ### Advanced Usage with Class Instance
 *
 * ```typescript
 * import { getCsrfTokenManager } from '@/lib/security/CsrfTokenManager';
 *
 * const csrfManager = getCsrfTokenManager();
 *
 * // Extract token from response
 * csrfManager.extractToken(response);
 *
 * // Get current token
 * const token = csrfManager.getToken();
 *
 * // Add to headers object
 * const headers = csrfManager.addTokenToHeaders({
 *   'Content-Type': 'application/json',
 * });
 *
 * // Clear token
 * csrfManager.clearToken();
 * ```
 *
 * ### Integration with API Client
 *
 * The API client automatically handles CSRF tokens:
 *
 * ```typescript
 * import { apiClient } from '@/lib/api/client';
 *
 * // Token automatically extracted from responses
 * // Token automatically included in POST/PUT/PATCH/DELETE requests
 * const response = await apiClient.post('/posts', data);
 * ```
 *
 * ## Token Lifecycle
 *
 * 1. **Server Response**: Server sends token in `X-CSRF-Token` header
 * 2. **Extraction**: Client extracts token using `extractToken()`
 * 3. **Storage**: Token stored in sessionStorage
 * 4. **Usage**: Token included in state-changing requests
 * 5. **Validation**: Server validates cookie vs header
 * 6. **Renewal**: New token may be sent in response
 * 7. **Cleanup**: Token cleared on logout
 *
 * ## Security Considerations
 *
 * - **SessionStorage**: Tokens are session-scoped, cleared when tab closes
 * - **No Logging**: Token values are never logged, only presence/absence
 * - **SSR Safety**: No errors when running on server (Next.js SSR)
 * - **Singleton**: Prevents token state inconsistencies
 *
 * @module lib/security/CsrfTokenManager
 * @see docs/api/csrf-protection.md - Complete API documentation
 */

import { logger } from '@/lib/logger';

/**
 * CsrfTokenManager class for client-side CSRF token management
 *
 * Singleton pattern ensures consistent token state across the application.
 * Stores tokens in sessionStorage for persistence across page reloads.
 */
export class CsrfTokenManager {
  private static instance: CsrfTokenManager | null = null;
  private token: string | null = null;
  private readonly TOKEN_STORAGE_KEY = 'catchup_feed_csrf_token';
  private readonly TOKEN_HEADER_NAME = 'X-CSRF-Token';

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Load token from sessionStorage on initialization
    if (typeof window !== 'undefined') {
      try {
        this.token = sessionStorage.getItem(this.TOKEN_STORAGE_KEY);
        if (this.token) {
          logger.debug('CSRF token loaded from sessionStorage');
        }
      } catch (error) {
        logger.warn('Failed to load CSRF token from sessionStorage', { error });
      }
    }
  }

  /**
   * Get singleton instance of CsrfTokenManager
   */
  public static getInstance(): CsrfTokenManager {
    if (!CsrfTokenManager.instance) {
      CsrfTokenManager.instance = new CsrfTokenManager();
    }
    return CsrfTokenManager.instance;
  }

  /**
   * Extract and store CSRF token from response header
   *
   * @param response - HTTP Response object
   */
  public extractToken(response: Response): void {
    try {
      const token = response.headers.get(this.TOKEN_HEADER_NAME);
      if (token) {
        this.token = token;

        // Store in sessionStorage if available
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(this.TOKEN_STORAGE_KEY, token);
          logger.debug('CSRF token extracted and stored', {
            hasToken: true,
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to extract CSRF token from response', { error });
    }
  }

  /**
   * Get current CSRF token
   *
   * @returns Current CSRF token or null if not available
   */
  public getToken(): string | null {
    return this.token;
  }

  /**
   * Clear CSRF token (on logout)
   */
  public clearToken(): void {
    try {
      this.token = null;

      // Remove from sessionStorage if available
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(this.TOKEN_STORAGE_KEY);
        logger.debug('CSRF token cleared');
      }
    } catch (error) {
      logger.warn('Failed to clear CSRF token', { error });
    }
  }

  /**
   * Add CSRF token to request headers
   *
   * @param headers - Request headers object
   * @returns Headers object with CSRF token added
   */
  public addTokenToHeaders(headers: Record<string, string>): Record<string, string> {
    if (this.token) {
      return {
        ...headers,
        [this.TOKEN_HEADER_NAME]: this.token,
      };
    }
    return headers;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get singleton CsrfTokenManager instance
 *
 * @returns CsrfTokenManager instance
 */
export function getCsrfTokenManager(): CsrfTokenManager {
  return CsrfTokenManager.getInstance();
}

/**
 * Get current CSRF token
 *
 * @returns Current CSRF token or null
 */
export function getCsrfToken(): string | null {
  return getCsrfTokenManager().getToken();
}

/**
 * Extract and store CSRF token from response
 *
 * @param response - HTTP Response object
 */
export function setCsrfTokenFromResponse(response: Response): void {
  getCsrfTokenManager().extractToken(response);
}

/**
 * Clear stored CSRF token
 */
export function clearCsrfToken(): void {
  getCsrfTokenManager().clearToken();
}

/**
 * Add CSRF token to request headers
 *
 * @param headers - Request headers object
 * @returns Headers object with CSRF token added
 */
export function addCsrfTokenToHeaders(headers: Record<string, string>): Record<string, string> {
  return getCsrfTokenManager().addTokenToHeaders(headers);
}
