'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileText, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useArticles } from '@/hooks/useArticles';
import { useArticleSearch } from '@/hooks/useArticleSearch';
import {
  ArticleSearch,
  type ArticleSearchState,
  toSearchParams,
  hasActiveFilters,
} from '@/components/articles/ArticleSearch';
import { PAGINATION_CONFIG } from '@/lib/constants/pagination';
import { validatePaginationParams } from '@/lib/api/utils/pagination';

/**
 * Articles List Page Content
 *
 * Wrapped in Suspense boundary for useSearchParams compatibility.
 */
function ArticlesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get pagination parameters from URL with validation
  const validatedParams = validatePaginationParams(new URLSearchParams(searchParams.toString()));
  const { page, limit } = validatedParams;

  // Get search parameters from URL
  const keyword = searchParams.get('keyword') || '';
  const sourceId = searchParams.get('source_id')
    ? parseInt(searchParams.get('source_id')!, 10)
    : null;
  const fromDate = searchParams.get('from') || null;
  const toDate = searchParams.get('to') || null;

  // Search state
  const [searchState, setSearchState] = React.useState<ArticleSearchState>({
    keyword,
    sourceId,
    fromDate,
    toDate,
  });

  // Determine if we're in search mode
  const isSearchMode = hasActiveFilters(searchState);

  // Fetch articles - conditionally enable based on mode to prevent duplicate API calls
  const listResult = useArticles(
    {
      page,
      limit,
    },
    { enabled: !isSearchMode }
  );

  const searchResult = useArticleSearch(
    {
      ...toSearchParams(searchState),
      page,
      limit,
    },
    { enabled: isSearchMode }
  );

  // Use appropriate result based on mode
  const { articles, pagination, isLoading, error, refetch } = isSearchMode
    ? searchResult
    : listResult;

  // Redirect if page exceeds total pages
  React.useEffect(() => {
    if (!isLoading && pagination.totalPages > 0 && pagination.page > pagination.totalPages) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', pagination.totalPages.toString());
      router.replace(`/articles?${params.toString()}`);
    }
  }, [pagination.page, pagination.totalPages, isLoading, searchParams, router]);

  // Update URL when search state changes
  React.useEffect(() => {
    const params = new URLSearchParams();

    if (searchState.keyword) {
      params.set('keyword', searchState.keyword);
    }
    if (searchState.sourceId) {
      params.set('source_id', searchState.sourceId.toString());
    }
    if (searchState.fromDate) {
      params.set('from', searchState.fromDate);
    }
    if (searchState.toDate) {
      params.set('to', searchState.toDate);
    }
    params.set('page', '1'); // Reset to page 1 when filters change
    params.set('limit', limit.toString());

    router.push(`/articles?${params.toString()}`);
  }, [searchState, limit, router]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/articles?${params.toString()}`);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', newLimit.toString());
    params.set('page', '1'); // Reset to first page
    router.push(`/articles?${params.toString()}`);
  };

  return (
    <div className="container py-8">
      {/* Page Header */}
      <PageHeader title="Articles" description="Browse all articles from your sources" />

      {/* Search and Filter Panel */}
      <ArticleSearch
        searchState={searchState}
        onSearchChange={setSearchState}
        isLoading={isLoading}
      />

      {/* Error State */}
      {error && (
        <div className="mb-6">
          <ErrorMessage error={error} onRetry={refetch} />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <Skeleton className="mb-2 h-6 w-3/4" />
              <Skeleton className="mb-4 h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && articles.length === 0 && (
        <EmptyState
          title={isSearchMode ? 'No articles found' : 'No articles yet'}
          description={
            isSearchMode
              ? 'Try adjusting your search keywords or filters.'
              : 'Articles will appear here once they are added by the feed crawler.'
          }
          icon={
            isSearchMode ? <Search className="h-12 w-12" /> : <FileText className="h-12 w-12" />
          }
        />
      )}

      {/* Success State - Articles List */}
      {!isLoading && !error && articles.length > 0 && (
        <>
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onItemsPerPageChange={handleItemsPerPageChange}
                availablePageSizes={PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Articles List Page
 *
 * Protected page that displays a paginated list of all articles.
 * Requires authentication - unauthenticated users will be redirected by middleware.
 *
 * Wrapped in Suspense boundary for useSearchParams compatibility with Next.js 15.
 */
export default function ArticlesPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-8">
          <PageHeader title="Articles" description="Browse all articles from your sources" />
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-6">
                <Skeleton className="mb-2 h-6 w-3/4" />
                <Skeleton className="mb-4 h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ArticlesPageContent />
    </Suspense>
  );
}
