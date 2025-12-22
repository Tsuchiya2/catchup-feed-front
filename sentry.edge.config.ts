/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry for edge runtime (middleware, edge API routes).
 * It is automatically loaded by Next.js instrumentation for Edge runtime.
 *
 * Edge runtime has limitations, so this configuration is minimal.
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

    // Edge runtime has limited integration support
    // Only basic error tracking is available
  });
}
