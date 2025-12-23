/**
 * API Client
 *
 * Type-safe HTTP client for the Catchup Feed backend API.
 * Automatically injects JWT tokens and handles authentication errors.
 * Supports automatic token refresh before requests.
 */

import {
  getAuthToken,
  clearAllTokens,
  isTokenExpiringSoon,
  getRefreshToken,
} from '@/lib/auth/TokenManager';
import { ApiError, NetworkError, TimeoutError } from '@/lib/api/errors';
import { addTracingHeaders, startSpan } from '@/lib/observability';
import { metrics } from '@/lib/observability';
import { appConfig } from '@/config/app.config';
import { logger } from '@/lib/logger';
import {
  addCsrfTokenToHeaders,
  setCsrfTokenFromResponse,
  clearCsrfToken,
} from '@/lib/security/CsrfTokenManager';

/**
 * Retry configuration for API requests
 */
interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds before first retry (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds between retries (default: 10000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
}

/**
 * API request options
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  timeout?: number;
  /** Retry configuration (set to false to disable retries) */
  retry?: RetryConfig | false;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * API Client class for making type-safe HTTP requests
 */
class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number = 30000; // 30 seconds
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  }

  /**
   * Ensure token is valid before making a request
   * Automatically refreshes token if expiring soon
   *
   * @param requiresAuth - Whether the request requires authentication
   */
  private async ensureValidToken(requiresAuth: boolean): Promise<void> {
    // Skip if authentication is not required
    if (!requiresAuth) {
      return;
    }

    // Skip if token refresh feature is disabled
    if (!appConfig.features.tokenRefresh) {
      return;
    }

    // Check if token exists and is expiring soon
    const token = getAuthToken();
    if (!token) {
      // No token, cannot refresh
      return;
    }

    if (!isTokenExpiringSoon()) {
      // Token is still valid
      return;
    }

    // Check if refresh token exists
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      logger.warn('Token is expiring but no refresh token available');
      return;
    }

    // Prevent concurrent refresh requests
    if (this.refreshPromise) {
      logger.debug('Token refresh already in progress, waiting...');
      await this.refreshPromise;
      return;
    }

    // Start token refresh
    logger.info('Token is expiring soon, refreshing...');

    this.refreshPromise = this.performTokenRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform token refresh
   * This is separated to avoid circular dependency with auth endpoints
   */
  private async performTokenRefresh(): Promise<void> {
    try {
      // Dynamic import to avoid circular dependency
      const { refreshToken } = await import('@/lib/api/endpoints/auth');
      await refreshToken();
      logger.info('Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed', error as Error);
      // Clear tokens on refresh failure
      clearAllTokens();
      // Don't throw error here, let the request proceed and fail with 401
      // which will trigger the redirect to login
    }
  }

  /**
   * Check if an error is retryable
   * Retries on network errors, timeouts, and 5xx server errors
   * CSRF errors are NOT retryable (requires page reload)
   */
  private isRetryableError(error: unknown): boolean {
    // CSRF errors should not be retried
    if (this.isCsrfError(error)) {
      return false;
    }

    if (error instanceof NetworkError || error instanceof TimeoutError) {
      return true;
    }
    if (error instanceof ApiError && error.status >= 500) {
      return true;
    }
    return false;
  }

  /**
   * Calculate delay for retry with exponential backoff
   */
  private calculateRetryDelay(attempt: number, config: Required<RetryConfig>): number {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    // Add jitter (±10%) to prevent thundering herd
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.min(delay + jitter, config.maxDelay);
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is a CSRF validation failure
   * CSRF errors are 403 responses with a specific error message
   */
  private isCsrfError(error: unknown): boolean {
    if (!(error instanceof ApiError)) {
      return false;
    }

    // Check for 403 status
    if (error.status !== 403) {
      return false;
    }

    // Check error message for CSRF-specific keywords
    const message = error.message.toLowerCase();
    return (
      message.includes('csrf') ||
      message.includes('token validation failed') ||
      message.includes('invalid csrf token')
    );
  }

  /**
   * Handle CSRF validation failure
   * Clears invalid token and optionally reloads the page
   */
  private handleCsrfError(endpoint: string): void {
    logger.warn('CSRF validation failed', {
      endpoint,
      action: 'clearing_token',
    });

    // Clear the invalid CSRF token
    clearCsrfToken();

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Show user-friendly notification (if toast is available)
    // Note: This is optional and depends on having a notification system
    try {
      // Dynamic import to avoid hard dependency on notification system
      if (typeof window !== 'undefined' && 'sessionStorage' in window) {
        // Store error flag for UI to display after reload
        sessionStorage.setItem('csrf_error_occurred', 'true');
      }
    } catch (error) {
      logger.debug('Could not set CSRF error flag', { error });
    }

    // Reload page to get fresh CSRF token
    // Only reload once to prevent infinite loops
    const reloadKey = 'csrf_reload_attempted';
    const reloadAttempted = sessionStorage.getItem(reloadKey);

    if (!reloadAttempted) {
      sessionStorage.setItem(reloadKey, Date.now().toString());
      logger.info('Reloading page to obtain fresh CSRF token');

      // Use a slight delay to ensure logging completes
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Check if reload was attempted recently (within last 5 seconds)
      const reloadTime = parseInt(reloadAttempted, 10);
      const timeSinceReload = Date.now() - reloadTime;

      if (timeSinceReload < 5000) {
        // Reload was recent, don't reload again (prevent infinite loop)
        logger.error('CSRF error persists after reload', undefined, {
          timeSinceReload,
          endpoint,
        });
        sessionStorage.removeItem(reloadKey);
      } else {
        // Reload attempt was old, safe to try again
        sessionStorage.setItem(reloadKey, Date.now().toString());
        logger.info('Retrying page reload for fresh CSRF token');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  }

  /**
   * Make an HTTP request to the API
   *
   * @param endpoint - API endpoint path (e.g., '/auth/token')
   * @param options - Request options
   * @returns Promise resolving to the response data
   * @throws {ApiError} When the API returns an error response
   * @throws {NetworkError} When the network request fails
   * @throws {TimeoutError} When the request times out
   */
  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      requiresAuth = true,
      timeout = this.defaultTimeout,
      retry = {},
    } = options;

    // Determine retry configuration
    const retryConfig: Required<RetryConfig> | null =
      retry === false ? null : { ...DEFAULT_RETRY_CONFIG, ...retry };
    const maxAttempts = retryConfig ? retryConfig.maxRetries + 1 : 1;

    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.executeRequest<T>(endpoint, {
          method,
          body,
          headers,
          requiresAuth,
          timeout,
        });
      } catch (error) {
        lastError = error;

        // Don't retry if retries are disabled or this is the last attempt
        if (!retryConfig || attempt >= retryConfig.maxRetries) {
          throw error;
        }

        // Don't retry non-retryable errors
        if (!this.isRetryableError(error)) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        const delay = this.calculateRetryDelay(attempt, retryConfig);
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError;
  }

  /**
   * Execute a single HTTP request (without retry logic)
   */
  private async executeRequest<T>(
    endpoint: string,
    options: Omit<RequestOptions, 'retry'>
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      requiresAuth = true,
      timeout = this.defaultTimeout,
    } = options;

    // Ensure token is valid before making request
    await this.ensureValidToken(requiresAuth);

    // Construct full URL
    const url = `${this.baseUrl}${endpoint}`;

    // Prepare headers
    let requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add tracing headers for distributed tracing
    requestHeaders = addTracingHeaders(requestHeaders);

    // Add Authorization header if authentication is required
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Add CSRF token to headers for state-changing requests
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      requestHeaders = addCsrfTokenToHeaders(requestHeaders);
    }

    // Prepare request init
    const init: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      init.body = JSON.stringify(body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Track request start time for latency metrics
    const startTime = Date.now();

    try {
      // Wrap fetch in a span for distributed tracing
      const response = await startSpan(
        `API Request: ${method} ${endpoint}`,
        'http.client',
        async () => {
          return await fetch(url, {
            ...init,
            signal: controller.signal,
          });
        }
      );

      // Calculate request latency
      const latency = Date.now() - startTime;

      // Track API latency metric
      metrics.performance.apiLatency(endpoint, latency, response.status);

      // Clear timeout
      clearTimeout(timeoutId);

      // Extract and store CSRF token from response (if present)
      setCsrfTokenFromResponse(response);

      // Handle authentication errors
      if (response.status === 401) {
        clearAllTokens();

        // Redirect to login page on client-side
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        throw new ApiError('Authentication required', 401);
      }

      // Handle error responses
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        const apiError = new ApiError(
          errorData.message || `Request failed with status ${response.status}`,
          response.status,
          errorData.details
        );

        // Handle CSRF validation failures
        if (this.isCsrfError(apiError)) {
          this.handleCsrfError(endpoint);
        }

        throw apiError;
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return undefined as T;
      }

      // Handle empty response body (e.g., 201 Created with no body)
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0') {
        return undefined as T;
      }

      // Parse successful response
      const text = await response.text();
      if (!text) {
        return undefined as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        return undefined as T;
      }
    } catch (error) {
      // Clear timeout
      clearTimeout(timeoutId);

      // Track error metrics
      if (error instanceof ApiError) {
        metrics.error.api(endpoint, error.status);
      } else if (error instanceof NetworkError || error instanceof TypeError) {
        metrics.error.network();
      }

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request to ${endpoint} timed out after ${timeout}ms`);
      }

      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new NetworkError(`Failed to connect to ${url}`);
      }

      // Unknown error
      throw error;
    }
  }

  /**
   * Make a GET request
   */
  public async get<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  public async post<T>(
    endpoint: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  public async put<T>(
    endpoint: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * Make a DELETE request
   */
  public async delete<T>(
    endpoint: string,
    options: Omit<RequestOptions, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Parse error response from the API
   */
  private async parseErrorResponse(
    response: Response
  ): Promise<{ message: string; details?: Record<string, unknown> }> {
    try {
      const data = await response.json();
      return {
        message: data.message || data.error || 'An error occurred',
        details: data.details,
      };
    } catch {
      return {
        message: `Request failed with status ${response.status}`,
      };
    }
  }
}

/**
 * Singleton API client instance
 */
export const apiClient = new ApiClient();

/**
 * Export the ApiClient class for testing purposes
 */
export { ApiClient };
