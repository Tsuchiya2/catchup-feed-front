/**
 * useCreateSource Hook
 *
 * Custom React hook for creating a new source.
 * Uses React Query mutation with cache invalidation on success.
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSource } from '@/lib/api/endpoints/sources';
import type { CreateSourceInput } from '@/types/api';

/**
 * Create source hook return type
 */
interface UseCreateSourceReturn {
  /** Function to create a new source (fire and forget) */
  createSource: (data: CreateSourceInput) => void;
  /** Async function that can be awaited for completion */
  mutateAsync: (data: CreateSourceInput) => Promise<void>;
  /** Whether a create operation is in progress */
  isPending: boolean;
  /** Error from the last create attempt, or null */
  error: Error | null;
  /** Function to reset mutation state */
  reset: () => void;
  /** Whether the mutation was successful */
  isSuccess: boolean;
}

/**
 * Custom hook for creating sources
 *
 * Provides mutation function with automatic cache invalidation.
 * On successful creation, invalidates the ['sources'] cache to refresh the list.
 *
 * @returns Mutation function, loading state, error, and reset function
 *
 * @example
 * ```typescript
 * function AddSourceButton() {
 *   const { createSource, isPending, error, reset } = useCreateSource();
 *
 *   const handleSubmit = async () => {
 *     try {
 *       await createSource({
 *         name: 'Tech Blog',
 *         feedURL: 'https://techblog.com/feed.xml'
 *       });
 *       console.log('Source created!');
 *     } catch (err) {
 *       console.error('Failed to create source');
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleSubmit} disabled={isPending}>
 *       {isPending ? 'Creating...' : 'Create Source'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useCreateSource(): UseCreateSourceReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateSourceInput) => {
      await createSource(data);
    },
    onSuccess: () => {
      // Invalidate sources cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });

  return {
    createSource: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
    reset: mutation.reset,
    isSuccess: mutation.isSuccess,
  };
}
