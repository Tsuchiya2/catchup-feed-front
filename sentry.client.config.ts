/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for client-side error tracking and performance monitoring.
 * It is automatically loaded by Next.js instrumentation.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';
import { appConfig } from './src/config';

// Only initialize Sentry if DSN is configured
if (appConfig.observability.sentryDsn) {
  Sentry.init({
    dsn: appConfig.observability.sentryDsn,
    environment: appConfig.observability.environment,

    // Performance Monitoring
    tracesSampleRate: appConfig.observability.tracesSampleRate,

    // Capture errors from these origins
    allowUrls: [/https?:\/\/((staging|www)\.)?catchup-feed\.com/, /localhost/],

    // Release tracking (uses Vercel Git commit SHA if available)
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // Ignore specific errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded', // Benign browser error
      'Non-Error promise rejection captured', // Caught rejections
      /AbortError/, // Fetch aborts (intentional cancellations)
      'Network request failed', // Network errors are expected
    ],

    // Before sending events - filter and scrub sensitive data
    beforeSend(event, hint) {
      // Filter out localhost errors in production
      if (appConfig.env.isProduction && event.request?.url?.includes('localhost')) {
        return null;
      }

      // Scrub sensitive data from request headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // Scrub sensitive data from request data
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>;
        if (data.password) delete data.password;
        if (data.token) delete data.token;
        if (data.refreshToken) delete data.refreshToken;
      }

      return event;
    },

    // Integrations
    integrations: [
      // Browser tracing for Core Web Vitals and API performance
      Sentry.browserTracingIntegration({
        traceFetch: true, // Trace fetch requests
        traceXHR: true, // Trace XHR requests
        enableHTTPTimings: true, // Include HTTP timing information
      }),
      // Session replay for debugging (only in production with sampling)
      Sentry.replayIntegration({
        maskAllText: false, // Don't mask all text (mask only sensitive fields)
        blockAllMedia: false, // Don't block all media
        maskAllInputs: true, // Mask all input fields by default
      }),
    ],

    // Session replay sampling
    replaysSessionSampleRate: 0.1, // 10% of normal sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  });
}
