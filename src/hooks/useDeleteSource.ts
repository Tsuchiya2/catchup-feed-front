/**
 * useDeleteSource Hook
 *
 * Custom React hook for deleting a source.
 * Uses React Query mutation with optimistic updates and rollback on error.
 *
 * Features:
 * - Optimistic cache updates for instant UI feedback
 * - Automatic rollback on error
 * - Comprehensive observability (logging, metrics, tracing)
 * - Error tracking with Sentry integration
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/nextjs';
import { deleteSource } from '@/lib/api/endpoints/sources';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/observability/metrics';
import { startSpan, addBreadcrumb, addContext } from '@/lib/observability/tracing';
import type { SourcesResponse } from '@/types/api';
import { ApiError } from '@/lib/api/client';

/**
 * Delete source hook return type
 */
interface UseDeleteSourceReturn {
  /** Function to delete a source (fire and forget) */
  deleteSource: (params: { id: number }) => void;
  /** Async function that can be awaited for completion */
  mutateAsync: (params: { id: number }) => Promise<void>;
  /** Whether a delete operation is in progress */
  isPending: boolean;
  /** Error from the last delete attempt, or null */
  error: Error | null;
  /** Function to reset mutation state */
  reset: () => void;
  /** Whether the mutation was successful */
  isSuccess: boolean;
}

/**
 * Classify error type for metrics and logging
 *
 * @param error - The error to classify
 * @returns Error type string
 */
function classifyErrorType(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return 'auth';
    if (error.status === 404) return 'not_found';
    if (error.status >= 500) return 'server';
    return 'api';
  }
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'network';
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return 'timeout';
  }
  return 'unknown';
}

/**
 * Get HTTP status from error if available
 *
 * @param error - The error to extract status from
 * @returns HTTP status code or undefined
 */
function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) {
    return error.status;
  }
  return undefined;
}

/**
 * Custom hook for deleting sources
 *
 * Provides mutation function with optimistic updates and automatic cache invalidation.
 * On mutation start, optimistically removes the source from the cache.
 * On error, rolls back to the previous state.
 * On success, invalidates the ['sources'] cache to refresh from the server.
 *
 * Includes comprehensive observability:
 * - Structured logging for all operations
 * - Metrics tracking (attempt, success, failure, rollback)
 * - Distributed tracing with Sentry
 * - Error tracking with context
 *
 * @returns Mutation function, loading state, error, and reset function
 *
 * @example
 * ```typescript
 * function DeleteSourceButton({ sourceId }: { sourceId: number }) {
 *   const { deleteSource, isPending, error, reset } = useDeleteSource();
 *
 *   const handleDelete = async () => {
 *     try {
 *       await deleteSource({ id: sourceId });
 *       console.log('Source deleted!');
 *     } catch (err) {
 *       console.error('Failed to delete source');
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleDelete} disabled={isPending}>
 *       {isPending ? 'Deleting...' : 'Delete Source'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useDeleteSource(): UseDeleteSourceReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const startTime = Date.now();

      // Log mutation start
      logger.info('Source deletion initiated', {
        sourceId: id,
        operation: 'delete_source',
      });

      // Track metrics
      metrics.source.delete.attempt(id);

      // Add breadcrumb for tracing
      addBreadcrumb('Delete source mutation started', 'mutation', 'info', {
        sourceId: id,
      });

      // Add context for error tracking
      addContext('delete_operation', { sourceId: id, startTime });

      try {
        // Execute delete within trace span
        await startSpan(`Delete Source ${id}`, 'mutation.source.delete', async () => {
          await deleteSource(id);
        });

        const durationMs = Date.now() - startTime;

        // Log success
        logger.info('Source deleted successfully', {
          sourceId: id,
          duration_ms: durationMs,
          operation: 'delete_source',
        });

        // Track success metrics
        metrics.source.delete.success(id, durationMs);

        // Add success breadcrumb
        addBreadcrumb('Delete source mutation succeeded', 'mutation', 'info', {
          sourceId: id,
          duration_ms: durationMs,
        });
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const errorType = classifyErrorType(error);
        const status = getErrorStatus(error);

        // Log error
        logger.error('Source deletion failed', error as Error, {
          sourceId: id,
          duration_ms: durationMs,
          error_type: errorType,
          status,
          operation: 'delete_source',
        });

        // Track failure metrics
        metrics.source.delete.failure(id, errorType, status);

        // Add error breadcrumb
        addBreadcrumb('Delete source mutation failed', 'mutation', 'error', {
          sourceId: id,
          error_type: errorType,
          status,
        });

        // Capture exception in Sentry with context
        if (error instanceof Error) {
          Sentry.captureException(error, {
            tags: {
              operation: 'source.delete',
              error_type: errorType,
            },
            extra: {
              sourceId: id,
              duration_ms: durationMs,
              status,
            },
          });
        }

        throw error;
      }
    },
    onMutate: async ({ id }: { id: number }) => {
      // Cancel outgoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ['sources'] });

      // Snapshot the current sources cache
      const previousSources = queryClient.getQueryData<SourcesResponse>(['sources']);

      // Optimistically update the cache by filtering out the deleted source
      if (previousSources) {
        const optimisticSources = previousSources.filter((source) => source.id !== id);

        queryClient.setQueryData<SourcesResponse>(['sources'], optimisticSources);

        logger.debug('Optimistic cache update applied', {
          sourceId: id,
          previousCount: previousSources.length,
          newCount: optimisticSources.length,
          operation: 'delete_source',
        });
      }

      // Return snapshot for rollback on error
      return { previousSources };
    },
    onError: (_error, { id }, context) => {
      // Roll back to the previous state on error
      if (context?.previousSources) {
        queryClient.setQueryData(['sources'], context.previousSources);

        // Log cache rollback
        logger.warn('Cache rollback triggered', {
          sourceId: id,
          previousCount: context.previousSources.length,
          operation: 'delete_source',
        });

        // Track rollback metrics
        metrics.source.delete.cacheRollback(id);

        // Add rollback breadcrumb
        addBreadcrumb('Cache rollback applied', 'cache', 'warning', {
          sourceId: id,
          previousCount: context.previousSources.length,
        });
      }
    },
    onSuccess: () => {
      // Invalidate sources cache to refresh from server
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });

  return {
    deleteSource: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
    reset: mutation.reset,
    isSuccess: mutation.isSuccess,
  };
}
