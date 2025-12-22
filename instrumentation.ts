/**
 * Next.js Instrumentation
 *
 * This file is automatically loaded by Next.js on server startup.
 * It loads the appropriate Sentry configuration based on the runtime.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

/**
 * Register function called when the server starts
 *
 * Loads Sentry configurations based on the runtime environment:
 * - Node.js runtime: Loads server-side Sentry configuration
 * - Edge runtime: Loads edge-compatible Sentry configuration
 */
export async function register() {
  // Load server-side Sentry configuration for Node.js runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  // Load edge-compatible Sentry configuration for Edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
