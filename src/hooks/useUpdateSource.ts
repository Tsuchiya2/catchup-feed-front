/**
 * useUpdateSource Hook
 *
 * Custom React hook for updating an existing source.
 * Uses React Query mutation with optimistic updates and rollback on error.
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSource } from '@/lib/api/endpoints/sources';
import type { UpdateSourceInput, Source, SourcesResponse } from '@/types/api';

/**
 * Update source hook return type
 */
interface UseUpdateSourceReturn {
  /** Function to update a source (fire and forget) */
  updateSource: (params: { id: number; data: UpdateSourceInput }) => void;
  /** Async function that can be awaited for completion */
  mutateAsync: (params: { id: number; data: UpdateSourceInput }) => Promise<void>;
  /** Whether an update operation is in progress */
  isPending: boolean;
  /** Error from the last update attempt, or null */
  error: Error | null;
  /** Function to reset mutation state */
  reset: () => void;
  /** Whether the mutation was successful */
  isSuccess: boolean;
}

/**
 * Custom hook for updating sources
 *
 * Provides mutation function with optimistic updates and automatic cache invalidation.
 * On mutation start, optimistically updates the cache with the new values.
 * On error, rolls back to the previous state.
 * On success, invalidates the ['sources'] cache to refresh from the server.
 *
 * @returns Mutation function, loading state, error, and reset function
 *
 * @example
 * ```typescript
 * function EditSourceForm({ sourceId }: { sourceId: number }) {
 *   const { updateSource, isPending, error, reset } = useUpdateSource();
 *
 *   const handleSubmit = async () => {
 *     try {
 *       await updateSource({
 *         id: sourceId,
 *         data: {
 *           name: 'Updated Tech Blog',
 *           feedURL: 'https://techblog.com/feed.xml',
 *           active: true
 *         }
 *       });
 *       console.log('Source updated!');
 *     } catch (err) {
 *       console.error('Failed to update source');
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleSubmit} disabled={isPending}>
 *       {isPending ? 'Updating...' : 'Update Source'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useUpdateSource(): UseUpdateSourceReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSourceInput }) => {
      await updateSource(id, data);
    },
    onMutate: async ({ id, data }: { id: number; data: UpdateSourceInput }) => {
      // Cancel outgoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ['sources'] });

      // Snapshot the current sources cache
      const previousSources = queryClient.getQueryData<SourcesResponse>(['sources']);

      // Optimistically update the cache with new values
      if (previousSources) {
        const optimisticSources = previousSources.map((source) => {
          if (source.id === id) {
            return {
              ...source,
              name: data.name,
              feed_url: data.feedURL,
              active: data.active,
            };
          }
          return source;
        });

        queryClient.setQueryData<SourcesResponse>(['sources'], optimisticSources);
      }

      // Return snapshot for rollback on error
      return { previousSources };
    },
    onError: (_error, _variables, context) => {
      // Roll back to the previous state on error
      if (context?.previousSources) {
        queryClient.setQueryData(['sources'], context.previousSources);
      }
    },
    onSuccess: () => {
      // Invalidate sources cache to refresh from server
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });

  return {
    updateSource: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
    reset: mutation.reset,
    isSuccess: mutation.isSuccess,
  };
}
