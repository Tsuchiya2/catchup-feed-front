/**
 * Distributed Tracing Utilities
 *
 * Provides utilities for distributed tracing and request correlation across
 * frontend and backend services. Integrates with Sentry for trace propagation.
 *
 * @module lib/observability/tracing
 */

import * as Sentry from '@sentry/nextjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * User context for tracking
 */
export interface UserContext {
  id: string;
  email?: string;
  username?: string;
}

/**
 * Generate or retrieve request ID for distributed tracing
 *
 * If we're in a Sentry transaction, use the trace ID.
 * Otherwise, generate a new UUID.
 *
 * @returns Request ID for correlation
 */
export function getRequestId(): string {
  try {
    // Try to get active span from Sentry
    const span = Sentry.getActiveSpan();

    if (span) {
      // Get trace ID from current span
      const spanContext = Sentry.spanToJSON(span);
      if (spanContext && spanContext.trace_id) {
        return spanContext.trace_id;
      }
    }
  } catch (error) {
    // If Sentry is not initialized or there's an error, fall through
  }

  // Generate new request ID
  return uuidv4();
}

/**
 * Start a new trace span
 *
 * Wraps Sentry.startSpan to create a new trace span for operations.
 * Use this to measure the duration of specific operations.
 *
 * @param name - Human-readable name for the span (e.g., "API Request: GET /articles")
 * @param op - Operation type (e.g., "http.client", "db.query")
 * @param callback - Async function to execute within the span
 * @returns Promise resolving to the callback result
 *
 * @example
 * ```typescript
 * const articles = await startSpan(
 *   'Fetch Articles',
 *   'http.client',
 *   async () => {
 *     return await apiClient.get('/articles');
 *   }
 * );
 * ```
 */
export async function startSpan<T>(
  name: string,
  op: string,
  callback: () => Promise<T>
): Promise<T> {
  try {
    return await Sentry.startSpan(
      {
        name,
        op,
      },
      callback
    );
  } catch (error) {
    // If Sentry is not initialized, just execute the callback
    return callback();
  }
}

/**
 * Add request ID to API headers for correlation
 *
 * Adds X-Request-ID and X-Trace-ID headers to propagate trace context
 * to backend services for distributed tracing.
 *
 * @param headers - Existing headers object (optional)
 * @returns Headers with trace IDs added
 *
 * @example
 * ```typescript
 * const headers = addTracingHeaders({
 *   'Content-Type': 'application/json',
 * });
 * ```
 */
export function addTracingHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const requestId = getRequestId();

  return {
    ...headers,
    'X-Request-ID': requestId,
    'X-Trace-ID': requestId,
  };
}

/**
 * Set user context for error tracking
 *
 * Associates errors and transactions with a specific user.
 * Call this after successful login.
 *
 * @param user - User information
 *
 * @example
 * ```typescript
 * setUserContext({
 *   id: 'user-123',
 *   email: 'user@example.com',
 *   username: 'johndoe',
 * });
 * ```
 */
export function setUserContext(user: UserContext): void {
  try {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } catch (error) {
    // If Sentry is not initialized, silently ignore
  }
}

/**
 * Clear user context on logout
 *
 * Removes user context from error tracking.
 * Call this on logout to prevent user data leakage.
 *
 * @example
 * ```typescript
 * clearUserContext();
 * ```
 */
export function clearUserContext(): void {
  try {
    Sentry.setUser(null);
  } catch (error) {
    // If Sentry is not initialized, silently ignore
  }
}

/**
 * Add custom context to current scope
 *
 * Adds custom context data that will be included with errors and transactions.
 * Useful for adding request-specific metadata.
 *
 * @param key - Context key
 * @param value - Context value
 *
 * @example
 * ```typescript
 * addContext('route', '/articles');
 * addContext('query', { page: 1, limit: 10 });
 * ```
 */
export function addContext(key: string, value: unknown): void {
  try {
    Sentry.setContext(key, value as Record<string, unknown>);
  } catch (error) {
    // If Sentry is not initialized, silently ignore
  }
}

/**
 * Add breadcrumb for debugging
 *
 * Breadcrumbs are a trail of events that led to an error.
 * They help in debugging by providing context.
 *
 * @param message - Breadcrumb message
 * @param category - Breadcrumb category (e.g., "navigation", "api", "ui")
 * @param level - Severity level (default: "info")
 * @param data - Additional data
 *
 * @example
 * ```typescript
 * addBreadcrumb('User clicked login button', 'ui', 'info');
 * addBreadcrumb('API request failed', 'api', 'error', { endpoint: '/login' });
 * ```
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  try {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
    });
  } catch (error) {
    // If Sentry is not initialized, silently ignore
  }
}
