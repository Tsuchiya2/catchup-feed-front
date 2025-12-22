/**
 * Sentry Server Configuration
 *
 * This file configures Sentry for server-side error tracking.
 * It is automatically loaded by Next.js instrumentation for Node.js runtime.
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

    // Release tracking (uses Vercel Git commit SHA if available)
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // Server-specific integrations
    integrations: [
      // HTTP integration for tracking HTTP requests
      Sentry.httpIntegration(),
    ],

    // Before sending events - filter and scrub sensitive data
    beforeSend(event, hint) {
      // Scrub sensitive data from request headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
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
  });
}
