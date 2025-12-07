'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ArticleHeader } from '@/components/articles/ArticleHeader';
import { AISummaryCard } from '@/components/articles/AISummaryCard';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useArticle } from '@/hooks/useArticle';

/**
 * Article Detail Page
 *
 * Protected page that displays the full article with AI summary.
 * Requires authentication - unauthenticated users will be redirected by middleware.
 */
export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const articleId = parseInt(params.id || '0', 10);

  // Fetch article data
  const { article, isLoading, error, refetch } = useArticle(articleId);

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Articles', href: '/articles' },
    { label: article?.title || 'Loading...', href: undefined },
  ];

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6">
          <ErrorMessage error={error} onRetry={refetch} />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <Skeleton className="mb-4 h-10 w-3/4" />
            <Skeleton className="mb-2 h-6 w-1/2" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      )}

      {/* Not Found State */}
      {!isLoading && !error && !article && (
        <EmptyState
          title="Article not found"
          description="The article you're looking for doesn't exist or has been removed."
          icon={<FileText className="h-12 w-12" />}
          action={
            <Button onClick={() => router.push('/articles')} variant="outline">
              Back to Articles
            </Button>
          }
        />
      )}

      {/* Success State - Article Detail */}
      {!isLoading && !error && article && (
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Article Header */}
          <ArticleHeader article={article} sourceName={article.source_name} />

          {/* AI Summary Section */}
          <AISummaryCard summary={article.summary} />

          {/* Back Button */}
          <div className="pt-4">
            <Button onClick={handleBack} variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
