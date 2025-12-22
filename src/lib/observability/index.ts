/**
 * Observability Module
 *
 * Centralized exports for observability utilities including:
 * - Distributed tracing
 * - Custom metrics collection
 * - User context management
 *
 * @module lib/observability
 */

// Export tracing utilities
export {
  getRequestId,
  startSpan,
  addTracingHeaders,
  setUserContext,
  clearUserContext,
  addContext,
  addBreadcrumb,
} from './tracing';

export type { UserContext } from './tracing';

// Export metrics utilities
export { trackMetric, metrics } from './metrics';
