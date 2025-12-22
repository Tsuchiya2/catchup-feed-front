/**
 * Custom Metrics Collection
 *
 * Provides functions to track custom business and performance metrics.
 * Integrates with Sentry for metrics collection when enabled.
 *
 * @module lib/observability/metrics
 */

import * as Sentry from '@sentry/nextjs';
import { appConfig } from '@/config';

/**
 * Accumulated metrics storage
 * Used to maintain metric history in Sentry context
 */
const accumulatedMetrics: Record<
  string,
  { value: number; timestamp: number; [key: string]: unknown }
> = {};

/**
 * Track a custom metric
 *
 * Sends a metric to Sentry if metrics collection is enabled.
 * Silently fails if Sentry is not configured or metrics are disabled.
 *
 * Note: This implementation uses Sentry breadcrumbs and context for tracking
 * business metrics until Sentry Metrics API becomes stable.
 *
 * @param name - Metric name (e.g., "auth.login.success")
 * @param value - Metric value (typically 1 for counters)
 * @param tags - Optional tags for filtering and grouping
 *
 * @example
 * ```typescript
 * trackMetric('auth.login.success', 1);
 * trackMetric('api.latency', 150, { endpoint: '/articles' });
 * ```
 */
export function trackMetric(name: string, value: number, tags?: Record<string, string>): void {
  // Only track metrics if enabled in configuration
  if (!appConfig.observability.enableMetrics) {
    return;
  }

  // Only track metrics if Sentry DSN is configured
  if (!appConfig.observability.sentryDsn) {
    return;
  }

  try {
    // Track metrics using Sentry breadcrumbs
    // This provides visibility into metric events in error context
    Sentry.addBreadcrumb({
      category: 'metric',
      message: name,
      level: 'info',
      data: {
        value,
        ...tags,
      },
    });

    // Accumulate metrics and set as context for better filtering in Sentry
    accumulatedMetrics[name] = {
      value,
      timestamp: Date.now(),
      ...tags,
    };
    Sentry.setContext('metrics', accumulatedMetrics);
  } catch (error) {
    // Silently fail if Sentry is not initialized or there's an error
    // We don't want metrics tracking to break the application
  }
}

/**
 * Custom Metrics API
 *
 * Organized collection of business and performance metrics.
 * All metrics are tracked only when enabled via configuration.
 */
export const metrics = {
  /**
   * Authentication Metrics
   */
  login: {
    /**
     * Track successful login
     */
    success: () => trackMetric('auth.login.success', 1),

    /**
     * Track failed login
     *
     * @param reason - Failure reason (e.g., "invalid_credentials", "user_not_found")
     */
    failure: (reason?: string) =>
      trackMetric('auth.login.failure', 1, reason ? { reason } : undefined),

    /**
     * Track token refresh
     *
     * @param status - Refresh status ('success' or 'failure')
     * @param reason - Failure reason (optional, e.g., "no_refresh_token", "max_retries_exceeded")
     */
    tokenRefresh: (status: 'success' | 'failure', reason?: string) =>
      trackMetric('auth.token.refresh', 1, {
        status,
        ...(reason ? { reason } : {}),
      }),

    /**
     * Track logout
     */
    logout: () => trackMetric('auth.logout', 1),
  },

  /**
   * Article Metrics
   */
  article: {
    /**
     * Track article view
     *
     * @param articleId - Article ID (optional)
     */
    view: (articleId?: string) =>
      trackMetric('article.view', 1, articleId ? { article_id: articleId } : undefined),

    /**
     * Track article search
     *
     * @param query - Search query
     */
    search: (query: string) =>
      trackMetric('article.search', 1, { query_length: String(query.length) }),

    /**
     * Track AI summary view
     *
     * @param articleId - Article ID (optional)
     */
    aiSummaryView: (articleId?: string) =>
      trackMetric('article.ai_summary.view', 1, articleId ? { article_id: articleId } : undefined),

    /**
     * Track article list load
     *
     * @param count - Number of articles loaded
     */
    listLoad: (count: number) => trackMetric('article.list.load', 1, { count: String(count) }),
  },

  /**
   * Source Metrics
   */
  source: {
    /**
     * Track source view
     *
     * @param sourceId - Source ID (optional)
     */
    view: (sourceId?: string) =>
      trackMetric('source.view', 1, sourceId ? { source_id: sourceId } : undefined),

    /**
     * Track source search
     *
     * @param query - Search query
     */
    search: (query: string) =>
      trackMetric('source.search', 1, { query_length: String(query.length) }),

    /**
     * Track source list load
     *
     * @param count - Number of sources loaded
     */
    listLoad: (count: number) => trackMetric('source.list.load', 1, { count: String(count) }),
  },

  /**
   * Performance Metrics
   */
  performance: {
    /**
     * Track API latency
     *
     * @param endpoint - API endpoint (e.g., "/articles")
     * @param ms - Latency in milliseconds
     * @param status - HTTP status code (optional)
     */
    apiLatency: (endpoint: string, ms: number, status?: number) =>
      trackMetric('api.latency', ms, {
        endpoint,
        ...(status ? { status: String(status) } : {}),
      }),

    /**
     * Track bundle size
     *
     * @param size - Bundle size in bytes
     * @param bundle - Bundle name (e.g., "main", "vendor")
     */
    bundleSize: (size: number, bundle?: string) =>
      trackMetric('bundle.size', size, bundle ? { bundle } : undefined),

    /**
     * Track page load time
     *
     * @param page - Page route (e.g., "/articles")
     * @param ms - Load time in milliseconds
     */
    pageLoad: (page: string, ms: number) => trackMetric('page.load', ms, { page }),
  },

  /**
   * PWA Metrics
   */
  pwa: {
    /**
     * Track PWA install
     */
    install: () => trackMetric('pwa.install', 1),

    /**
     * Track PWA update
     */
    update: () => trackMetric('pwa.update', 1),

    /**
     * Track service worker activation
     */
    swActivation: () => trackMetric('pwa.sw.activation', 1),
  },

  /**
   * Error Metrics
   */
  error: {
    /**
     * Track API error
     *
     * @param endpoint - API endpoint
     * @param status - HTTP status code
     */
    api: (endpoint: string, status: number) =>
      trackMetric('error.api', 1, { endpoint, status: String(status) }),

    /**
     * Track network error
     */
    network: () => trackMetric('error.network', 1),

    /**
     * Track JavaScript error
     *
     * @param type - Error type (e.g., "TypeError", "ReferenceError")
     */
    javascript: (type?: string) => trackMetric('error.javascript', 1, type ? { type } : undefined),
  },

  /**
   * User Engagement Metrics
   */
  engagement: {
    /**
     * Track session duration
     *
     * @param minutes - Session duration in minutes
     */
    sessionDuration: (minutes: number) => trackMetric('engagement.session.duration', minutes),

    /**
     * Track page view
     *
     * @param page - Page route
     */
    pageView: (page: string) => trackMetric('engagement.page.view', 1, { page }),

    /**
     * Track user interaction
     *
     * @param action - Action name (e.g., "button_click", "form_submit")
     * @param target - Target element (optional)
     */
    interaction: (action: string, target?: string) =>
      trackMetric('engagement.interaction', 1, {
        action,
        ...(target ? { target } : {}),
      }),
  },
};
