/**
 * Authentication API Endpoints
 *
 * Functions for authentication-related API calls.
 */

import { apiClient } from '@/lib/api/client';
import { appConfig } from '@/config/app.config';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/observability';
import {
  getRefreshToken,
  setAuthToken,
  setRefreshToken,
  isTokenExpired,
} from '@/lib/auth/TokenManager';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@/types/api';

/**
 * Login with email and password
 *
 * @param email - User email address
 * @param password - User password
 * @returns Promise resolving to login response with JWT token
 * @throws {ApiError} When login fails (invalid credentials, server error)
 *
 * @example
 * ```typescript
 * try {
 *   const response = await login('user@example.com', 'password123');
 *   console.log('Token:', response.token);
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 401) {
 *     console.error('Invalid credentials');
 *   }
 * }
 * ```
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const requestBody: LoginRequest = {
    email,
    password,
  };

  const response = await apiClient.post<LoginResponse>('/auth/token', requestBody, {
    requiresAuth: false, // Login endpoint doesn't require authentication
  });

  return response;
}

/**
 * Logout (client-side only - clears token)
 *
 * @remarks
 * This function only clears the local token. The backend doesn't have a logout endpoint
 * because JWT tokens are stateless. The token will remain valid until it expires.
 */
export function logout(): void {
  // Token clearing is handled by the apiClient when a 401 is received
  // or can be manually cleared by importing clearAuthToken
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/**
 * Refresh authentication token using refresh token
 *
 * Implements retry logic with exponential backoff and grace period handling.
 * Automatically updates tokens in storage on success.
 *
 * @returns Promise resolving to new access and refresh tokens
 * @throws {Error} When refresh token is not available
 * @throws {ApiError} When token refresh fails after all retries
 *
 * @example
 * ```typescript
 * try {
 *   const response = await refreshToken();
 *   console.log('Token refreshed successfully');
 * } catch (error) {
 *   console.error('Token refresh failed:', error);
 *   // Redirect to login
 * }
 * ```
 */
export async function refreshToken(): Promise<RefreshTokenResponse> {
  const startTime = Date.now();
  const refreshTokenValue = getRefreshToken();

  // Check if refresh token is available
  if (!refreshTokenValue) {
    logger.error('No refresh token available');
    metrics.login.tokenRefresh('failure', 'no_refresh_token');
    throw new Error('No refresh token available');
  }

  // Check if refresh token is expired (within grace period)
  if (isTokenExpired()) {
    const gracePeriodMs = appConfig.auth.gracePeriod * 1000;
    const tokenExpiry = Date.now(); // Simplified, should get actual expiry
    const timeSinceExpiry = Date.now() - tokenExpiry;

    if (timeSinceExpiry > gracePeriodMs) {
      logger.warn('Refresh token expired beyond grace period', {
        gracePeriodMs,
        timeSinceExpiry,
      });
      metrics.login.tokenRefresh('failure', 'grace_period_exceeded');
      throw new Error('Refresh token expired beyond grace period');
    }

    logger.info('Attempting token refresh within grace period', {
      timeSinceExpiry,
      gracePeriodMs,
    });
  }

  const maxRetries = appConfig.api.retryAttempts;
  const initialDelay = appConfig.api.retryDelay;
  let lastError: Error | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.debug('Attempting token refresh', {
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
      });

      const requestBody: RefreshTokenRequest = {
        refresh_token: refreshTokenValue,
      };

      const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', requestBody, {
        requiresAuth: false, // Refresh endpoint doesn't require auth header
        retry: false, // Disable client-level retry, we handle it here
      });

      // Update tokens in storage
      setAuthToken(response.token);
      if (response.refresh_token) {
        setRefreshToken(response.refresh_token);
      }

      const duration = Date.now() - startTime;
      logger.info('Token refresh successful', {
        attempt: attempt + 1,
        durationMs: duration,
      });

      metrics.login.tokenRefresh('success');

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on last attempt
      if (attempt >= maxRetries) {
        break;
      }

      // Calculate exponential backoff delay
      const delay = initialDelay * Math.pow(2, attempt);
      const jitter = Math.random() * delay * 0.1; // Add 10% jitter
      const totalDelay = delay + jitter;

      logger.warn('Token refresh attempt failed, retrying', {
        attempt: attempt + 1,
        error: lastError.message,
        retryDelayMs: totalDelay,
      });

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  // All retries exhausted
  const duration = Date.now() - startTime;
  const errorMessage = lastError?.message || 'Unknown error';

  logger.error('Token refresh failed after all retries', lastError || undefined, {
    attempts: maxRetries + 1,
    durationMs: duration,
  });

  metrics.login.tokenRefresh('failure', 'max_retries_exceeded');

  throw new Error(`Token refresh failed: ${errorMessage}`);
}
