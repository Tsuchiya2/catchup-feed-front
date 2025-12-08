/**
 * SourceCard Component
 *
 * Displays a source (RSS feed) in a card format with:
 * - Source name and RSS icon
 * - Feed URL (truncated with tooltip)
 * - Active/Inactive status badge (non-admin) or toggle (admin)
 * - Last crawled timestamp
 * - Cyber/glow theme styling
 */
import * as React from 'react';
import { Rss } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import type { Source } from '@/types/api';
import type { UserRole } from '@/lib/auth/role';
import { StatusBadge } from './StatusBadge';
import { ActiveToggle } from './ActiveToggle';

/**
 * Props for the SourceCard component
 */
interface SourceCardProps {
  /** The source data to display */
  source: Source;
  /** Additional CSS classes */
  className?: string;
  /** User role for conditional rendering */
  userRole: UserRole;
  /** Callback when active status is updated (admin only) */
  onUpdateActive?: (sourceId: number, active: boolean) => Promise<void>;
}

/**
 * SourceCard displays a source in a card format.
 *
 * Memoized to prevent unnecessary re-renders in lists.
 *
 * @example
 * ```tsx
 * <SourceCard
 *   source={source}
 *   userRole={userRole}
 *   onUpdateActive={handleUpdateActive}
 * />
 * ```
 */
export const SourceCard = React.memo(function SourceCard({
  source,
  className,
  userRole,
  onUpdateActive,
}: SourceCardProps) {
  const lastCrawled = source.last_crawled_at
    ? formatRelativeTime(source.last_crawled_at)
    : 'Never crawled';

  const isAdmin = userRole === 'admin';

  /**
   * Handle toggle callback
   * Wraps onUpdateActive to match ActiveToggle's expected signature
   */
  const handleToggle = React.useCallback(
    async (sourceId: number, active: boolean) => {
      if (onUpdateActive) {
        await onUpdateActive(sourceId, active);
      }
    },
    [onUpdateActive]
  );

  return (
    <Card
      className={cn('flex flex-col', className)}
      role="listitem"
      aria-label={`Source: ${source.name}`}
    >
      <CardContent className="flex flex-col gap-4 p-6">
        {/* Icon and Name */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-glow-sm">
            <Rss className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-foreground">{source.name}</h3>
          </div>
        </div>

        {/* Feed URL */}
        <div className="min-w-0">
          <p
            className="truncate text-xs text-muted-foreground"
            title={source.feed_url}
            aria-label={`Feed URL: ${source.feed_url}`}
          >
            {source.feed_url}
          </p>
        </div>

        {/* Status and Last Crawled */}
        <div className="flex items-center justify-between gap-2 pt-2">
          {/* Conditional rendering: Toggle for admin, Badge for non-admin */}
          {isAdmin && onUpdateActive ? (
            <ActiveToggle
              sourceId={source.id}
              sourceName={source.name}
              initialActive={source.active}
              onToggle={handleToggle}
            />
          ) : (
            <StatusBadge active={source.active} />
          )}
          <time
            className="text-xs text-muted-foreground"
            dateTime={source.last_crawled_at || undefined}
            aria-label={`Last crawled: ${lastCrawled}`}
          >
            {lastCrawled}
          </time>
        </div>
      </CardContent>
    </Card>
  );
});
