/**
 * useArticleSearch Hook
 *
 * Custom React hook for searching articles with multi-keyword and filters.
 * Uses React Query for cache management with 60s stale time.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { searchArticles } from '@/lib/api/endpoints/articles';
import { extractPaginationMetadata } from '@/lib/api/utils/pagination';
import type { Article, PaginationInfo } from '@/types/api';
import type { ArticleSearchParams } from '@/lib/api/endpoints/articles';

/**
 * Article search hook return type
 */
interface UseArticleSearchReturn {
  /** Array of articles */
  articles: Article[];
  /** Pagination information */
  pagination: PaginationInfo;
  /** Whether the articles are being fetched */
  isLoading: boolean;
  /** Error from the last fetch attempt, or null */
  error: Error | null;
  /** Function to manually refetch articles */
  refetch: () => void;
}

/**
 * Hook options
 */
interface UseArticleSearchOptions {
  /** Whether the query should be enabled (default: true) */
  enabled?: boolean;
}

/**
 * Custom hook for searching articles
 *
 * @param params - Search parameters (keyword, source_id, from, to, page, limit)
 * @param options - Hook options (enabled)
 * @returns Articles data, pagination, loading state, and refetch function
 *
 * @example
 * ```typescript
 * function ArticleSearch() {
 *   const [params, setParams] = useState<ArticleSearchParams>({
 *     keyword: 'React',
 *     source_id: 1,
 *     page: 1,
 *     limit: 10,
 *   });
 *
 *   const { articles, isLoading, error } = useArticleSearch(params, { enabled: true });
 *
 *   return (
 *     <div>
 *       {articles.map((article) => (
 *         <ArticleCard key={article.id} article={article} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArticleSearch(
  params?: ArticleSearchParams,
  options?: UseArticleSearchOptions
): UseArticleSearchReturn {
  // Query key includes all search params for cache isolation
  const queryKey = ['articles', 'search', params ?? {}];

  const {
    data,
    isLoading,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await searchArticles(params);
      return response;
    },
    staleTime: 60000, // 60 seconds
    retry: 1,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });

  const refetch = () => {
    refetchQuery();
  };

  // Extract articles and pagination from new paginated response format
  const articles = data?.data ?? [];
  const pagination = data?.pagination
    ? extractPaginationMetadata(data.pagination)
    : {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        total: 0,
        totalPages: 0,
      };

  return {
    articles,
    pagination,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Re-export types for convenience
export type { ArticleSearchParams };
