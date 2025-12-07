/**
 * useArticles Hook
 *
 * Custom React hook for fetching articles with pagination and filtering.
 * Uses React Query for cache management with 60s stale time.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getArticles } from '@/lib/api/endpoints/articles';
import { extractPaginationMetadata } from '@/lib/api/utils/pagination';
import type { Article, ArticlesQuery, PaginationInfo } from '@/types/api';

/**
 * Articles hook return type
 */
interface UseArticlesReturn {
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
interface UseArticlesOptions {
  /** Whether the query should be enabled (default: true) */
  enabled?: boolean;
}

/**
 * Custom hook for fetching articles
 *
 * @param query - Query parameters (page, limit, sourceId)
 * @param options - Hook options (enabled)
 * @returns Articles data, pagination, loading state, and refetch function
 *
 * @example
 * ```typescript
 * function ArticlesList() {
 *   const { articles, pagination, isLoading, error, refetch } = useArticles({
 *     page: 1,
 *     limit: 10,
 *   }, { enabled: true });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {articles.map((article) => (
 *         <div key={article.id}>{article.title}</div>
 *       ))}
 *       <p>Total: {pagination.total}</p>
 *       <button onClick={() => refetch()}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useArticles(
  query?: ArticlesQuery,
  options?: UseArticlesOptions
): UseArticlesReturn {
  // Query key includes filter params for cache isolation
  const queryKey = ['articles', query ?? {}];

  const {
    data,
    isLoading,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getArticles(query);
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
        page: query?.page ?? 1,
        limit: query?.limit ?? 10,
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
