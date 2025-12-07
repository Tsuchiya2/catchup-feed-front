'use client';

import * as React from 'react';
import { Rss } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { SourceCard } from '@/components/sources/SourceCard';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useSources } from '@/hooks/useSources';
import { getUserRole } from '@/lib/auth/role';
import { updateSourceActive } from '@/lib/api/endpoints/sources';
import type { UserRole } from '@/lib/auth/role';
import type { Source } from '@/types/api';

/**
 * Sources List Page
 *
 * Protected page that displays a grid of RSS/Atom feed sources.
 * Admin users can toggle source active status.
 * Non-admin users see read-only status badges.
 * Requires authentication - unauthenticated users will be redirected by middleware.
 */
export default function SourcesPage() {
  // User role state
  const [userRole, setUserRole] = React.useState<UserRole>(null);

  // Fetch sources
  const { sources, isLoading, error, refetch } = useSources();

  // Query client for cache manipulation
  const queryClient = useQueryClient();

  // Detect user role on component mount
  React.useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  // Mutation for updating source active status with optimistic updates
  const mutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return updateSourceActive(id, active);
    },
    onMutate: async ({ id, active }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['sources'] });

      // Snapshot previous value for rollback
      const previousSources = queryClient.getQueryData<Source[]>(['sources']);

      // Optimistically update cache
      queryClient.setQueryData<Source[]>(['sources'], (old) => {
        if (!old) return old;
        return old.map((source) => (source.id === id ? { ...source, active } : source));
      });

      // Return context with previous value
      return { previousSources };
    },
    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousSources) {
        queryClient.setQueryData(['sources'], context.previousSources);
      }
    },
    onSettled: () => {
      // Always refetch to ensure consistency with backend
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });

  /**
   * Handle source active status update
   * Called by SourceCard's ActiveToggle component
   */
  const handleUpdateActive = React.useCallback(
    async (sourceId: number, active: boolean) => {
      await mutation.mutateAsync({ id: sourceId, active });
    },
    [mutation]
  );

  return (
    <div className="container py-8">
      {/* Page Header */}
      <PageHeader title="Sources" description="RSS/Atom feeds being tracked" />

      {/* Error State */}
      {error && (
        <div className="mb-6">
          <ErrorMessage error={error} onRetry={refetch} />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <div className="mb-4 flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && sources.length === 0 && (
        <EmptyState
          title="No sources configured"
          description="Feed sources will appear here once they are added by the administrator."
          icon={<Rss className="h-12 w-12" />}
        />
      )}

      {/* Success State - Sources Grid */}
      {!isLoading && !error && sources.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                userRole={userRole}
                onUpdateActive={handleUpdateActive}
              />
            ))}
          </div>

          {/* Total Count */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Total: {sources.length} source{sources.length !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
}
