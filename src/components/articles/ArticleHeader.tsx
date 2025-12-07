import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import { normalizeSourceName } from '@/utils/article';
import type { Article } from '@/types/api';

interface ArticleHeaderProps {
  article: Article;
  sourceName?: string;
  className?: string;
}

/**
 * ArticleHeader Component
 *
 * Displays article header for detail page with:
 * - Title (h1, large, bold)
 * - Metadata: Source badge, Published date
 * - "Read Original Article" button with external link icon
 *
 * Used in article detail page (/articles/[id])
 *
 * @example
 * <ArticleHeader article={article} sourceName="Tech Blog" />
 */
export function ArticleHeader({ article, sourceName, className }: ArticleHeaderProps) {
  // Safe field access with fallbacks
  const title = article.title?.trim() || 'Untitled Article';
  const url = article.url || '#';
  const publishedDate = article.published_at;

  // Normalize source name with fallback to article.source_name
  const displaySourceName = normalizeSourceName(sourceName ?? article.source_name);

  return (
    <header className={cn('flex flex-col space-y-6', className)}>
      {/* Article Title */}
      <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
        {title}
      </h1>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {/* Source Badge */}
        {displaySourceName && displaySourceName !== 'Unknown Source' && (
          <Badge variant="secondary" className="font-normal">
            {displaySourceName}
          </Badge>
        )}

        {/* Published Date */}
        {publishedDate && (
          <>
            {displaySourceName && displaySourceName !== 'Unknown Source' && (
              <span className="text-muted-foreground/50">·</span>
            )}
            <time dateTime={publishedDate} className="tabular-nums">
              Published {formatRelativeTime(publishedDate)}
            </time>
          </>
        )}
      </div>

      {/* Read Original Article Button */}
      <div>
        <Button
          asChild
          variant="default"
          size="lg"
          className="w-full sm:w-auto"
          aria-label={`Read original article${displaySourceName && displaySourceName !== 'Unknown Source' ? ` on ${displaySourceName}` : ''}`}
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Read Original Article
          </a>
        </Button>
      </div>
    </header>
  );
}
