import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import { truncateText } from '@/lib/utils/truncate';
import { normalizeSourceName } from '@/utils/article';
import type { Article } from '@/types/api';

interface ArticleCardProps {
  article: Article;
  sourceName?: string;
  className?: string;
}

/**
 * ArticleCard Component
 *
 * Displays an article in list view with:
 * - Title (bold, larger font)
 * - Summary (2-line truncated, muted)
 * - Metadata: Source badge, Published date
 * - Hover effects for interactivity
 *
 * Links to article detail page (/articles/[id])
 *
 * Memoized to prevent unnecessary re-renders in lists.
 *
 * @example
 * <ArticleCard article={article} sourceName="Tech Blog" />
 */
export const ArticleCard = React.memo(function ArticleCard({
  article,
  sourceName,
  className,
}: ArticleCardProps) {
  // Safe field access with fallbacks
  const title = article.title?.trim() || 'Untitled Article';
  const summary = article.summary?.trim() || '';
  const publishedDate = article.published_at;
  const displaySourceName = normalizeSourceName(sourceName ?? article.source_name);

  return (
    <Link
      href={`/articles/${article.id}`}
      className={cn(
        'group block rounded-lg border bg-card p-6 shadow-sm transition-all',
        'hover:border-primary hover:bg-accent hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      aria-label={`Article: ${title}`}
    >
      <article className="flex flex-col space-y-3">
        {/* Article Title */}
        <h2 className="text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {title}
        </h2>

        {/* Article Summary */}
        {summary && (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {truncateText(summary, 150)}
          </p>
        )}

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {/* Source Badge */}
          <Badge variant="secondary" className="font-normal">
            {displaySourceName}
          </Badge>

          {/* Published Date */}
          {publishedDate && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <time dateTime={publishedDate} className="tabular-nums">
                {formatRelativeTime(publishedDate)}
              </time>
            </>
          )}
        </div>
      </article>
    </Link>
  );
});
