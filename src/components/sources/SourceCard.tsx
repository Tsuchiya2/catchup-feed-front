/**
 * SourceCard Component
 *
 * Displays a source (RSS feed) in a card format with:
 * - Source name and RSS icon
 * - Edit button (admin only, when onEdit provided)
 * - Feed URL (truncated with tooltip)
 * - Active/Inactive status badge (non-admin) or toggle (admin)
 * - Last crawled timestamp
 * - Cyber/glow theme styling
 */
import * as React from 'react';
import { Rss, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import type { Source } from '@/types/api';
import type { UserRole } from '@/lib/auth/role';
import { StatusBadge } from './StatusBadge';
import { ActiveToggle } from './ActiveToggle';
import { SOURCE_TEST_IDS, SOURCE_ARIA_LABELS } from '@/constants/source';

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
  /** Callback when edit button is clicked (admin only) */
  onEdit?: (source: Source) => void;
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
 *   onEdit={handleEdit}
 * />
 * ```
 */
export const SourceCard = React.memo(function SourceCard({
  source,
  className,
  userRole,
  onUpdateActive,
  onEdit,
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
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-foreground">{source.name}</h3>
              {isAdmin && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onEdit(source)}
                  data-testid={SOURCE_TEST_IDS.EDIT_BUTTON}
                  aria-label={SOURCE_ARIA_LABELS.EDIT_BUTTON(source.name)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Feed URL */}
        <div className="min-w-0">
          <a
            href={source.feed_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            title={source.feed_url}
            aria-label={`Visit feed: ${source.feed_url}`}
          >
            {source.feed_url}
          </a>
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
